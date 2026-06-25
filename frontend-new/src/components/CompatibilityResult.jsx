import React, { useEffect, useRef } from "react";

const DIMENSIONS = [
  { key: "hobbies_match",       label: "Hobbies",        color: "#8B5E3C" },
  { key: "travel_alignment",    label: "Travel",          color: "#5C7A5A" },
  { key: "communication_style", label: "Communication",   color: "#A07830" },
  { key: "mbti_alignment",      label: "Personality",     color: "#7A5C8B" },
];

function RingDial({ score, label, color, delay }) {
  const circleRef = useRef(null);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = score == null ? 0 : Math.min(100, Math.max(0, score));
  const offset = circumference - (pct / 100) * circumference;

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.setProperty("--circumference", circumference);
    el.style.setProperty("--offset", offset);
    el.style.strokeDasharray = circumference;
    el.style.strokeDashoffset = circumference;
    const t = setTimeout(() => el.classList.add("ring-animate"), delay);
    return () => clearTimeout(t);
  }, [circumference, offset, delay]);

  return (
    <div className="flex flex-col items-center gap-3 fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#D9CFC0" strokeWidth="7" />
          <circle ref={circleRef} cx="44" cy="44" r={radius} fill="none"
            stroke={color} strokeWidth="7" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {score == null
            ? <span className="text-inkfade text-xs font-ui">N/A</span>
            : <span className="text-ink font-display font-bold text-lg leading-none">
                {Math.round(pct)}<span className="text-xs text-inkfade">%</span>
              </span>
          }
        </div>
      </div>
      <span className="text-inkfade text-xs font-ui font-medium tracking-wider uppercase">{label}</span>
    </div>
  );
}

export default function CompatibilityResult({ result, onBack }) {
  if (!result) return null;
  const { user1_name, user2_name, overall_compatibility, mbti_used, compatibility_breakdown } = result;

  const overallColor =
    overall_compatibility >= 75 ? "#5C7A5A" :
    overall_compatibility >= 50 ? "#A07830" : "#C0544A";

  return (
    <div className="fade-up space-y-5">
      <button onClick={onBack} className="text-inkfade hover:text-inksoft transition-colors font-ui text-sm">
        ← Back to peers
      </button>

      <div className="bg-parchment rounded-2xl border border-warm p-6 space-y-6 shadow-sm">
        {/* Names */}
        <div className="text-center space-y-1">
          <p className="text-inkfade text-xs font-ui uppercase tracking-widest">Compatibility between</p>
          <h2 className="font-display text-xl text-ink font-semibold">
            {user1_name} <span className="text-accentlt">&amp;</span> {user2_name}
          </h2>
        </div>

        {/* Overall */}
        <div className="flex flex-col items-center gap-1 py-5 border-y border-warm">
          <p className="text-inkfade text-xs font-ui uppercase tracking-widest">Overall Match</p>
          <span className="font-display text-6xl font-bold" style={{ color: overallColor }}>
            {Math.round(overall_compatibility)}%
          </span>
        </div>

        {/* Rings */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {DIMENSIONS.map((dim, i) => {
            const score = compatibility_breakdown[dim.key];
            if (dim.key === "mbti_alignment" && !mbti_used) {
              return (
                <div key={dim.key} className="flex flex-col items-center gap-3 opacity-30">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-warm flex items-center justify-center">
                    <span className="text-inkfade text-xs font-ui text-center leading-tight">No MBTI<br />data</span>
                  </div>
                  <span className="text-inkfade text-xs font-ui font-medium tracking-wider uppercase">{dim.label}</span>
                </div>
              );
            }
            return <RingDial key={dim.key} score={score} label={dim.label} color={dim.color} delay={i * 120} />;
          })}
        </div>

        {!mbti_used && (
          <p className="text-center text-inkfade text-xs font-ui">
            Personality score unavailable — one or both users haven't set their MBTI type.
          </p>
        )}
      </div>
    </div>
  );
}