import React, { useEffect, useState } from "react";
import { getPeers, compareProfiles } from "../api";
import CompatibilityResult from "./CompatibilityResult";

export default function PeerList({ currentUserId }) {
  const [peers, setPeers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [comparing, setComparing] = useState(null); // peer being compared
  const [result, setResult]     = useState(null);

  useEffect(() => {
    getPeers(currentUserId)
      .then(setPeers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  async function handleCompare(peer) {
    setComparing(peer.user_id);
    setResult(null);
    try {
      const data = await compareProfiles(currentUserId, peer.user_id);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setComparing(null);
    }
  }

  if (loading) return (
    <div className="flex items-center gap-3 text-white/40 font-ui text-sm py-12 justify-center">
      <span className="w-4 h-4 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      Loading peers…
    </div>
  );

  if (error) return <p className="text-rose text-sm font-ui text-center py-8">{error}</p>;

  if (result) return <CompatibilityResult result={result} onBack={() => setResult(null)} />;

  return (
    <div className="space-y-4 fade-up">
      <div>
        <h2 className="font-display text-xl text-white font-semibold">Find Your Match</h2>
        <p className="text-white/40 text-sm font-ui mt-1">
          {peers.length === 0
            ? "No other students registered yet — check back soon."
            : `${peers.length} student${peers.length !== 1 ? "s" : ""} available to compare with.`}
        </p>
      </div>

      <div className="space-y-2">
        {peers.map((peer) => (
          <div
            key={peer.user_id}
            className="flex items-center justify-between bg-card border border-white/10 rounded-xl px-4 py-3 hover:border-white/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-muted font-display font-bold text-sm">
                  {peer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-ui font-medium text-sm">{peer.name}</p>
                <p className="text-white/30 text-xs font-ui">{peer.role}</p>
              </div>
            </div>
            <button
              onClick={() => handleCompare(peer)}
              disabled={comparing === peer.user_id}
              className="text-xs font-ui font-semibold px-4 py-2 rounded-lg bg-primary/20 text-muted hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {comparing === peer.user_id ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-muted border-t-transparent rounded-full animate-spin" />
                  Analysing…
                </span>
              ) : "Compare →"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
