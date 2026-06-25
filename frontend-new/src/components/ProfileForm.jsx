import React, { useState } from "react";
import { submitProfile } from "../api";
import HobbyCard, { HOBBIES } from "./HobbyCard";
import { ErrorBox, Spinner } from "./LandingPage";

const MBTI_TYPES = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
];

export default function ProfileForm({ onProfileSaved, onBack }) {
  const [form, setForm] = useState({
    user_id: "",
    name: "",
    role: "Student",
    selected_hobby_ids: [],
    travel_text: "",
    communication_text: "",
    mbti: "",
  });
  const [teacherPassword, setTeacherPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  function toggleHobby(id) {
    setForm((f) => ({
      ...f,
      selected_hobby_ids: f.selected_hobby_ids.includes(id)
        ? f.selected_hobby_ids.filter((h) => h !== id)
        : [...f.selected_hobby_ids, id],
    }));
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit() {
    setError(null);
    if (!form.user_id.trim() || !form.name.trim()) {
      setError("Username and display name are required."); return;
    }
    if (form.selected_hobby_ids.length === 0) {
      setError("Select at least one hobby."); return;
    }
    if (form.travel_text.trim().length < 10) {
      setError("Travel description must be at least 10 characters."); return;
    }
    if (form.communication_text.trim().length < 10) {
      setError("Communication style must be at least 10 characters."); return;
    }
    if (form.role === "Teacher" && !teacherPassword.trim()) {
      setError("Enter the teacher password to register as a Teacher."); return;
    }

    setLoading(true);
    try {
      await submitProfile(
        { ...form, mbti: form.mbti || null },
        form.role === "Teacher" ? teacherPassword : null
      );
      onProfileSaved(form.user_id, form.role);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 fade-up">
      {onBack && (
        <button onClick={onBack} className="text-inkfade hover:text-inksoft text-sm font-ui transition-colors">
          ← Back to sign in
        </button>
      )}

      <div>
        <h2 className="font-display text-2xl text-ink font-semibold">Create your profile</h2>
        <p className="text-inkfade text-sm font-ui mt-1">Tell us about yourself to find compatible peers.</p>
      </div>

      {/* Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Username" hint="No spaces — used to sign in later">
          <input value={form.user_id} onChange={set("user_id")} placeholder="e.g. riya_2025" className={inputCls} />
        </Field>
        <Field label="Display Name">
          <input value={form.name} onChange={set("name")} placeholder="e.g. Riya Sharma" className={inputCls} />
        </Field>
      </div>

      {/* Role */}
      <Field label="I am a…">
        <div className="flex gap-3">
          {["Student", "Teacher"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: r }))}
              className={`flex-1 py-2.5 rounded-xl font-ui font-semibold text-sm border-2 transition-all
                ${form.role === r
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-warm bg-cream text-inkfade hover:border-accentlt/40"
                }`}
            >
              {r}
            </button>
          ))}
        </div>
      </Field>

      {/* Teacher password — only visible when Teacher is selected */}
      {form.role === "Teacher" && (
        <Field label="Teacher Password" hint="Required to register as a Teacher">
          <input
            type="password"
            value={teacherPassword}
            onChange={(e) => setTeacherPassword(e.target.value)}
            placeholder="Enter the admin password"
            className={inputCls}
          />
        </Field>
      )}

      {/* Hobbies */}
      <Field label="Interests" hint={`${form.selected_hobby_ids.length} selected`}>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-1">
          {HOBBIES.map((h) => (
            <HobbyCard
              key={h.id}
              {...h}
              selected={form.selected_hobby_ids.includes(h.id)}
              onToggle={toggleHobby}
            />
          ))}
        </div>
      </Field>

      {/* Travel */}
      <Field label="Travel Persona" hint="How do you like to explore?">
        <textarea
          value={form.travel_text}
          onChange={set("travel_text")}
          rows={3}
          placeholder="e.g. I love rugged backpacking and waking up to mountain sunrises…"
          className={`${inputCls} resize-none`}
        />
      </Field>

      {/* Communication */}
      <Field label="Communication Style" hint="How do you connect with people?">
        <textarea
          value={form.communication_text}
          onChange={set("communication_text")}
          rows={3}
          placeholder="e.g. I'm a deep listener and introvert. I prefer quiet conversations over chiya…"
          className={`${inputCls} resize-none`}
        />
      </Field>

      {/* MBTI */}
      <Field label="MBTI Type" hint="Optional — improves match accuracy">
        <select value={form.mbti} onChange={set("mbti")} className={`${inputCls} cursor-pointer`}>
          <option value="">I don't know my type</option>
          {MBTI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      {error && <ErrorBox msg={error} />}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50
          disabled:cursor-not-allowed text-cream font-ui font-semibold text-sm transition-all
          shadow-sm active:scale-[0.98]"
      >
        {loading ? <Spinner /> : "Save profile & continue →"}
      </button>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-inksoft text-xs font-ui font-semibold uppercase tracking-widest">{label}</label>
        {hint && <span className="text-inkfade text-xs font-ui">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-cream border border-warm rounded-xl px-4 py-3 text-ink placeholder-inkfade " +
  "font-ui text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all";