import React, { useState } from "react";
import { login, adminLogin } from "../api";

export default function LandingPage({ onLogin, onRegister }) {
  const [tab, setTab]       = useState("login"); // "login" | "register" | "admin"
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  async function handleLogin() {
    setError(null);
    if (!userId.trim()) { setError("Enter your username."); return; }
    setLoading(true);
    try {
      const data = await login(userId.trim());
      onLogin(data.user_id, data.role);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin() {
    setError(null);
    if (!userId.trim()) { setError("Enter your admin username."); return; }
    if (!password.trim()) { setError("Enter the admin password."); return; }
    setLoading(true);
    try {
      const data = await adminLogin(userId.trim(), password.trim());
      onLogin(data.user_id, data.role);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-ink tracking-tight">
            Amigo<span className="text-accent">Sync</span>
          </h1>
          <p className="text-inkfade text-sm font-ui mt-1">Academic compatibility platform</p>
        </div>

        {/* Card */}
        <div className="bg-parchment border border-warm rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-warm">
            {["login", "admin", "register"].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-3.5 text-sm font-ui font-semibold transition-colors capitalize
                  ${tab === t
                    ? "text-accent border-b-2 border-accent bg-cream/60"
                    : "text-inkfade hover:text-inksoft"
                  }`}
              >
                {t === "login" ? "Sign In" : t === "admin" ? "Admin" : "Create Profile"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "login" ? (
              <div className="space-y-4 fade-up">
                <p className="text-inksoft text-sm font-ui">
                  Welcome back — enter your username to continue.
                </p>
                <div className="space-y-2">
                  <label className="text-inkfade text-xs font-ui font-semibold uppercase tracking-widest">
                    Username
                  </label>
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="e.g. riya_2025"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                {error && <ErrorBox msg={error} />}
                <button onClick={handleLogin} disabled={loading} className={btnCls}>
                  {loading ? <Spinner /> : "Sign in →"}
                </button>
              </div>
            ) : tab === "admin" ? (
              <div className="space-y-4 fade-up">
                <p className="text-inksoft text-sm font-ui">
                  Admin access — enter your credentials to continue.
                </p>
                <div className="space-y-2">
                  <label className="text-inkfade text-xs font-ui font-semibold uppercase tracking-widest">
                    Admin Username
                  </label>
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. admin_2025"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-inkfade text-xs font-ui font-semibold uppercase tracking-widest">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    placeholder="Enter admin password"
                    className={inputCls}
                  />
                </div>
                {error && <ErrorBox msg={error} />}
                <button onClick={handleAdminLogin} disabled={loading} className={btnCls}>
                  {loading ? <Spinner /> : "Admin Login →"}
                </button>
              </div>
            ) : (
              <div className="space-y-3 fade-up">
                <p className="text-inksoft text-sm font-ui">
                  New here? Fill in your profile to get started.
                </p>
                <button onClick={onRegister} className={btnCls}>
                  Create my profile →
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-inkfade text-xs font-ui mt-6">
          AmigoSync · Academic use only
        </p>
      </div>
    </div>
  );
}

export function ErrorBox({ msg }) {
  return (
    <p className="text-rose text-sm font-ui bg-rose/10 border border-rose/20 rounded-lg px-4 py-3">
      {msg}
    </p>
  );
}

export function Spinner() {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
      Loading…
    </span>
  );
}

const inputCls =
  "w-full bg-cream border border-warm rounded-xl px-4 py-3 text-ink placeholder-inkfade " +
  "font-ui text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all";

const btnCls =
  "w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-cream font-ui font-semibold " +
  "text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";