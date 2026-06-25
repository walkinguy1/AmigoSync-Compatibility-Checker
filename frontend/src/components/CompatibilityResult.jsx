import React, { useEffect, useRef } from "react";

const DIMENSIONS = [
  { key: "hobbies_match",       label: "Hobbies",       color: "#7C3AED" },
  { key: "travel_alignment",    label: "Travel",         color: "#06B6D4" },
  { key: "communication_style", label: "Communication",  color: "#F43F5E" },
  { key: "mbti_alignment",      label: "Personality",    color: "#F59E0B" },
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
    const t = setTimeout(() => {
      el.classList.add("ring-animate");
    }, delay);
    return () => clearTimeout(t);
  }, [circumference, offset, delay]);

  return (
    <div className="flex flex-col items-center gap-3 fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          {/* Track */}
          <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
          {/* Fill */}
          <circle
            ref={circleRef}
            cx="44" cy="44" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {score == null ? (
            <span className="text-white/30 text-xs font-ui">N/A</span>
          ) : (
            <span className="text-white font-display font-bold text-lg leading-none">{Math.round(pct)}<span className="text-xs text-white/40">%</span></span>
          )}
        </div>
      </div>
      <span className="text-white/50 text-xs font-ui font-medium tracking-wider uppercase">{label}</span>
    </div>
  );
}

export default function CompatibilityResult({ result, onBack }) {
  if (!result) return null;

  const { user1_name, user2_name, overall_compatibility, mbti_used, compatibility_breakdown } = result;

  const overallColor =
    overall_compatibility >= 75 ? "#22C55E" :
    overall_compatibility >= 50 ? "#F59E0B" : "#F43F5E";

  return (
    <div className="fade-up space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors font-ui text-sm">
          ← Back
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-white/10 p-6 space-y-6">
        {/* Names */}
        <div className="text-center space-y-1">
          <p className="text-white/40 text-xs font-ui uppercase tracking-widest">Compatibility between</p>
          <h2 className="font-display text-xl text-white font-semibold">
            {user1_name} <span className="text-muted">&amp;</span> {user2_name}
          </h2>
        </div>

        {/* Overall score */}
        <div className="flex flex-col items-center gap-2 py-4 border-y border-white/10">
          <p className="text-white/40 text-xs font-ui uppercase tracking-widest">Overall Match</p>
          <span className="font-display text-6xl font-bold" style={{ color: overallColor }}>
            {Math.round(overall_compatibility)}%
          </span>
        </div>

        {/* Dimension rings */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {DIMENSIONS.map((dim, i) => {
            const score = compatibility_breakdown[dim.key];
            if (dim.key === "mbti_alignment" && !mbti_used) return (
              <div key={dim.key} className="flex flex-col items-center gap-3 opacity-30">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                  <span className="text-white/40 text-xs font-ui text-center leading-tight">No MBTI<br/>data</span>
                </div>
                <span className="text-white/30 text-xs font-ui font-medium tracking-wider uppercase">{dim.label}</span>
              </div>
            );
            return (
              <RingDial
                key={dim.key}
                score={score}
                label={dim.label}
                color={dim.color}
                delay={i * 120}
              />
            );
          })}
        </div>

        {/* MBTI note */}
        {!mbti_used && (
          <p className="text-center text-white/30 text-xs font-ui">
            Personality score unavailable — one or both users haven't set their MBTI type.
          </p>
        )}
      </div>
    </div>
  );
}
