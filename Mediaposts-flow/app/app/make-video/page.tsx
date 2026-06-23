"use client";
import { useEffect, useState } from "react";

// Subjects detected from the locked transcript — hardcoded for this fixture
// ponytail: no dynamic NLP needed yet; these are known from the transcript
const SUBJECTS = ["Ronaldo", "Waterman", "Harry Kane"];

type Clip = {
  id: string; title: string; url: string;
  durationSec: number; width: number; height: number;
  thumbnail: string; author: string; plays: number;
};

type SubjectState = {
  subject: string;
  clips: Clip[];
  loading: boolean;
  selected: Clip | null;
  error: string;
};

export default function MakeVideoPage() {
  const [subjects, setSubjects] = useState<SubjectState[]>(
    SUBJECTS.map(s => ({ subject: s, clips: [], loading: true, selected: null, error: "" }))
  );

  async function searchSubject(subject: string, replace = false) {
    setSubjects(prev => prev.map(s =>
      s.subject === subject ? { ...s, loading: true, error: "", clips: replace ? [] : s.clips } : s
    ));
    try {
      const res = await fetch("/api/search-clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects: [subject], sportHint: "soccer" }),
      });
      const data = await res.json();
      const clips: Clip[] = data.results?.[0]?.clips ?? [];
      setSubjects(prev => prev.map(s =>
        s.subject === subject ? { ...s, loading: false, clips, error: clips.length === 0 ? "No clips found — try Find More" : "" } : s
      ));
    } catch (e: any) {
      setSubjects(prev => prev.map(s =>
        s.subject === subject ? { ...s, loading: false, error: e.message } : s
      ));
    }
  }

  // Auto-search all subjects on mount
  useEffect(() => {
    SUBJECTS.forEach(s => searchSubject(s));
  }, []);

  const allPicked = subjects.every(s => s.selected !== null);

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Make Video</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Locked fixture: Ronaldo / Waterman / Kane parlay · Pick one clip per subject
        </p>
      </div>

      {/* Voiceover player */}
      <div style={{ marginBottom: 28, padding: 16, border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>🎙 Locked Voiceover</p>
        <audio controls src="/locked-voice.mp3" style={{ width: "100%" }} />
      </div>

      {/* One row per subject */}
      {subjects.map(({ subject, clips, loading, selected, error }) => (
        <div key={subject} style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{subject}</h2>
            {selected && <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>✓ Clip selected</span>}
            {loading && <span style={{ fontSize: 12, color: "var(--muted)" }}>Searching TikTok…</span>}
            {!loading && (
              <button onClick={() => searchSubject(subject, true)} style={{
                padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
                background: "transparent", color: "var(--muted)", fontSize: 12,
                cursor: "pointer", marginLeft: "auto"
              }}>Find more</button>
            )}
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {loading && [1,2,3,4].map(i => (
              <div key={i} style={{ width: 130, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ paddingTop: "177.7%", background: "#2a2a3a" }} />
                <div style={{ padding: 8, height: 48, background: "var(--card)" }} />
              </div>
            ))}

            {!loading && clips.map(clip => {
              const isSelected = selected?.id === clip.id;
              return (
                <div key={clip.id} onClick={() =>
                  setSubjects(prev => prev.map(s =>
                    s.subject === subject ? { ...s, selected: isSelected ? null : clip } : s
                  ))
                } style={{
                  width: 130, borderRadius: 10, overflow: "hidden", cursor: "pointer",
                  border: isSelected ? "2.5px solid var(--accent)" : "1.5px solid var(--border)",
                  background: "var(--card)", transition: "border 0.1s"
                }}>
                  <div style={{ position: "relative", paddingTop: "177.7%" }}>
                    {clip.thumbnail
                      ? <img src={clip.thumbnail} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ position: "absolute", inset: 0, background: "#2a2a3a", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 11 }}>No preview</div>
                    }
                    <span style={{ position: "absolute", bottom: 5, right: 5, background: "rgba(0,0,0,.7)", color: "#fff", fontSize: 10, padding: "2px 5px", borderRadius: 4 }}>
                      {clip.durationSec}s
                    </span>
                    {isSelected && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(99,102,241,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 28 }}>✓</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "7px 9px" }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, lineHeight: 1.3,
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                      {clip.title || `@${clip.author}`}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "var(--muted)" }}>
                      {(clip.plays / 1000).toFixed(0)}k plays
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Assemble button */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 24px", background: "var(--bg)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center" }}>
        <button disabled={!allPicked} style={{
          padding: "12px 40px", borderRadius: 10, border: "none",
          background: allPicked ? "var(--accent)" : "var(--border)",
          color: allPicked ? "#fff" : "var(--muted)",
          fontWeight: 800, fontSize: 15, cursor: allPicked ? "pointer" : "not-allowed"
        }}>
          {allPicked ? "Assemble Video →" : `Pick a clip for each subject (${subjects.filter(s => s.selected).length}/${subjects.length})`}
        </button>
      </div>
    </div>
  );
}
