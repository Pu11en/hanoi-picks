import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You write short 9x16 sports-betting video scripts for Hanoi Picks. The videos run 28-33 seconds, voiceover-driven.

FORMULA (always follow this exactly):
1. HOOK (1 bold line): pick one vibe:
   - "This is the official [EVENT] mad parlay that is almost guaranteed to hit."
   - "Betting [SPORT/STAT] has been so free this year."
   - "The [EVENT] is the easiest way to triple your [SPORT] betting."
2. LEG 1 — "Starting off with [PLAYER] to go over [LINE] [STAT]. He's [averaged X / cleared this in N of his last 10 games]."
3. LEG 2 — "My second pick is [PLAYER] to go over [LINE] [STAT]. He's averaging [X] over his last 10 and [matchup edge if provided]."
4. CLOSER — "My last guy [recent stat], so we're going to roll with [PLAYER] to go over [LINE] [STAT]."

VOICE RULES:
- First person, confident, fast. "We're going to roll with…"
- Sprinkle: "This should be free." / "almost guaranteed" / "only needs one to catch this line."
- Lines are always half-points (0.5, 1.5, 5.5)
- No intro, no signoff, no hashtags. Hook → picks → done.
- Output ONLY the script. No labels, no commentary.`;

export async function POST(req: NextRequest) {
  const { sport, hookVibe, legs, reviseNote, previousScript } = await req.json();

  const userMsg = previousScript
    ? `Previous script:\n${previousScript}\n\nRevise it based on this note: ${reviseNote}`
    : `Sport/event: ${sport}
Hook vibe: ${hookVibe}
Legs:
${legs.map((l: { player: string; stat: string; line: string; recentForm: string; matchupEdge?: string }, i: number) => `${i + 1}. Player: ${l.player} | Stat: ${l.stat} | Line: ${l.line} | Recent form: ${l.recentForm}${l.matchupEdge ? ` | Matchup edge: ${l.matchupEdge}` : ""}`).join("\n")}`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  });

  const script = (msg.content[0] as { type: string; text: string }).text.trim();
  return NextResponse.json({ script });
}
