import React, { useEffect, useState } from "react";
import { getRecommendations } from "../api";
import CompatibilityResult from "./CompatibilityResult";

const TIER = (score) =>
  score >= 75 ? "#5C7A5A" : score >= 50 ? "#A07830" : "#C0544A";

function MiniBar({ label, value }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <span className="text-inkfade text-[10px] font-ui w-20 shrink-0 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-warm/70 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: TIER(pct) }}
        />
      </div>
      <span className="text-inkfade text-[10px] font-ui w-8 text-right">
        {value == null ? "—" : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

function RecommendationCard({ rank, rec, onViewFull }) {
  const { compatibility_breakdown: cb } = rec;
  const isTop = rank === 1;

  return (
    <div
      className={`relative rounded-2xl border p-4 sm:p-5 transition-all hover:-translate-y-0.5
        ${isTop
          ? "bg-gradient-to-br from-accent/10 via-parchment to-parchment border-accent/40 shadow-sm"
          : "bg-parchment border-warm"
        }`}
    >
      {isTop && (
        <span className="absolute -top-2.5 left-4 text-[10px] font-ui font-bold tracking-widest uppercase bg-accent text-cream px-2.5 py-1 rounded-full shadow-sm">
          ✦ Top match
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm
              ${isTop ? "bg-accent text-cream" : "bg-accent/15 text-accent"}`}
          >
            #{rank}
          </div>
          <div className="min-w-0">
            <p className="text-ink font-ui font-semibold text-sm truncate">
              {rec.user2_name}
            </p>
            <p className="text-inkfade text-xs font-ui truncate">
              {rec.user_id} · semantic match {Math.round(rec.semantic_similarity)}%
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p
            className="font-display text-2xl font-bold leading-none"
            style={{ color: TIER(rec.overall_compatibility) }}
          >
            {Math.round(rec.overall_compatibility)}%
          </p>
          <p className="text-inkfade text-[10px] font-ui uppercase tracking-widest mt-0.5">
            Overall
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <MiniBar label="Hobbies" value={cb.hobbies_match} />
        <MiniBar label="Travel" value={cb.travel_alignment} />
        <MiniBar label="Communication" value={cb.communication_style} />
        {rec.mbti_used && <MiniBar label="Personality" value={cb.mbti_alignment} />}
      </div>

      <button
        onClick={() => onViewFull(rec)}
        className="mt-4 w-full text-xs font-ui font-semibold py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
      >
        View full report →
      </button>
    </div>
  );
}

export default function Recommendations({ currentUserId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [fullResult, setFullResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getRecommendations(currentUserId, 6)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  if (fullResult) {
    return <CompatibilityResult result={fullResult} onBack={() => setFullResult(null)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-inkfade font-ui text-sm py-12 justify-center">
        <span className="w-4 h-4 border-2 border-warm border-t-accent rounded-full animate-spin" />
        Running semantic search…
      </div>
    );
  }

  if (error) return <p className="text-rose text-sm font-ui text-center py-8">{error}</p>;

  const recs = data?.recommendations ?? [];

  return (
    <div className="space-y-4 fade-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl text-ink font-semibold">Recommended for You</h2>
          <p className="text-inkfade text-sm font-ui mt-1">
            {recs.length === 0
              ? "No matches yet — check back once more students join."
              : `Ranked from ${data.candidates_searched} semantically similar profile${data.candidates_searched !== 1 ? "s" : ""} found via vector search.`}
          </p>
        </div>
        {recs.length > 0 && (
          <span className="text-[10px] font-ui font-semibold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-full">
            FAISS top-K · re-ranked
          </span>
        )}
      </div>

      {recs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-warm rounded-2xl">
          <p className="text-inkfade text-sm font-ui">
            We couldn't find anyone yet. Try the "All Peers" tab to browse manually.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recs.map((rec, i) => (
            <RecommendationCard
              key={rec.user_id}
              rank={i + 1}
              rec={rec}
              onViewFull={setFullResult}
            />
          ))}
        </div>
      )}
    </div>
  );
}
