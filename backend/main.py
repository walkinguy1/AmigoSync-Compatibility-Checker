from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util

app = FastAPI(title="AmigoSync Backend")

# --- CORS MIDDLEWARE SETUP ---
# This allows your upcoming React frontend to safely communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits requests from any origin for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],
)

# Initialize the lightweight multilingual model locally
print("Loading Multilingual MiniLM Model...")
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
print("Model loaded successfully!")

# Static Mapping for Hobby Cards
HOBBY_DESCRIPTIONS = {
    "sports": "I enjoy physical activities, playing outdoor sports, fitness, and staying active.",
    "gaming": "I like video games, competitive esports, online gaming, and interactive entertainment.",
    "cooking": "I love culinary arts, trying new recipes, baking, and cooking food.",
    "music": "I am passionate about music, playing instruments, listening to songs, and going to concerts."
}

# Data Schemes
class ProfileSchema(BaseModel):
    user_id: str
    name: str
    role: str  # Must be "Student" or "Teacher"
    selected_hobby_ids: List[str]
    travel_text: str
    communication_text: str
    mbti: Optional[str] = None

# Temporary In-Memory Database
db_profiles = {}

@app.get("/")
async def root():
    return {"message": "Welcome to the AmigoSync Backend API!"}

# 1. PROFILE SUBMISSION ENDPOINT
@app.post("/submit-profile")
async def submit_profile(profile: ProfileSchema):
    if profile.role not in ["Student", "Teacher"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'Student' or 'Teacher'.")
    db_profiles[profile.user_id] = profile
    return {"status": "success", "message": f"Profile saved for {profile.name} ({profile.user_id})"}

# 2. TEACHER/ADMIN OVERLOOK ENDPOINT
# Returns all data so the teacher can see everything registered in the system
@app.get("/admin/profiles")
async def get_all_profiles(requesting_user_id: str):
    # Security check: Ensure the person asking for all data actually exists and is a Teacher
    requestor = db_profiles.get(requesting_user_id)
    if not requestor or requestor.role != "Teacher":
        raise HTTPException(status_code=403, detail="Access denied. Only Teachers can overlook all records.")
    
    return db_profiles

# 3. PEER LIST ENDPOINT
# Allows a student to see a list of other people available to test compatibility with
@app.get("/peers")
async def get_available_peers(current_user_id: str):
    if current_user_id not in db_profiles:
        raise HTTPException(status_code=404, detail="User profile not found. Submit your profile first.")
    
    # Filter out the current user so they don't match with themselves
    peers = [
        {"user_id": p.user_id, "name": p.name, "role": p.role}
        for p in db_profiles.values() if p.user_id != current_user_id
    ]
    return peers

# 4. COMPATIBILITY COMPARISON ENDPOINT
@app.post("/compare")
async def compare_profiles(user1_id: str, user2_id: str):
    if user1_id not in db_profiles or user2_id not in db_profiles:
        raise HTTPException(status_code=404, detail="One or both users not found.")
        
    u1 = db_profiles[user1_id]
    u2 = db_profiles[user2_id]
    
    # Construct paragraph string from selected hobby cards
    u1_hobby_str = " ".join([HOBBY_DESCRIPTIONS.get(h, "") for h in u1.selected_hobby_ids])
    u2_hobby_str = " ".join([HOBBY_DESCRIPTIONS.get(h, "") for h in u2.selected_hobby_ids])
    
    # Compute embeddings for each distinct dimension
    emb_hobbies1 = model.encode(u1_hobby_str, convert_to_tensor=True)
    emb_hobbies2 = model.encode(u2_hobby_str, convert_to_tensor=True)
    
    emb_travel1 = model.encode(u1.travel_text, convert_to_tensor=True)
    emb_travel2 = model.encode(u2.travel_text, convert_to_tensor=True)
    
    emb_comm1 = model.encode(u1.communication_text, convert_to_tensor=True)
    emb_comm2 = model.encode(u2.communication_text, convert_to_tensor=True)
    
    # Calculate dimensional scores using cosine similarity
    score_hobbies = float(util.cos_sim(emb_hobbies1, emb_hobbies2)[0][0])
    score_travel = float(util.cos_sim(emb_travel1, emb_travel2)[0][0])
    score_comm = float(util.cos_sim(emb_comm1, emb_comm2)[0][0])
    
    return {
        "user1_name": u1.name,
        "user2_name": u2.name,
        "compatibility_breakdown": {
            "hobbies_match": round(max(0.0, score_hobbies) * 100, 2),
            "travel_alignment": round(max(0.0, score_travel) * 100, 2),
            "communication_style": round(max(0.0, score_comm) * 100, 2)
        }
    }