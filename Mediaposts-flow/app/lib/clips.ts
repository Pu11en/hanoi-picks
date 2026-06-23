// Vertical clip finder powered by Apify TikTok Search Scraper.
// Runs a keyword search → returns native vertical TikTok clips (always 9:16).
// yt-dlp still handles the actual download of approved clips.
// ponytail: no polling loop abstraction — inline poll is clear enough

import { execFile } from "child_process";
import { promisify } from "util";
const execFileP = promisify(execFile);

export type ClipCandidate = {
  id: string;
  title: string;
  url: string;          // webVideoUrl — pass to yt-dlp to download
  durationSec: number;
  width: number;
  height: number;
  thumbnail: string;
  author: string;
  plays: number;
  source: "tiktok";
};

const APIFY_ACTOR = "automation-lab~tiktok-search-scraper";
const APIFY_BASE = "https://api.apify.com/v2";

async function apifySearch(keyword: string, max: number, token: string): Promise<ClipCandidate[]> {
  // Start run
  const startRes = await fetch(`${APIFY_BASE}/acts/${APIFY_ACTOR}/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords: [keyword], maxItems: max }),
  });
  const { data: run, error } = await startRes.json() as any;
  if (error) throw new Error(`Apify start error: ${error.message}`);
  const runId = run.id;

  // Poll until done (max 120s)
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
    const { data: r } = await s.json() as any;
    if (r.status === "SUCCEEDED") break;
    if (r.status === "FAILED" || r.status === "ABORTED") throw new Error(`Apify run ${r.status}: ${r.statusMessage}`);
  }

  // Fetch items
  const itemsRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${token}&limit=${max}`);
  const items = await itemsRes.json() as any[];

  return items
    .filter((v) => v.webVideoUrl && v.videoMeta?.height > v.videoMeta?.width) // vertical guard
    .map((v) => ({
      id: v.id,
      title: (v.text ?? "").slice(0, 100),
      url: v.webVideoUrl,
      durationSec: v.videoMeta?.duration ?? 0,
      width: v.videoMeta?.width ?? 0,
      height: v.videoMeta?.height ?? 0,
      thumbnail: v.videoMeta?.coverUrl ?? "",
      author: v.authorMeta?.name ?? "",
      plays: v.playCount ?? 0,
      source: "tiktok" as const,
    }));
}

// Download an approved clip URL to outPath using yt-dlp
export async function downloadClip(url: string, outPath: string): Promise<void> {
  await execFileP("yt-dlp", [url, "-o", outPath, "--no-warnings", "--quiet"], { timeout: 120_000 });
}

// Main: find vertical clips for a subject
export async function findClips(
  subject: string,
  opts: { sportHint?: string; want?: number; apifyToken?: string } = {},
): Promise<ClipCandidate[]> {
  const { sportHint = "soccer", want = 6, apifyToken = process.env.APIFY_API_TOKEN } = opts;
  if (!apifyToken) throw new Error("APIFY_API_TOKEN not set");
  const keyword = `${subject} ${sportHint}`;
  const clips = await apifySearch(keyword, want * 2, apifyToken);
  // Sort by play count (most popular first — better quality clips)
  return clips.sort((a, b) => b.plays - a.plays).slice(0, want);
}

// --- self-check: `npx tsx lib/clips.ts Ronaldo` ---
if (process.argv[1]?.endsWith("clips.ts")) {
  const subject = process.argv[2] || "Ronaldo";
  const token = process.env.APIFY_API_TOKEN;
  if (!token) { console.error("Set APIFY_API_TOKEN env var"); process.exit(1); }
  findClips(subject, { want: 4, apifyToken: token }).then((clips) => {
    console.log(`\n${clips.length} vertical TikTok clips for "${subject}":`);
    for (const c of clips) {
      if (c.height <= c.width) throw new Error("NON-VERTICAL LEAKED");
      console.log(`  ${c.width}x${c.height} ${c.durationSec}s ${(c.plays/1000).toFixed(0)}k plays — ${c.title.slice(0,50)}`);
    }
    console.log("\n✓ Apify clip finder WORKS");
  }).catch(console.error);
}
