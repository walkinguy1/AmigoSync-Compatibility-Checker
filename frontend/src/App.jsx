import React, { useState } from "react";
import ProfileForm from "./components/ProfileForm";
import PeerList from "./components/PeerList";
import TeacherDashboard from "./components/TeacherDashboard";

const VIEWS = {
  student: [
    { id: "peers",   label: "Find Peers",     icon: "◎" },
    { id: "profile", label: "Edit Profile",   icon: "✦" },
  ],
  teacher: [
    { id: "dashboard", label: "All Records",  icon: "▦" },
  ],
};

export default function App() {
  // session: null = not logged in, { userId, role } = active
  const [session, setSession] = useState(null);
  const [view, setView]       = useState(null);

  function handleProfileSaved(userId, role) {
    const defaultView = role === "Teacher" ? "dashboard" : "peers";
    setSession({ userId, role });
    setView(defaultView);
  }

  function handleLogout() {
    setSession(null);
    setView(null);
  }

  // No session — show profile creation
  if (!session) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <Logo />
          <div className="mt-8 bg-card border border-white/10 rounded-2xl p-6 sm:p-8">
            <ProfileForm onProfileSaved={handleProfileSaved} />
          </div>
        </div>
      </div>
    );
  }

  const role    = session.role.toLowerCase();
  const navItems = VIEWS[role] || [];

  return (
    <div className="min-h-screen bg-base flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/10 flex flex-col p-5 gap-6 bg-panel/40">
        <Logo compact />

        {/* User chip */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
            <span className="text-muted font-display font-bold text-xs">
              {session.userId.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-ui font-medium truncate">{session.userId}</p>
            <p className="text-white/30 text-[10px] font-ui">{session.role}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-ui font-medium transition-all text-left
                ${view === item.id
                  ? "bg-primary/20 text-muted"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-white/25 hover:text-white/50 text-xs font-ui transition-colors text-left px-3 py-2"
        >
          ← Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="max-w-2xl mx-auto">
          {view === "profile" && (
            <div className="bg-card border border-white/10 rounded-2xl p-6 sm:p-8">
              <ProfileForm onProfileSaved={handleProfileSaved} />
            </div>
          )}
          {view === "peers" && <PeerList currentUserId={session.userId} />}
          {view === "dashboard" && <TeacherDashboard currentUserId={session.userId} />}
          {!view && (
            <div className="text-white/20 font-ui text-sm text-center pt-20">
              Select a section from the sidebar.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Logo({ compact }) {
  return (
    <div className={compact ? "px-1" : "text-center"}>
      <span className="font-display font-bold text-white text-xl tracking-tight">
        Amigo<span className="text-primary">Sync</span>
      </span>
      {!compact && (
        <p className="text-white/30 text-xs font-ui mt-1">Academic compatibility platform</p>
      )}
    </div>
  );
}
