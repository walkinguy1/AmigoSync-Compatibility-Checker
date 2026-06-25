import React, { useState } from "react";
import { submitProfile } from "../api";
import HobbyCard, { HOBBIES } from "./HobbyCard";

const MBTI_TYPES = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
];

export default function ProfileForm({ onProfileSaved }) {
  const [form, setForm] = useState({
    user_id: "",
    name: "",
    role: "Student",
    selected_hobby_ids: [],
    travel_text: "",
    communication_text: "",
    mbti: "",
  });
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
      setError("Username and display name are required.");
      return;
    }
    if (form.selected_hobby_ids.length === 0) {
      setError("Select at least one hobby.");
      return;
    }
    if (form.travel_text.trim().length < 10) {
      setError("Travel description must be at least 10 characters.");
      return;
    }
    if (form.communication_text.trim().length < 10) {
      setError("Communication style must be at least 10 characters.");
      return;
    }

    setLoading(true);
    try {
      await submitProfile({
        ...form,
        mbti: form.mbti || null,
      });
      onProfileSaved(form.user_id, form.role);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7 fade-up">
      <div>
        <h2 className="font-display text-2xl text-white font-semibold">Create your profile</h2>
        <p className="text-white/40 text-sm font-ui mt-1">Tell us about yourself to find compatible peers.</p>
      </div>

      {/* Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Username" hint="Used to identify you — no spaces">
          <input
            value={form.user_id}
            onChange={set("user_id")}
            placeholder="e.g. riya_2025"
            className={inputCls}
          />
        </Field>
        <Field label="Display Name">
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Riya Sharma"
            className={inputCls}
          />
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
                  ? "border-primary bg-primary/20 text-muted"
                  : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
                }`}
            >
              {r}
            </button>
          ))}
        </div>
      </Field>

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
      <Field label="Travel Persona" hint="How do you like to explore the world?">
        <textarea
          value={form.travel_text}
          onChange={set("travel_text")}
          rows={3}
          placeholder="e.g. I love rugged backpacking and waking up to mountain sunrises. Cities feel overwhelming but small towns feel like home…"
          className={`${inputCls} resize-none`}
        />
      </Field>

      {/* Communication */}
      <Field label="Communication Style" hint="How do you connect with people?">
        <textarea
          value={form.communication_text}
          onChange={set("communication_text")}
          rows={3}
          placeholder="e.g. I'm a deep listener and an introvert. I prefer long quiet conversations over chiya rather than big group hangouts…"
          className={`${inputCls} resize-none`}
        />
      </Field>

      {/* MBTI */}
      <Field label="MBTI Type" hint="Optional — improves match accuracy">
        <select value={form.mbti} onChange={set("mbti")} className={`${inputCls} cursor-pointer`}>
          <option value="">I don't know my type</option>
          {MBTI_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>

      {error && (
        <p className="text-rose text-sm font-ui bg-rose/10 border border-rose/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-primary hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed
          text-white font-ui font-semibold text-sm transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving profile…
          </span>
        ) : "Save profile & continue →"}
      </button>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-white/70 text-xs font-ui font-semibold uppercase tracking-widest">{label}</label>
        {hint && <span className="text-white/30 text-xs font-ui">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 " +
  "font-ui text-sm focus:outline-none focus:border-primary/60 focus:bg-white/8 transition-colors";
