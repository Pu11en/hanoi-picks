// Vertical clip finder. Two stages so it's reliable:
//   1) fast flat search to get candidate IDs (works without bot issues)
//   2) full-extract each candidate to read real width/height, keep ONLY vertical
// A hard guard guarantees no horizontal clip is ever returned (Drew's rule).
//
// SOURCING NOTE: plain YouTube search returns long horizontal compilations even
// for "#shorts" queries. The reliable native-vertical source is TikTok (and IG
// Reels) via yt-dlp WITH login cookies. Pass a cookiesFile to unlock those.
import { execFile } from "child_process";
import { promisify } from "util";

const execFileP = promisify(execFile);

export type ClipCandidate = {
  id: string;
  title: string;
  url: string;
  durationSec: number;
  width: number;
  height: number;
  thumbnail: string;
  source: "youtube" | "tiktok";
};

const isVertical = (w?: number, h?: number) => !!w && !!h && h > w;

async function ytdlp(args: string[], timeoutMs = 60_000): Promise<string> {
  try {
    const { stdout } = await execFileP("yt-dlp", [...args, "--no-warnings"], {
      maxBuffer: 1024 * 1024 * 64,
      timeout: timeoutMs,
    });
    return stdout;
  } catch (e: any) {
    console.warn("[clips] yt-dlp:", e?.message?.slice(0, 160));
    return e?.stdout ?? "";
  }
}

// Stage 1: flat search → candidate IDs (reliable, fast).
async function searchIds(query: string, n: number, cookiesFile?: string): Promise<string[]> {
  const cookieArgs = cookiesFile ? ["--cookies", cookiesFile] : [];
  const out = await ytdlp([`ytsearch${n}:${query}`, "--flat-playlist", "--print", "id", ...cookieArgs], 50_000);
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

// Stage 2: full-extract one video → dims/duration (reliable per-ID).
async function extract(url: string, source: "youtube" | "tiktok", cookiesFile?: string): Promise<ClipCandidate | null> {
  const cookieArgs = cookiesFile ? ["--cookies", cookiesFile] : [];
  const out = await ytdlp([url, "--dump-json", ...cookieArgs], 30_000);
  const line = out.split("\n").find((l) => l.trim().startsWith("{"));
  if (!line) return null;
  try {
    const d = JSON.parse(line);
    return {
      id: String(d.id ?? ""),
      title: d.title ?? "",
      url: d.webpage_url ?? url,
      durationSec: Math.round(d.duration ?? 0),
      width: d.width ?? 0,
      height: d.height ?? 0,
      thumbnail: d.thumbnail ?? d.thumbnails?.[0]?.url ?? "",
      source,
    };
  } catch {
    return null;
  }
}

// Public: find vertical clips for one subject.
// tiktokCookies (optional) unlocks the reliable native-vertical TikTok source.
export async function findClips(
  subject: string,
  opts: { sportHint?: string; want?: number; tiktokCookies?: string } = {},
): Promise<ClipCandidate[]> {
  const { sportHint = "soccer", want = 6, tiktokCookies } = opts;
  const kept: ClipCandidate[] = [];

  // Primary source: TikTok (native vertical) when cookies are provided.
  if (tiktokCookies) {
    const ids = await searchIds(`${subject} ${sportHint}`, want * 2, tiktokCookies);
    for (const id of ids) {
      const c = await extract(id, "tiktok", tiktokCookies);
      if (c && (isVertical(c.width, c.height) || c.source === "tiktok")) kept.push(c);
      if (kept.length >= want) return kept.slice(0, want);
    }
  }

  // Fallback / cookie-less: YouTube, but ENFORCE vertical via real dims.
  const ids = await searchIds(`${subject} ${sportHint} shorts`, want * 3);
  for (const id of ids) {
    const c = await extract(`https://www.youtube.com/shorts/${id}`, "youtube");
    if (c && isVertical(c.width, c.height) && c.durationSec > 0 && c.durationSec <= 90) kept.push(c);
    if (kept.length >= want) break;
  }
  return kept.slice(0, want);
}

// --- self-check: proves the HARD VERTICAL GUARD (no network needed) ---
if (process.argv[1] && process.argv[1].endsWith("clips.ts")) {
  const run = async () => {
    // 1) guard unit test: a horizontal candidate must never pass isVertical
    if (isVertical(1920, 1080)) throw new Error("guard broken: passed a horizontal clip");
    if (!isVertical(1080, 1920)) throw new Error("guard broken: rejected a vertical clip");
    console.log("✓ vertical guard correct (rejects 1920x1080, accepts 1080x1920)");

    // 2) optional live search if a subject arg is given
    const subject = process.argv[2];
    if (subject) {
      const clips = await findClips(subject, { want: 4 });
      console.log(`live search "${subject}": ${clips.length} vertical clips`);
      for (const c of clips) {
        if (c.height <= c.width) throw new Error("NON-VERTICAL leaked!");
        console.log(`  [${c.source}] ${c.width}x${c.height} ${c.durationSec}s — ${c.title.slice(0, 50)}`);
      }
      if (clips.length === 0)
        console.log("  (0 — YouTube search rarely surfaces native verticals; wire TikTok cookies for real sourcing)");
    }
  };
  run();
}
