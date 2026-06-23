"use client";
import { useEffect, useState } from "react";

type Job = {
  jobId: string;
  pick: string;
  author: string;
  queuedAt: string;
  status: "queued" | "claimed" | "done";
};

const STATUS_COLOR: Record<Job["status"], string> = {
  queued: "#f59e0b",
  claimed: "#3b82f6",
  done: "#22c55e",
};

export default function QueuePage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  async function load() {
    const res = await fetch("/api/queue");
    setJobs(await res.json());
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

  const pending = jobs.filter((j) => j.status !== "done");
  const done = jobs.filter((j) => j.status === "done");

  return (
    <div style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Picks Queue</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        {pending.length} pending · {done.length} done
      </p>

      {pending.length === 0 && (
        <p style={{ color: "#9ca3af" }}>Queue is empty — waiting for picks from Discord.</p>
      )}

      {pending.map((job) => (
        <div key={job.jobId} style={{
          border: "1px solid #e5e7eb", borderRadius: 10, padding: 18,
          marginBottom: 14, background: "#fff"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{
                fontSize: 12, fontWeight: 600, color: STATUS_COLOR[job.status],
                textTransform: "uppercase", letterSpacing: 1
              }}>
                #{job.jobId} · {job.status}
              </span>
              <p style={{ margin: "8px 0 4px", fontWeight: 600 }}>{job.pick}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                from {job.author} · {new Date(job.queuedAt).toLocaleString()}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {job.status === "queued" && (
                <button onClick={() => updateStatus(job.jobId, "claimed")} style={{
                  padding: "8px 14px", borderRadius: 7, border: "none",
                  background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 600
                }}>Claim</button>
              )}
              {job.status === "claimed" && (
                <button onClick={() => updateStatus(job.jobId, "done")} style={{
                  padding: "8px 14px", borderRadius: 7, border: "none",
                  background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 600
                }}>Mark Done</button>
              )}
            </div>
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, color: "#9ca3af", marginTop: 32, marginBottom: 12 }}>Done</h2>
          {done.map((job) => (
            <div key={job.jobId} style={{
              border: "1px solid #e5e7eb", borderRadius: 10, padding: 14,
              marginBottom: 10, background: "#f9fafb", opacity: 0.7
            }}>
              <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>#{job.jobId} · done</span>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280" }}>{job.pick}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
