import React, { useEffect, useState } from "react";
import { getAdminProfiles } from "../api";

export default function TeacherDashboard({ currentUserId }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    getAdminProfiles(currentUserId)
      .then((data) => setProfiles(Object.values(data)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.user_id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center gap-3 text-white/40 font-ui text-sm py-12 justify-center">
      <span className="w-4 h-4 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      Loading records…
    </div>
  );

  if (error) return <p className="text-rose text-sm font-ui text-center py-8">{error}</p>;

  return (
    <div className="space-y-5 fade-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl text-white font-semibold">Student Records</h2>
          <p className="text-white/40 text-sm font-ui mt-1">{profiles.length} profile{profiles.length !== 1 ? "s" : ""} registered</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or ID…"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 font-ui text-sm focus:outline-none focus:border-primary/60 transition-colors w-full sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-white/30 text-sm font-ui text-center py-10">No profiles match your search.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <ProfileCard key={p.user_id} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileCard({ profile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-white/10 rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-muted font-display font-bold text-xs">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-left">
            <p className="text-white font-ui font-medium text-sm">{profile.name}</p>
            <p className="text-white/30 text-xs font-ui">{profile.user_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile.mbti && (
            <span className="text-xs font-ui font-semibold px-2 py-1 rounded-md bg-violet-500/20 text-muted">
              {profile.mbti}
            </span>
          )}
          <span className={`text-xs font-ui font-medium px-2 py-1 rounded-md
            ${profile.role === "Teacher" ? "bg-amber-500/20 text-amber-300" : "bg-primary/20 text-muted"}`}>
            {profile.role}
          </span>
          <span className={`text-white/30 text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4 fade-up">
          {/* Hobbies */}
          <div className="space-y-1.5">
            <p className="text-white/30 text-xs font-ui uppercase tracking-widest">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.selected_hobby_ids.map((h) => (
                <span key={h} className="text-xs font-ui px-2.5 py-1 rounded-full bg-white/10 text-white/60 capitalize">{h}</span>
              ))}
            </div>
          </div>
          {/* Travel */}
          <div className="space-y-1.5">
            <p className="text-white/30 text-xs font-ui uppercase tracking-widest">Travel Persona</p>
            <p className="text-white/60 text-sm font-ui leading-relaxed">{profile.travel_text}</p>
          </div>
          {/* Communication */}
          <div className="space-y-1.5">
            <p className="text-white/30 text-xs font-ui uppercase tracking-widest">Communication Style</p>
            <p className="text-white/60 text-sm font-ui leading-relaxed">{profile.communication_text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
