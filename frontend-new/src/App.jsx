import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import ProfileForm from "./components/ProfileForm";
import Recommendations from "./components/Recommendations";
import PeerList from "./components/PeerList";
import TeacherDashboard from "./components/TeacherDashboard";

const VIEWS = {
  student: [
    { id: "recommend", label: "Recommended", icon: "✦" },
    { id: "peers",     label: "All Peers",   icon: "◎" },
    { id: "profile",   label: "Edit Profile", icon: "✎" },
  ],
  teacher: [
    { id: "dashboard", label: "All Records", icon: "▦" },
  ],
};

export default function App() {
  // session: null = signed out, { userId, role } = active
  const [session, setSession] = useState(null);
  const [view, setView]       = useState(null);
  // "landing" | "register" — only relevant while signed out
  const [authScreen, setAuthScreen] = useState("landing");

  function handleProfileSaved(userId, role) {
    const defaultView = role === "Teacher" ? "dashboard" : "recommend";
    setSession({ userId, role });
    setView(defaultView);
  }

  function handleLogout() {
    setSession(null);
    setView(null);
    setAuthScreen("landing");
  }

  // No session — sign in / register
  if (!session) {
    if (authScreen === "register") {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
          <div className="w-full max-w-xl">
            <Logo />
            <div className="mt-8 bg-parchment border border-warm rounded-2xl p-6 sm:p-8 shadow-sm">
              <ProfileForm
                onProfileSaved={handleProfileSaved}
                onBack={() => setAuthScreen("landing")}
              />
            </div>
          </div>
        </div>
      );
    }
    return (
      <LandingPage
        onLogin={handleProfileSaved}
        onRegister={() => setAuthScreen("register")}
      />
    );
  }

  const role     = session.role.toLowerCase();
  const navItems = VIEWS[role] || [];

  return (
    <div className="min-h-screen bg-cream flex flex-col sm:flex-row">
      {/* Sidebar */}
      <aside className="sm:w-60 shrink-0 sm:border-r border-b sm:border-b-0 border-ink/10 flex sm:flex-col flex-row items-center sm:items-stretch p-4 sm:p-5 gap-4 sm:gap-6 bg-ink">
        <div className="sm:block hidden">
          <Logo compact />
        </div>
        <span className="sm:hidden font-display font-bold text-cream text-lg">
          Amigo<span className="text-accentlt">Sync</span>
        </span>

        {/* User chip */}
        <div className="hidden sm:flex items-center gap-2 bg-cream/5 border border-cream/10 rounded-xl px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-accentlt/25 flex items-center justify-center shrink-0">
            <span className="text-accentlt font-display font-bold text-xs">
              {session.userId.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-cream text-xs font-ui font-medium truncate">{session.userId}</p>
            <p className="text-cream/35 text-[10px] font-ui">{session.role}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex sm:flex-col flex-row gap-1 flex-1 overflow-x-auto sm:overflow-visible">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-ui font-medium transition-all text-left whitespace-nowrap
                ${view === item.id
                  ? "bg-accentlt/20 text-accentlt"
                  : "text-cream/45 hover:text-cream/80 hover:bg-cream/5"
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
          className="text-cream/25 hover:text-cream/55 text-xs font-ui transition-colors text-left px-3 py-2 shrink-0"
        >
          ← Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-5 sm:p-10">
        <div className="max-w-3xl mx-auto">
          {view === "profile" && (
            <div className="bg-parchment border border-warm rounded-2xl p-6 sm:p-8 shadow-sm">
              <ProfileForm onProfileSaved={handleProfileSaved} />
            </div>
          )}
          {view === "recommend" && <Recommendations currentUserId={session.userId} />}
          {view === "peers" && <PeerList currentUserId={session.userId} />}
          {view === "dashboard" && <TeacherDashboard currentUserId={session.userId} />}
          {!view && (
            <div className="text-inkfade/50 font-ui text-sm text-center pt-20">
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
      <span className={`font-display font-bold text-xl tracking-tight ${compact ? "text-cream" : "text-ink"}`}>
        Amigo<span className="text-accentlt">Sync</span>
      </span>
      {!compact && (
        <p className="text-inkfade text-xs font-ui mt-1">Academic compatibility platform</p>
      )}
    </div>
  );
}
