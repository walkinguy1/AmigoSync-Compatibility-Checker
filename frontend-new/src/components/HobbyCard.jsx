import React from "react";

const HOBBIES = [
  { id: "sports",       emoji: "⚽", label: "Sports" },
  { id: "gaming",       emoji: "🎮", label: "Gaming" },
  { id: "cooking",      emoji: "🍳", label: "Cooking" },
  { id: "music",        emoji: "🎵", label: "Music" },
  { id: "reading",      emoji: "📚", label: "Reading" },
  { id: "travel",       emoji: "✈️", label: "Travel" },
  { id: "art",          emoji: "🎨", label: "Art" },
  { id: "photography",  emoji: "📷", label: "Photography" },
  { id: "fitness",      emoji: "🏋️", label: "Fitness" },
  { id: "tech",         emoji: "💻", label: "Tech" },
  { id: "movies",       emoji: "🎬", label: "Movies" },
  { id: "volunteering", emoji: "🤝", label: "Volunteering" },
];

export { HOBBIES };

export default function HobbyCard({ id, emoji, label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className={`
        flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2
        transition-all duration-150 cursor-pointer select-none
        ${selected
          ? "border-accent bg-accent/10 shadow-sm scale-[1.04]"
          : "border-warm bg-cream hover:border-accentlt/50 hover:bg-parchment"
        }
      `}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className={`text-xs font-semibold font-ui tracking-wide ${selected ? "text-accent" : "text-inkfade"}`}>
        {label}
      </span>
    </button>
  );
}