"use client";
import { useEffect, useState } from "react";

type Job = {
  jobId: string;
  pick: string;
  author: string;
  queuedAt: string;
  status: "queued" | "claimed" | "done";
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/queue");
    setJobs(await res.json());
    setLoading(false);
  }

  async function updateStatus(jobId: string, status: Job["status"]) {
    await fetch("/api/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, status }),
    });
    await load();
  }

  useEffect(() => { load(); }, []);

  const pending = jobs.filter(j => j.status !== "done");
  const done = jobs.filter(j => j.status === "done");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Picks Queue</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Picks come in from Discord <strong>#picks-intake</strong>. Claim one to make a video.
        </p>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}

      {!loading && pending.length === 0 && (
        <div style={{ border: "1px dashed var(--border)", borderRadius: 10, padding: 32, textAlign: "center", color: "var(--muted)" }}>
          Queue is empty — paste a pick in <strong>#picks-intake</strong> on Discord to add one.
        </div>
      )}

      {pending.map(job => (
        <div key={job.jobId} style={{
          border: "1px solid var(--border)", borderRadius: 10,
          padding: 18, marginBottom: 14, background: "var(--card)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: job.status === "claimed" ? "#3b82f620" : "#f59e0b20",
                  color: job.status === "claimed" ? "#3b82f6" : "#f59e0b",
                  textTransform: "uppercase", letterSpacing: 1
                }}>
                  #{job.jobId} · {job.status}
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  from {job.author} · {new Date(job.queuedAt).toLocaleString()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{job.pick}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {job.status === "queued" && (
                <button onClick={() => updateStatus(job.jobId, "claimed")} style={{
                  padding: "8px 14px", borderRadius: 7, border: "none",
                  background: "var(--accent)", color: "#fff", cursor: "pointer",
                  fontWeight: 700, fontSize: 13
                }}>
                  Claim
                </button>
              )}
              {job.status === "claimed" && (
                <a href={`/make-video?jobId=${job.jobId}`} style={{
                  padding: "8px 14px", borderRadius: 7, border: "none",
                  background: "var(--accent)", color: "#fff", cursor: "pointer",
                  fontWeight: 700, fontSize: 13, textDecoration: "none"
                }}>
                  Make Video →
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, color: "var(--muted)", margin: "28px 0 10px", fontWeight: 600 }}>Done</h2>
          {done.map(job => (
            <div key={job.jobId} style={{
              border: "1px solid var(--border)", borderRadius: 8,
              padding: 12, marginBottom: 8, opacity: 0.6
            }}>
              <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>#{job.jobId} · done</span>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>{job.pick}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
