"use client";
import { useState } from "react";

type Clip = {
  id: string; title: string; url: string; durationSec: number;
  width: number; height: number; thumbnail: string; author: string; plays: number;
};
type Result = { subject: string; clips: Clip[] };

export default function ClipsPage() {
  const [subjects, setSubjects] = useState("Ronaldo, Waterman, Kane");
  const [sport, setSport] = useState("soccer");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    setLoading(true); setError(""); setResults([]);
    try {
      const res = await fetch("/api/search-clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects: subjects.split(",").map(s => s.trim()).filter(Boolean), sportHint: sport }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>🎬 Clip Finder</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>Search TikTok for vertical clips by player or team name.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input value={subjects} onChange={e => setSubjects(e.target.value)}
          placeholder="Ronaldo, Kane, Waterman"
          style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15 }} />
        <input value={sport} onChange={e => setSport(e.target.value)}
          placeholder="soccer"
          style={{ width: 100, padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15 }} />
        <button onClick={search} disabled={loading}
          style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: loading ? "#9ca3af" : "#3b82f6", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: 15 }}>
          {loading ? "Searching…" : "Find Clips"}
        </button>
      </div>

      {loading && <p style={{ color: "#6b7280" }}>⏳ Searching TikTok via Apify… this takes ~60s per player</p>}
      {error && <p style={{ color: "#ef4444" }}>Error: {error}</p>}

      {results.map(({ subject, clips }) => (
        <div key={subject} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
            {subject} — {clips.length} clips found
          </h2>
          {clips.length === 0 && <p style={{ color: "#9ca3af" }}>No vertical clips found for this subject.</p>}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {clips.map(clip => (
              <a key={clip.id} href={clip.url} target="_blank" rel="noopener noreferrer"
                style={{ width: 160, textDecoration: "none", color: "inherit" }}>
                <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1.5px solid #e5e7eb", background: "#f3f4f6" }}>
                  {/* 9:16 aspect thumbnail */}
                  <div style={{ paddingTop: "177.7%", position: "relative" }}>
                    {clip.thumbnail
                      ? <img src={clip.thumbnail} alt={clip.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No preview</div>
                    }
                    {/* duration badge */}
                    <span style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 11, padding: "2px 6px", borderRadius: 4 }}>
                      {clip.durationSec}s
                    </span>
                    {/* resolution badge */}
                    <span style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 10, padding: "2px 5px", borderRadius: 4 }}>
                      {clip.width}×{clip.height}
                    </span>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {clip.title || "@" + clip.author}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6b7280" }}>
                      {(clip.plays / 1000).toFixed(0)}k plays · @{clip.author.slice(0, 14)}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
