import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM = `You write short 9x16 sports-betting video scripts for Hanoi Picks. Videos run 28-33 seconds, voiceover-driven.

The user may paste messy notes, screenshots converted to text, odds, player props, stat blurbs, partial ideas, or a rough draft. Extract the best 2-3 legs and turn them into one tight voiceover script.

FORMULA:
1. Bold/cocky hook.
2. 2-3 parlay legs.
3. Each leg includes player, line/stat, recent-form proof, and matchup edge if useful.
4. End with: "so we're going to roll with..."

VOICE RULES:
- First person, confident, fast. "We're going to roll with..."
- Sound like Hanoi Picks, not a formal betting article.
- Use punchy phrases like "This should be free," "almost guaranteed," or "only needs one to catch this line" when they fit.
- Keep it around 28-33 seconds read aloud.
- No intro, no signoff, no hashtags.
- Do not invent hard stats unless the user gave them. If notes are missing a stat, use softer language like "he's been clearing this lately" rather than fake numbers.
- Output ONLY the script. No labels, no commentary.`;

function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("claude", ["-p"], {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let out = "";
    let err = "";

    proc.stdout.on("data", (d) => { out += d.toString(); });
    proc.stderr.on("data", (d) => { err += d.toString(); });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error((err || out || `claude exited ${code}`).trim()));
      else resolve(out.trim());
    });

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { pickDump, hookVibe, reviseNote, previousScript } = await req.json();

    const userMsg = previousScript
      ? `Here is the current script:\n${previousScript}\n\nOriginal notes:\n${pickDump || "No original notes provided."}\n\nRevise it based on this chat note:\n${reviseNote}`
      : `Hook direction: ${hookVibe}\n\nMessy pick notes from user:\n${pickDump}`;

    const script = await runClaude(`${SYSTEM}\n\n${userMsg}`);
    return NextResponse.json({ script });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
