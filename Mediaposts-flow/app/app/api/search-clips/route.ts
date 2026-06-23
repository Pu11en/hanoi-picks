import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";

type Candidate = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  width: number;
  height: number;
  uploader: string;
  vertical: boolean;
};

function ytSearch(query: string, count = 4): Promise<Candidate[]> {
  return new Promise((resolve) => {
    const proc = spawn("yt-dlp", [
      `ytsearch${count}:${query}`,
      "--dump-json",
      "--no-download",
      "--no-warnings",
      "--match-filter",
      "duration < 300", // skip anything over 5 min
    ], { stdio: ["ignore", "pipe", "pipe"] });

    let out = "";
    proc.stdout.on("data", (d) => { out += d.toString(); });
    proc.on("close", () => {
      const results: Candidate[] = [];
      for (const line of out.trim().split("\n")) {
        try {
          const v = JSON.parse(line);
          if (!v.id) continue;
          results.push({
            id: v.id,
            title: v.title || "",
            url: `https://www.youtube.com/watch?v=${v.id}`,
            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
            duration: v.duration || 0,
            width: v.width || 0,
            height: v.height || 0,
            uploader: v.uploader || "",
            vertical: (v.height || 0) > (v.width || 0),
          });
        } catch { /* skip malformed */ }
      }
      resolve(results);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { players } = await req.json() as { players: string[] };
    if (!players?.length) return NextResponse.json({ error: "No players provided" }, { status: 400 });

    // Run all player searches in parallel, two queries per player
    const results = await Promise.all(
      players.map(async (player) => {
        const [shorts, highlights] = await Promise.all([
          ytSearch(`${player} highlights short vertical 2024 2025`, 3),
          ytSearch(`${player} goal skills highlights 2025`, 3),
        ]);
        // Merge, deduplicate by id, vertical first
        const seen = new Set<string>();
        const merged: Candidate[] = [];
        for (const c of [...shorts, ...highlights]) {
          if (!seen.has(c.id)) { seen.add(c.id); merged.push(c); }
        }
        merged.sort((a, b) => (b.vertical ? 1 : 0) - (a.vertical ? 1 : 0));
        return { player, candidates: merged.slice(0, 5) };
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Search failed" }, { status: 500 });
  }
}
