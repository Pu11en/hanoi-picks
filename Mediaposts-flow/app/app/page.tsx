"use client";
import { useEffect, useState, useRef } from "react";

const HOOK_VIBES = [
  "Auto-pick the best Hanoi hook",
  "Official mad parlay — almost guaranteed",
  "Betting this market has been free",
  "Easiest way to triple the bet",
];

const DEMO_NOTES = `MLB parlay for tonight. Make it sound like Hanoi Picks, fast and cocky.

Drew Rasmussen over 5.5 strikeouts. He's averaging 6.4 Ks over his last 10 starts and cleared this in 8 of 10.

Freddie Freeman over 1.5 total bases. Averaging 1.7 total bases over his last 10. Hitting around .300 with a .500 slug against righties.

Gerrit Cole over 6.5 strikeouts. 46 strikeouts over his last 10 appearances. End by rolling with Cole.`;

const DEMO_SCRIPT = "Betting MLB strikeouts have been so free this year. Starting off with Drew Rasmussen to go over 5.5 strikeouts — he's averaging 6.4 over his last 10 starts and has cleared this in 8 of those 10 games. This should be free. My second pick is Freddie Freeman to go over 1.5 total bases — he's averaging 1.7 over his last 10 and is hitting nearly .300 with a .500 slug against right-handed pitching. My last guy recorded 46 strikeouts over his last 10 appearances, so we're going to roll with Gerrit Cole to go over 6.5 strikeouts.";

type VoiceOption = { voiceId: string; name: string; previewUrl?: string };

export default function Home() {
  const [pickDump, setPickDump] = useState("");
  const [hookVibe, setHookVibe] = useState(HOOK_VIBES[0]);
  const [script, setScript] = useState("");
  const [reviseNote, setReviseNote] = useState("");
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceMode, setVoiceMode] = useState<"elevenlabs" | "upload">("elevenlabs");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [step, setStep] = useState<"dump" | "script" | "voice">("dump");
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function loadDemo() {
    setPickDump(DEMO_NOTES);
    setHookVibe(HOOK_VIBES[0]);
    setScript(DEMO_SCRIPT);
    setError("");
    setStep("script");
  }

  async function loadVoices() {
    setVoicesLoading(true);
    setError("");
    try {
      const res = await fetch("/api/voices");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load voices");
      setVoices(data.voices || []);
      setSelectedVoiceId(current => current || data.defaultVoiceId || data.voices?.[0]?.voiceId || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load voices");
    } finally {
      setVoicesLoading(false);
    }
  }

  useEffect(() => {
    if (step === "voice" && voiceMode === "elevenlabs" && voices.length === 0 && !voicesLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load voices once when the voice step opens
      loadVoices();
    }
  }, [step, voiceMode, voices.length, voicesLoading]);

  async function generateScript(revise = false) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pickDump,
          hookVibe,
          reviseNote: revise ? reviseNote : undefined,
          previousScript: revise ? script : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Script generation failed");
      setScript(data.script);
      setReviseNote("");
      setStep("script");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function generateVoice() {
    setVoiceLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ script, voiceId: customVoiceId.trim() || selectedVoiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voice generation failed");
      setVoiceUrl(data.url);
      setStep("voice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setVoiceLoading(false);
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVoiceUrl(URL.createObjectURL(file));
    setStep("voice");
  }

  const stepIndex = ["dump", "script", "voice"].indexOf(step);

  return (
    <main>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>New Pick Video</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Dump notes → Claude script → Voiceover
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12, marginRight: 4 }} onClick={loadDemo}>
            ⚡ Demo
          </button>
          {["dump", "script", "voice"].map((s, i) => (
            <span key={s} style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              background: step === s ? "var(--accent)" : (stepIndex > i ? "#2a2a3a" : "var(--surface)"),
              color: step === s ? "#fff" : (stepIndex > i ? "var(--text)" : "var(--muted)"),
              border: "1px solid var(--border)",
            }}>{i + 1}</span>
          ))}
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: "#7f1d1d", background: "#1a0f12", color: "#fecaca" }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Drop the Pick</span>
          <span className="tag">Step 1</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label>Paste messy notes</label>
          <textarea
            rows={12}
            placeholder={`Paste anything here. Example:\n\nMLB parlay tonight\nPlayer A over 5.5 Ks, cleared 8 of last 10\nPlayer B over 1.5 total bases, great vs righties\nMake it aggressive, 30 seconds, Hanoi Picks style`}
            value={pickDump}
            onChange={e => setPickDump(e.target.value)}
            style={{ fontSize: 15, lineHeight: 1.7, minHeight: 260 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label>Hook direction</label>
            <select value={hookVibe} onChange={e => setHookVibe(e.target.value)}>
              {HOOK_VIBES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={() => generateScript(false)} disabled={loading || !pickDump.trim()}>
            {loading ? "Claude is writing…" : "Generate Script →"}
          </button>
        </div>
      </div>

      {step !== "dump" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Script</span>
            <span className="tag">Step 2</span>
          </div>
          <textarea
            rows={7}
            value={script}
            onChange={e => setScript(e.target.value)}
            style={{ marginBottom: 14, fontFamily: "system-ui", fontSize: 15, lineHeight: 1.7 }}
          />
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label>Chat with Claude to revise</label>
              <input
                placeholder="e.g. make it shorter, cockier, less formal"
                value={reviseNote}
                onChange={e => setReviseNote(e.target.value)}
              />
            </div>
            <button className="btn-ghost" onClick={() => generateScript(true)} disabled={loading || !reviseNote.trim()}>
              {loading ? "Revising…" : "Revise"}
            </button>
            <button className="btn-primary" onClick={() => setStep("voice")} disabled={!script.trim()}>
              Lock Script →
            </button>
          </div>
        </div>
      )}

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
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
                <div>
                  <label>Choose ElevenLabs voice</label>
                  <select value={selectedVoiceId} onChange={e => setSelectedVoiceId(e.target.value)} disabled={voicesLoading}>
                    {!selectedVoiceId && <option value="">Select a voice</option>}
                    {voices.map(v => (
                      <option key={v.voiceId} value={v.voiceId}>{v.name} — {v.voiceId}</option>
                    ))}
                  </select>
                </div>
                <button className="btn-ghost" onClick={loadVoices} disabled={voicesLoading}>
                  {voicesLoading ? "Loading…" : "Refresh voices"}
                </button>
              </div>

              <div>
                <label>Or paste a custom voice ID</label>
                <input
                  placeholder="Optional — overrides the dropdown"
                  value={customVoiceId}
                  onChange={e => setCustomVoiceId(e.target.value)}
                />
              </div>

              {selectedVoiceId && !customVoiceId.trim() && (
                <p style={{ color: "var(--muted)", fontSize: 12 }}>Using selected voice ID: {selectedVoiceId}</p>
              )}

              <button className="btn-primary" onClick={generateVoice} disabled={voiceLoading || !script.trim() || (!selectedVoiceId && !customVoiceId.trim())}>
                {voiceLoading ? "Generating voice…" : "Generate voiceover"}
              </button>
            </div>
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
                  Next: Find clips → coming next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
