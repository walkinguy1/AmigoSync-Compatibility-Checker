from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Optional
import sqlite3
import json
import os
import threading

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer, util

app = FastAPI(title="AmigoSync Backend")

# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODEL LOAD ---
print("Loading Multilingual MiniLM Model...")
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
print("Model loaded successfully!")

TEACHER_PASSWORD = os.getenv("TEACHER_PASSWORD", "tusharhoni")

# --- HOBBY DESCRIPTIONS ---
HOBBY_DESCRIPTIONS = {
    "sports":       "I enjoy physical activities, playing outdoor sports, fitness, and staying active.",
    "gaming":       "I like video games, competitive esports, online gaming, and interactive entertainment.",
    "cooking":      "I love culinary arts, trying new recipes, baking, and cooking food.",
    "music":        "I am passionate about music, playing instruments, listening to songs, and going to concerts.",
    "reading":      "I enjoy books, literature, storytelling, academic reading, and exploring new ideas through text.",
    "travel":       "I love exploring new places, experiencing different cultures, and going on adventures.",
    "art":          "I enjoy drawing, painting, digital design, creative expression, and visual arts.",
    "photography":  "I love capturing moments, visual storytelling, and learning about camera techniques.",
    "fitness":      "I enjoy gym workouts, yoga, cycling, and maintaining a healthy and active lifestyle.",
    "tech":         "I am interested in technology, programming, gadgets, and the latest innovations.",
    "movies":       "I love watching films, exploring different genres, and discussing cinema and storytelling.",
    "volunteering": "I care about community service, social work, helping others, and giving back.",
}

# --- SQLITE PERSISTENCE ---
DB_PATH = "amigosync.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            data    TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def save_profile_db(profile):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT OR REPLACE INTO profiles VALUES (?, ?)",
        (profile.user_id, profile.model_dump_json())
    )
    conn.commit()
    conn.close()

def load_all_profiles_db() -> dict:
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("SELECT user_id, data FROM profiles").fetchall()
    conn.close()
    return {r[0]: ProfileSchema(**json.loads(r[1])) for r in rows}

def delete_profile_db(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM profiles WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()

init_db()

# --- SEMANTIC VECTOR INDEX (FAISS) ---
# Each profile is encoded into a single weighted embedding (hobbies + travel +
# communication style) so it can be searched for top-K nearest neighbours.
# This powers the "Recommended Matches" feature: instead of running a full
# pairwise comparison against every other student (O(n) heavy transformer
# calls per request), FAISS does an exact nearest-neighbour lookup over
# pre-computed vectors in milliseconds, and only the short-list of
# candidates returned by FAISS gets the full weighted re-ranking below.
EMBED_DIM = model.get_sentence_embedding_dimension()

faiss_index = faiss.IndexFlatIP(EMBED_DIM)   # inner product == cosine sim on normalized vectors
faiss_id_map: List[str] = []                  # faiss row index -> user_id
faiss_lock = threading.Lock()


def hobby_text(profile: "ProfileSchema") -> str:
    return " ".join(
        HOBBY_DESCRIPTIONS.get(h, "") for h in profile.selected_hobby_ids
    ).strip() or "No hobbies specified."


def compute_profile_vector(profile: "ProfileSchema") -> np.ndarray:
    """Single semantic fingerprint for a profile: a weighted, re-normalized
    blend of the hobbies / travel / communication embeddings (same relative
    weights used by the no-MBTI compatibility formula)."""
    emb_h = model.encode(hobby_text(profile), normalize_embeddings=True)
    emb_t = model.encode(profile.travel_text, normalize_embeddings=True)
    emb_c = model.encode(profile.communication_text, normalize_embeddings=True)

    combined = (0.40 * emb_h) + (0.35 * emb_t) + (0.25 * emb_c)
    norm = np.linalg.norm(combined)
    if norm > 0:
        combined = combined / norm
    return combined.astype("float32")


def rebuild_faiss_index() -> None:
    """Recomputes the FAISS index from every Student profile in SQLite.
    Called on startup and after any profile create/update/delete so the
    index never drifts from the source of truth in the database."""
    global faiss_index, faiss_id_map

    profiles = load_all_profiles_db()
    students = [p for p in profiles.values() if p.role == "Student"]

    new_index = faiss.IndexFlatIP(EMBED_DIM)
    new_id_map: List[str] = []

    if students:
        vectors = np.vstack([compute_profile_vector(p) for p in students])
        new_index.add(vectors)
        new_id_map = [p.user_id for p in students]

    with faiss_lock:
        faiss_index = new_index
        faiss_id_map = new_id_map


def compute_compatibility(u1: "ProfileSchema", u2: "ProfileSchema") -> dict:
    """Full semantic compatibility breakdown between two profiles. Shared by
    both /compare (one-to-one) and /recommend (top-K re-ranking)."""
    emb_h1 = model.encode(hobby_text(u1), convert_to_tensor=True)
    emb_h2 = model.encode(hobby_text(u2), convert_to_tensor=True)
    emb_t1 = model.encode(u1.travel_text, convert_to_tensor=True)
    emb_t2 = model.encode(u2.travel_text, convert_to_tensor=True)
    emb_c1 = model.encode(u1.communication_text, convert_to_tensor=True)
    emb_c2 = model.encode(u2.communication_text, convert_to_tensor=True)

    score_hobbies = max(0.0, float(util.cos_sim(emb_h1, emb_h2)[0][0]))
    score_travel  = max(0.0, float(util.cos_sim(emb_t1, emb_t2)[0][0]))
    score_comm    = max(0.0, float(util.cos_sim(emb_c1, emb_c2)[0][0]))

    mbti_valid = (
        u1.mbti and u2.mbti
        and u1.mbti.upper() != "UNKNOWN"
        and u2.mbti.upper() != "UNKNOWN"
        and len(u1.mbti) == 4
        and len(u2.mbti) == 4
    )

    if mbti_valid:
        score_mbti = get_mbti_score(u1.mbti, u2.mbti)
        overall = (
            score_hobbies * 0.35 +
            score_travel  * 0.30 +
            score_comm    * 0.20 +
            score_mbti    * 0.15
        )
        mbti_result = round(score_mbti * 100, 2)
    else:
        overall = (
            score_hobbies * 0.40 +
            score_travel  * 0.35 +
            score_comm    * 0.25
        )
        mbti_result = None

    return {
        "user1_name": u1.name,
        "user2_name": u2.name,
        "overall_compatibility": round(overall * 100, 2),
        "mbti_used": mbti_valid,
        "compatibility_breakdown": {
            "hobbies_match":       round(score_hobbies * 100, 2),
            "travel_alignment":    round(score_travel  * 100, 2),
            "communication_style": round(score_comm    * 100, 2),
            "mbti_alignment":      mbti_result,
        }
    }


class ProfileSchema(BaseModel):
    user_id: str
    name: str
    role: str  # "Student" or "Teacher"
    selected_hobby_ids: List[str]
    travel_text: str
    communication_text: str
    mbti: Optional[str] = None

    @field_validator("role")
    @classmethod
    def valid_role(cls, v):
        if v not in ["Student", "Teacher"]:
            raise ValueError("Role must be 'Student' or 'Teacher'.")
        return v

    @field_validator("selected_hobby_ids")
    @classmethod
    def at_least_one_hobby(cls, v):
        if not v:
            raise ValueError("Select at least one hobby.")
        return v

    @field_validator("travel_text", "communication_text")
    @classmethod
    def min_length(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Must be at least 10 characters.")
        return v.strip()


class SubmitProfileRequest(BaseModel):
    profile: ProfileSchema
    teacher_password: Optional[str] = None  # Only required when role == "Teacher"


class CompareRequest(BaseModel):
    user1_id: str
    user2_id: str


class LoginRequest(BaseModel):
    user_id: str


class AdminLoginRequest(BaseModel):
    admin_id: str
    password: str


# --- MBTI COMPATIBILITY MATRIX (Cognitive Function Theory) ---
MBTI_MATRIX = {
    "INFP": {"ENFJ": 92, "ENTJ": 92, "INFJ": 65, "ENFP": 65, "INFP": 65, "ESTJ": 40, "ISTP": 40},
    "INFJ": {"ENFP": 92, "ENTP": 92, "INFP": 65, "INFJ": 65, "ENFJ": 65, "ESTP": 40, "ISTJ": 40},
    "INTJ": {"ENFP": 92, "ENTP": 92, "INTJ": 65, "INFJ": 65, "ENTJ": 65, "ESFP": 40, "ESFJ": 40},
    "INTP": {"ENTJ": 92, "ENFJ": 92, "INTP": 65, "ENTP": 65, "INFJ": 65, "ESFJ": 40, "ISFJ": 40},
    "ENFJ": {"INFP": 92, "ISFP": 92, "ENFJ": 65, "INFJ": 65, "ENFP": 65, "ISTP": 40, "ESTP": 40},
    "ENFP": {"INFJ": 92, "INTJ": 92, "ENFP": 65, "INFP": 65, "ENFJ": 65, "ISTJ": 40, "ESTJ": 40},
    "ENTJ": {"INTP": 92, "INFP": 92, "ENTJ": 65, "INTJ": 65, "ENTP": 65, "ISFP": 40, "ESFP": 40},
    "ENTP": {"INFJ": 92, "INTJ": 92, "ENTP": 65, "INTP": 65, "ENTJ": 65, "ISFJ": 40, "ESFJ": 40},
    "ISFJ": {"ESFP": 92, "ESTP": 92, "ISFJ": 65, "ISTJ": 65, "ESFJ": 65, "ENTP": 40, "INTP": 40},
    "ISFP": {"ENFJ": 92, "ESFJ": 92, "ISFP": 65, "ISTP": 65, "ESFP": 65, "ENTJ": 40, "INTJ": 40},
    "ISTJ": {"ESFP": 92, "ESTP": 92, "ISTJ": 65, "ISFJ": 65, "ESTJ": 65, "ENFP": 40, "INFP": 40},
    "ISTP": {"ESFJ": 92, "ESTJ": 92, "ISTP": 65, "ISFP": 65, "ESTP": 65, "INFJ": 40, "ENFJ": 40},
    "ESFJ": {"ISFP": 92, "ISTP": 92, "ESFJ": 65, "ESTJ": 65, "ISFJ": 65, "INTP": 40, "INTJ": 40},
    "ESFP": {"ISFJ": 92, "ISTJ": 92, "ESFP": 65, "ESTP": 65, "ISFP": 65, "INTJ": 40, "INTP": 40},
    "ESTJ": {"ISTP": 92, "ISFP": 92, "ESTJ": 65, "ESFJ": 65, "ISTJ": 65, "INFP": 40, "ENFP": 40},
    "ESTP": {"ISFJ": 92, "ISTJ": 92, "ESTP": 65, "ESFP": 65, "ISTP": 65, "INFJ": 40, "INFP": 40},
}

def get_mbti_score(type1: str, type2: str) -> Optional[float]:
    if not type1 or not type2:
        return None
    t1, t2 = type1.upper(), type2.upper()
    if t1 in MBTI_MATRIX and t2 in MBTI_MATRIX[t1]:
        return MBTI_MATRIX[t1][t2] / 100.0
    elif t2 in MBTI_MATRIX and t1 in MBTI_MATRIX[t2]:
        return MBTI_MATRIX[t2][t1] / 100.0
    return 0.60


# Build the semantic index now that ProfileSchema / scoring helpers exist.
rebuild_faiss_index()


# --- ROUTES ---

@app.get("/")
async def root():
    return {"message": "Welcome to the AmigoSync Backend API!"}


# 1. LOGIN — returns existing profile for returning users
@app.post("/login")
async def login(request: LoginRequest):
    profiles = load_all_profiles_db()
    profile = profiles.get(request.user_id.strip())
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for that username.")
    return {
        "status": "success",
        "user_id": profile.user_id,
        "name": profile.name,
        "role": profile.role,
    }


# 1.5. ADMIN LOGIN — for admin/teacher login with password
@app.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    if request.password != TEACHER_PASSWORD:
        raise HTTPException(status_code=403, detail="Incorrect admin password.")
    
    profiles = load_all_profiles_db()
    profile = profiles.get(request.admin_id.strip())
    
    if not profile:
        raise HTTPException(status_code=404, detail="Admin profile not found. Please register as a Teacher first.")
    
    if profile.role != "Teacher":
        raise HTTPException(status_code=403, detail="Access denied. Only Teachers can use admin login.")
    
    return {
        "status": "success",
        "user_id": profile.user_id,
        "name": profile.name,
        "role": profile.role,
    }


# 2. SUBMIT / UPDATE PROFILE
# Teacher registrations require the correct teacher_password.
@app.post("/submit-profile")
async def submit_profile(request: SubmitProfileRequest):
    profile = request.profile

    if profile.role == "Teacher":
        if not request.teacher_password:
            raise HTTPException(
                status_code=403,
                detail="A password is required to register as a Teacher."
            )
        if request.teacher_password != TEACHER_PASSWORD:
            raise HTTPException(
                status_code=403,
                detail="Incorrect teacher password."
            )

    save_profile_db(profile)
    rebuild_faiss_index()
    return {
        "status": "success",
        "message": f"Profile saved for {profile.name} ({profile.user_id})"
    }


# 3. GET OWN PROFILE
@app.get("/profile/{user_id}")
async def get_profile(user_id: str):
    profiles = load_all_profiles_db()
    profile = profiles.get(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return profile


# 4. DELETE OWN PROFILE
@app.delete("/profile/{user_id}")
async def delete_profile(user_id: str):
    profiles = load_all_profiles_db()
    if user_id not in profiles:
        raise HTTPException(status_code=404, detail="Profile not found.")
    delete_profile_db(user_id)
    rebuild_faiss_index()
    return {"status": "success", "message": f"Profile {user_id} deleted."}


# 5. PEER LIST (Students only, excludes self)
@app.get("/peers")
async def get_available_peers(current_user_id: str):
    profiles = load_all_profiles_db()
    if current_user_id not in profiles:
        raise HTTPException(
            status_code=404,
            detail="User profile not found. Submit your profile first."
        )
    peers = [
        {"user_id": p.user_id, "name": p.name, "role": p.role}
        for p in profiles.values()
        if p.user_id != current_user_id and p.role == "Student"
    ]
    return peers


# 6. TEACHER / ADMIN DASHBOARD
@app.get("/admin/profiles")
async def get_all_profiles(requesting_user_id: str):
    profiles = load_all_profiles_db()
    requestor = profiles.get(requesting_user_id)
    if not requestor or requestor.role != "Teacher":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Only Teachers can view all records."
        )
    return {uid: p.model_dump() for uid, p in profiles.items()}


# 7. COMPATIBILITY COMPARISON
@app.post("/compare")
async def compare_profiles(request: CompareRequest):
    profiles = load_all_profiles_db()

    u1 = profiles.get(request.user1_id)
    u2 = profiles.get(request.user2_id)

    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="One or both users not found.")

    return compute_compatibility(u1, u2)


# 8. TOP-K SEMANTIC RECOMMENDATIONS
# Two-stage recommender: FAISS does fast top-K candidate retrieval over the
# pre-computed profile vectors (semantic profile matching), then each
# candidate is re-ranked with the full weighted compatibility formula
# (hobbies / travel / communication / MBTI) for an accurate final order.
@app.get("/recommend/{user_id}")
async def recommend_matches(user_id: str, k: int = 5):
    if k < 1:
        k = 1
    if k > 25:
        k = 25

    profiles = load_all_profiles_db()
    user = profiles.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found. Submit your profile first.")

    with faiss_lock:
        pool_size = len(faiss_id_map)
        id_map_snapshot = list(faiss_id_map)
        index_snapshot = faiss_index

    if pool_size == 0:
        return {"user_id": user_id, "candidates_searched": 0, "recommendations": []}

    query_vec = compute_profile_vector(user).reshape(1, -1)

    # Widen the candidate pool beyond k so the weighted re-rank (which
    # includes MBTI and per-dimension weights FAISS doesn't see) can surface
    # the true best matches, not just the closest single-vector neighbours.
    search_k = min(max(k * 3, k + 5), pool_size)
    similarities, indices = index_snapshot.search(query_vec, search_k)

    candidate_ids = []
    for sim, idx in zip(similarities[0], indices[0]):
        if idx < 0:
            continue
        candidate_id = id_map_snapshot[idx]
        if candidate_id == user_id:
            continue
        candidate_ids.append((candidate_id, float(sim)))

    recommendations = []
    for candidate_id, semantic_sim in candidate_ids:
        candidate = profiles.get(candidate_id)
        if not candidate:
            continue
        result = compute_compatibility(user, candidate)
        result["user_id"] = candidate_id
        result["semantic_similarity"] = round(max(0.0, semantic_sim) * 100, 2)
        recommendations.append(result)

    recommendations.sort(key=lambda r: r["overall_compatibility"], reverse=True)

    return {
        "user_id": user_id,
        "candidates_searched": len(candidate_ids),
        "recommendations": recommendations[:k],
    }