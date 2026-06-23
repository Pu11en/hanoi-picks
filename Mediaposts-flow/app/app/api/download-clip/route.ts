import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { join } from "path";

function download(url: string, outDir: string, id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outPath = join(outDir, `${id}.%(ext)s`);
    const proc = spawn("yt-dlp", [
      url,
      "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      "-o", outPath,
      "--no-warnings",
      "--merge-output-format", "mp4",
    ], { stdio: ["ignore", "pipe", "pipe"] });

    let log = "";
    proc.stdout.on("data", (d) => { log += d.toString(); });
    proc.stderr.on("data", (d) => { log += d.toString(); });
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(log.slice(-300)));
      else resolve(`/clips/${id}.mp4`);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { id, url } = await req.json();
    if (!id || !url) return NextResponse.json({ error: "id and url required" }, { status: 400 });

    const dir = join(process.cwd(), "public", "clips");
    await mkdir(dir, { recursive: true });

    const path = await download(url, dir, id);
    return NextResponse.json({ path });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Download failed" }, { status: 500 });
  }
}
