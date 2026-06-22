"use client";
import { useState, useRef } from "react";

const HOOK_VIBES = [
  "Official [EVENT] mad parlay — almost guaranteed to hit",
  "Betting [SPORT/STAT] has been so free this year",
  "The [EVENT] is the easiest way to triple your betting",
];

type Leg = { player: string; stat: string; line: string; recentForm: string; matchupEdge: string };

const emptyLeg = (): Leg => ({ player: "", stat: "", line: "", recentForm: "", matchupEdge: "" });

export default function Home() {
  const [sport, setSport] = useState("");
  const [hookVibe, setHookVibe] = useState(HOOK_VIBES[0]);
  const [legs, setLegs] = useState<Leg[]>([emptyLeg(), emptyLeg()]);
  const [script, setScript] = useState("");
  const [reviseNote, setReviseNote] = useState("");
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceMode, setVoiceMode] = useState<"elevenlabs" | "upload">("elevenlabs");
  const [step, setStep] = useState<"form" | "script" | "voice">("form");
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function updateLeg(i: number, field: keyof Leg, val: string) {
    setLegs(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  }

  function addLeg() { if (legs.length < 3) setLegs(prev => [...prev, emptyLeg()]); }
  function removeLeg(i: number) { if (legs.length > 2) setLegs(prev => prev.filter((_, idx) => idx !== i)); }

  async function generateScript(revise = false) {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sport, hookVibe, legs, reviseNote: revise ? reviseNote : undefined, previousScript: revise ? script : undefined }),
      });
      const data = await res.json();
      setScript(data.script);
      setReviseNote("");
      setStep("script");
    } finally { setLoading(false); }
  }

  async function generateVoice() {
    setVoiceLoading(true);
    try {
      const res = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      setVoiceUrl(data.url);
      setStep("voice");
    } finally { setVoiceLoading(false); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVoiceUrl(url);
    setStep("voice");
  }

  return (
    <main>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>New Pick Video</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Pick → Script → Voice → Video
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["form", "script", "voice"].map((s, i) => (
            <span key={s} style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 12, fontWeight: 700,
              background: step === s ? "var(--accent)" : (["form","script","voice"].indexOf(step) > i ? "#2a2a3a" : "var(--surface)"),
              color: step === s ? "#fff" : (["form","script","voice"].indexOf(step) > i ? "var(--text)" : "var(--muted)"),
              border: "1px solid var(--border)"
            }}>{i + 1}</span>
          ))}
        </div>
      </div>

      {/* STEP 1: PICK FORM */}
      <div className="card" style={{ marginBottom: 16, display: step === "form" || true ? "block" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>The Pick</span>
          <span className="tag">Step 1</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label>Sport / Event</label>
            <input placeholder="e.g. MLB, World Cup, NBA" value={sport} onChange={e => setSport(e.target.value)} />
          </div>
          <div>
            <label>Hook vibe</label>
            <select value={hookVibe} onChange={e => setHookVibe(e.target.value)}>
              {HOOK_VIBES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {legs.map((leg, i) => (
            <div key={i} style={{ background: "#0f0f16", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {i === 0 ? "Leg 1 — Starting off" : i === 1 ? "Leg 2 — Second pick" : "Closer — Roll with"}
                </span>
                {legs.length > 2 && (
                  <button className="btn-ghost" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => removeLeg(i)}>✕</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><label>Player</label><input placeholder="e.g. Garrett Cole" value={leg.player} onChange={e => updateLeg(i, "player", e.target.value)} /></div>
                <div><label>Stat</label><input placeholder="e.g. strikeouts, shots on target" value={leg.stat} onChange={e => updateLeg(i, "stat", e.target.value)} /></div>
                <div><label>Line (over)</label><input placeholder="e.g. 5.5, 0.5, 1.5" value={leg.line} onChange={e => updateLeg(i, "line", e.target.value)} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label>Recent form</label><input placeholder="e.g. cleared this in 8 of last 10" value={leg.recentForm} onChange={e => updateLeg(i, "recentForm", e.target.value)} /></div>
                <div><label>Matchup edge (optional)</label><input placeholder="e.g. faces team ranked 24th in strikeouts allowed" value={leg.matchupEdge} onChange={e => updateLeg(i, "matchupEdge", e.target.value)} /></div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {legs.length < 3 && (
            <button className="btn-ghost" onClick={addLeg}>+ Add 3rd leg</button>
          )}
          <button className="btn-primary" style={{ marginLeft: "auto" }} onClick={() => generateScript(false)} disabled={loading || !sport || legs.some(l => !l.player)}>
            {loading ? "Generating…" : "Generate Script →"}
          </button>
        </div>
      </div>

      {/* STEP 2: SCRIPT */}
      {step !== "form" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Script</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="tag">Step 2</span>
              <button className="btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => setStep("form")}>← Edit pick</button>
            </div>
          </div>
          <textarea
            rows={6}
            value={script}
            onChange={e => setScript(e.target.value)}
            style={{ marginBottom: 14, fontFamily: "system-ui", fontSize: 15, lineHeight: 1.7 }}
          />
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label>Revise note (optional)</label>
              <input placeholder="e.g. make the hook more aggressive" value={reviseNote} onChange={e => setReviseNote(e.target.value)} />
            </div>
            <button className="btn-ghost" onClick={() => generateScript(true)} disabled={loading}>
              {loading ? "Revising…" : "Revise"}
            </button>
            <button className="btn-primary" onClick={() => setStep("voice")}>
              Lock Script →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VOICE */}
      {step === "voice" && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Voiceover</span>
            <span className="tag">Step 3</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <button
              className={voiceMode === "elevenlabs" ? "btn-primary" : "btn-ghost"}
              onClick={() => setVoiceMode("elevenlabs")}
            >ElevenLabs AI voice</button>
            <button
              className={voiceMode === "upload" ? "btn-primary" : "btn-ghost"}
              onClick={() => setVoiceMode("upload")}
            >Upload MP3</button>
          </div>

          {voiceMode === "elevenlabs" ? (
            <button className="btn-primary" onClick={generateVoice} disabled={voiceLoading}>
              {voiceLoading ? "Generating voice…" : "Generate voiceover"}
            </button>
          ) : (
            <>
              <input ref={fileRef} type="file" accept="audio/mp3,audio/mpeg" style={{ display: "none" }} onChange={handleUpload} />
              <button className="btn-ghost" onClick={() => fileRef.current?.click()}>Upload MP3 recording</button>
            </>
          )}

          {voiceUrl && (
            <div style={{ marginTop: 18 }}>
              <label>Preview</label>
              <audio controls src={voiceUrl} style={{ width: "100%", marginTop: 8, borderRadius: 8 }} />
              <div style={{ marginTop: 14 }}>
                <button className="btn-primary" disabled style={{ opacity: 0.5 }}>
                  Next: Find clips → (coming soon)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
