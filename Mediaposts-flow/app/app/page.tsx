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
type Candidate = { id: string; title: string; url: string; thumbnail: string; duration: number; width: number; height: number; vertical: boolean };
type ClipResult = { player: string; candidates: Candidate[] };

const STEPS = ["dump", "script", "voice", "clips"] as const;
type Step = typeof STEPS[number];

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const [pickDump, setPickDump] = useState(() => typeof window !== "undefined" ? (localStorage.getItem("hp_pickDump") ?? "") : "");
  const [hookVibe, setHookVibe] = useState(() => typeof window !== "undefined" ? (localStorage.getItem("hp_hookVibe") ?? HOOK_VIBES[0]) : HOOK_VIBES[0]);
  const [script, setScript] = useState(() => typeof window !== "undefined" ? (localStorage.getItem("hp_script") ?? "") : "");
  const [step, setStep] = useState<Step>(() => typeof window !== "undefined" ? ((localStorage.getItem("hp_step") as Step) ?? "dump") : "dump");

  const [reviseNote, setReviseNote] = useState("");
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceMode, setVoiceMode] = useState<"elevenlabs" | "upload">("elevenlabs");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [voicesLoading, setVoicesLoading] = useState(false);

  const [players, setPlayers] = useState("");
  const [clipResults, setClipResults] = useState<ClipResult[]>([]);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [downloaded, setDownloaded] = useState<Record<string, string>>({});
  const [searching, setSearching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem("hp_pickDump", pickDump); }, [pickDump]);
  useEffect(() => { localStorage.setItem("hp_hookVibe", hookVibe); }, [hookVibe]);
  useEffect(() => { localStorage.setItem("hp_script", script); }, [script]);
  useEffect(() => { localStorage.setItem("hp_step", step); }, [step]);

  useEffect(() => {
    if (step === "voice" && voiceMode === "elevenlabs" && voices.length === 0 && !voicesLoading) {
      loadVoices();
    }
  }, [step, voiceMode, voices.length, voicesLoading]);

  function loadDemo() {
    setPickDump(DEMO_NOTES); setHookVibe(HOOK_VIBES[0]); setScript(DEMO_SCRIPT);
    setError(""); setStep("script");
  }
  function clearDraft() {
    setPickDump(""); setScript(""); setReviseNote(""); setVoiceUrl("");
    setClipResults([]); setApproved(new Set()); setDownloaded({});
    setStep("dump"); setError("");
    STEPS.forEach(k => localStorage.removeItem(`hp_${k}`));
    ["hp_pickDump","hp_hookVibe","hp_script","hp_step"].forEach(k => localStorage.removeItem(k));
  }

  async function loadVoices() {
    setVoicesLoading(true); setError("");
    try {
      const res = await fetch("/api/voices");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load voices");
      setVoices(data.voices || []);
      setSelectedVoiceId(cur => cur || data.defaultVoiceId || data.voices?.[0]?.voiceId || "");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load voices"); }
    finally { setVoicesLoading(false); }
  }

  async function generateScript(revise = false) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ pickDump, hookVibe, reviseNote: revise ? reviseNote : undefined, previousScript: revise ? script : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Script generation failed");
      setScript(data.script); setReviseNote(""); setStep("script");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  }

  async function generateVoice() {
    setVoiceLoading(true); setError("");
    try {
      const res = await fetch("/api/generate-voice", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ script, voiceId: customVoiceId.trim() || selectedVoiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voice generation failed");
      setVoiceUrl(data.url); setStep("voice");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setVoiceLoading(false); }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVoiceUrl(URL.createObjectURL(file)); setStep("voice");
  }

  async function searchClips() {
    const list = players.split(",").map(p => p.trim()).filter(Boolean);
    if (!list.length) { setError("Enter at least one player name"); return; }
    setSearching(true); setError(""); setClipResults([]);
    try {
      const res = await fetch("/api/search-clips", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ players: list }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setClipResults(data.results || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Search failed"); }
    finally { setSearching(false); }
  }

  async function downloadClip(id: string, url: string) {
    setDownloadingId(id); setError("");
    try {
      const res = await fetch("/api/download-clip", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Download failed");
      setDownloaded(prev => ({ ...prev, [id]: data.path }));
    } catch (err) { setError(err instanceof Error ? err.message : "Download failed"); }
    finally { setDownloadingId(null); }
  }

  function toggleApprove(id: string) {
    setApproved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const stepIndex = STEPS.indexOf(step);
  const stepLabels = ["Pick", "Script", "Voice", "Clips"];

  return (
    <main>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>New Pick Video</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Pick → Script → Voice → Clips → Video</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }} onClick={loadDemo}>⚡ Demo</button>
          <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }} onClick={clearDraft}>Clear</button>
          {STEPS.map((s, i) => (
            <span key={s} title={stepLabels[i]} style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 12, fontWeight: 700,
              background: step === s ? "var(--accent)" : (stepIndex > i ? "#2a2a3a" : "var(--surface)"),
              color: step === s ? "#fff" : (stepIndex > i ? "var(--text)" : "var(--muted)"),
              border: "1px solid var(--border)", cursor: stepIndex > i ? "pointer" : "default",
            }} onClick={() => { if (stepIndex > i) setStep(s); }}>{i + 1}</span>
          ))}
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: "#7f1d1d", background: "#1a0f12", color: "#fecaca" }}>
          {error}
        </div>
      )}

      {/* STEP 1 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Drop the Pick</span>
          <span className="tag">Step 1</span>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Paste messy notes</label>
          <textarea rows={12} placeholder={"Paste anything here — player names, lines, stats, matchup notes, vibes. Claude will shape it.\n\nExample:\nRonaldo over 1.5 shots on target, avg 1.9 last 10\nKane anytime scorer, 7 of last 10 starts"}
            value={pickDump} onChange={e => setPickDump(e.target.value)}
            style={{ fontSize: 15, lineHeight: 1.7, minHeight: 220 }} />
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

      {/* STEP 2 */}
      {stepIndex >= 1 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Script</span>
            <span className="tag">Step 2</span>
          </div>
          <textarea rows={7} value={script} onChange={e => setScript(e.target.value)}
            style={{ marginBottom: 14, fontSize: 15, lineHeight: 1.7 }} />
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label>Revise with Claude</label>
              <input placeholder="e.g. make it shorter, cockier, add a Discord CTA"
                value={reviseNote} onChange={e => setReviseNote(e.target.value)} />
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

      {/* STEP 3 */}
      {stepIndex >= 2 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Voiceover</span>
            <span className="tag">Step 3</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <button className={voiceMode === "elevenlabs" ? "btn-primary" : "btn-ghost"} onClick={() => setVoiceMode("elevenlabs")}>ElevenLabs AI voice</button>
            <button className={voiceMode === "upload" ? "btn-primary" : "btn-ghost"} onClick={() => setVoiceMode("upload")}>Upload MP3</button>
          </div>

          {voiceMode === "elevenlabs" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
                <div>
                  <label>Choose voice</label>
                  <select value={selectedVoiceId} onChange={e => setSelectedVoiceId(e.target.value)} disabled={voicesLoading}>
                    {!selectedVoiceId && <option value="">Select a voice</option>}
                    {voices.map(v => <option key={v.voiceId} value={v.voiceId}>{v.name}</option>)}
                  </select>
                </div>
                <button className="btn-ghost" onClick={loadVoices} disabled={voicesLoading}>{voicesLoading ? "Loading…" : "Refresh"}</button>
              </div>
              <div>
                <label>Or paste a custom voice ID</label>
                <input placeholder="Optional — overrides dropdown" value={customVoiceId} onChange={e => setCustomVoiceId(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={generateVoice} disabled={voiceLoading || !script.trim() || (!selectedVoiceId && !customVoiceId.trim())}>
                {voiceLoading ? "Generating voice…" : "Generate voiceover"}
              </button>
            </div>
          ) : (
            <>
              <input ref={fileRef} type="file" accept="audio/mp3,audio/mpeg" style={{ display: "none" }} onChange={handleUpload} />
              <button className="btn-ghost" onClick={() => fileRef.current?.click()}>Upload MP3</button>
            </>
          )}

          {voiceUrl && (
            <div style={{ marginTop: 18 }}>
              <label>Preview</label>
              <audio controls src={voiceUrl} style={{ width: "100%", marginTop: 8, borderRadius: 8 }} />
              <button className="btn-primary" style={{ marginTop: 14 }} onClick={() => { setStep("clips"); setPlayers("Ronaldo, Waterman, Kane"); }}>
                Find Clips →
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 4 — CLIPS */}
      {stepIndex >= 3 && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Find Clips</span>
            <span className="tag">Step 4</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end", marginBottom: 18 }}>
            <div>
              <label>Players to search (comma-separated)</label>
              <input placeholder="e.g. Ronaldo, Harry Kane, Waterman" value={players} onChange={e => setPlayers(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={searchClips} disabled={searching || !players.trim()}>
              {searching ? "Searching…" : "Search"}
            </button>
          </div>

          {searching && (
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>Searching YouTube for each player — this takes ~15 seconds…</p>
          )}

          {clipResults.map(({ player, candidates }) => (
            <div key={player} style={{ marginBottom: 24 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                {player}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {candidates.map(c => {
                  const isApproved = approved.has(c.id);
                  const isDone = !!downloaded[c.id];
                  const isDownloading = downloadingId === c.id;
                  return (
                    <div key={c.id} style={{
                      background: "#0f0f16", border: `1px solid ${isApproved ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 10, overflow: "hidden", cursor: "pointer",
                    }} onClick={() => toggleApprove(c.id)}>
                      <div style={{ position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.thumbnail} alt={c.title} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                        <span style={{
                          position: "absolute", bottom: 4, right: 6, background: "rgba(0,0,0,0.8)",
                          color: "#fff", fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 5px"
                        }}>{fmt(c.duration)}</span>
                        {c.vertical && (
                          <span style={{
                            position: "absolute", top: 4, left: 6, background: "var(--accent)",
                            color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "2px 5px"
                          }}>9:16</span>
                        )}
                        {isApproved && (
                          <span style={{
                            position: "absolute", top: 4, right: 6, background: "var(--accent)",
                            color: "#fff", fontSize: 14, borderRadius: "50%", width: 22, height: 22,
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>✓</span>
                        )}
                      </div>
                      <div style={{ padding: "8px 10px" }}>
                        <p style={{ fontSize: 11, lineHeight: 1.4, color: "var(--text)", margin: 0,
                          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                          {c.title}
                        </p>
                        {isApproved && !isDone && (
                          <button className="btn-primary" style={{ marginTop: 8, width: "100%", padding: "5px", fontSize: 11 }}
                            disabled={isDownloading}
                            onClick={e => { e.stopPropagation(); downloadClip(c.id, c.url); }}>
                            {isDownloading ? "Downloading…" : "Download"}
                          </button>
                        )}
                        {isDone && (
                          <p style={{ marginTop: 6, fontSize: 11, color: "#4ade80", fontWeight: 600 }}>✓ Downloaded</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {clipResults.length > 0 && (
            <div style={{ marginTop: 8, padding: "14px 0", borderTop: "1px solid var(--border)" }}>
              <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 10 }}>
                {Object.keys(downloaded).length} clip{Object.keys(downloaded).length !== 1 ? "s" : ""} downloaded
              </p>
              <button className="btn-primary" disabled style={{ opacity: 0.5 }}>
                Render Video → coming next
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
