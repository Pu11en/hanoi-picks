// Timeline mapper: given the voiceover word-timings + the list of pick subjects,
// produce one screen-time segment per subject so the visual always matches the voice.
//
// Input subjects come from the structured pick (e.g. ["Ronaldo","Waterman","Kane"]),
// NOT from noisy auto-transcription — we only use the transcript to find WHEN each
// subject is spoken. The intro (before the first name) folds into the first subject
// so the biggest name leads as the hook.
import fs from "fs";

export type Word = { word: string; start: number; end: number };
export type Segment = { subject: string; start: number; end: number };

// Flatten a whisper-style JSON ({segments:[{words:[{word,start,end}]}]}) to words.
export function flattenWords(whisperJson: { segments: { words?: Word[] }[] }): Word[] {
  const words: Word[] = [];
  for (const seg of whisperJson.segments) {
    for (const w of seg.words ?? []) {
      words.push({ word: w.word.trim().toLowerCase().replace(/[^a-z0-9 ]/g, ""), start: w.start, end: w.end });
    }
  }
  return words;
}

// Does a spoken word match a subject's lead token? Handles mis-transcription
// (e.g. "Waterman" spoken/heard as "water") via containment, min 4 chars.
function wordMatchesSubject(spoken: string, subjectLead: string): boolean {
  if (!spoken || spoken.length < 3) return false;
  if (spoken === subjectLead) return true;
  if (subjectLead.length >= 4 && spoken.length >= 4) {
    return subjectLead.includes(spoken) || spoken.includes(subjectLead);
  }
  return false;
}

// Find the first spoken time for each subject (in subject order).
export function findMentions(words: Word[], subjects: string[]): Map<string, number> {
  const mentions = new Map<string, number>();
  for (const subject of subjects) {
    const lead = subject.trim().toLowerCase().split(/\s+/)[0];
    const hit = words.find((w) => wordMatchesSubject(w.word, lead));
    if (hit) mentions.set(subject, hit.start);
  }
  return mentions;
}

// Build contiguous segments: each subject owns from its mention until the next
// subject's mention. Intro folds into the first subject. Last runs to totalDuration.
export function buildTimeline(words: Word[], subjects: string[], totalDuration: number): Segment[] {
  const mentions = findMentions(words, subjects);
  // Keep only found subjects, ordered by spoken time.
  const found = subjects
    .filter((s) => mentions.has(s))
    .map((s) => ({ subject: s, at: mentions.get(s)! }))
    .sort((a, b) => a.at - b.at);

  if (found.length === 0) {
    return [{ subject: subjects[0] ?? "subject", start: 0, end: totalDuration }];
  }

  const segments: Segment[] = [];
  for (let i = 0; i < found.length; i++) {
    const start = i === 0 ? 0 : found[i].at; // first subject also owns the intro
    const end = i === found.length - 1 ? totalDuration : found[i + 1].at;
    // Guard: never emit an inverted segment (e.g. a mention beyond totalDuration).
    if (end <= start) continue;
    segments.push({ subject: found[i].subject, start: Number(start.toFixed(2)), end: Number(end.toFixed(2)) });
  }
  return segments;
}

export function timelineFromFile(jsonPath: string, subjects: string[], totalDuration?: number): Segment[] {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const words = flattenWords(data);
  // Derive duration from the last spoken word if not given.
  const dur = totalDuration ?? (words.length ? words[words.length - 1].end : 0);
  return buildTimeline(words, subjects, dur);
}

// --- self-check: run with `npx tsx lib/timeline.ts` ---
if (process.argv[1] && process.argv[1].endsWith("timeline.ts")) {
  const path = process.cwd().endsWith("app")
    ? "../test-fixtures/locked-voice.json"
    : "Mediaposts-flow/test-fixtures/locked-voice.json";
  const segs = timelineFromFile(path, ["Ronaldo", "Waterman", "Kane"]); // duration auto-derived
  const dur = segs[segs.length - 1].end;
  console.log(`Timeline segments (auto duration ${dur}s):`);
  for (const s of segs) console.log(`  ${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s : ${s.subject}`);
  // assertions: 3 subjects, in order, no gaps, no inverted segments
  if (segs.length !== 3) throw new Error(`expected 3 segments, got ${segs.length}`);
  if (segs[0].subject !== "Ronaldo" || segs[0].start !== 0) throw new Error("Ronaldo must lead from 0 (hook)");
  for (const s of segs) if (s.end <= s.start) throw new Error(`inverted segment for ${s.subject}`);
  for (let i = 1; i < segs.length; i++)
    if (segs[i].start !== segs[i - 1].end) throw new Error(`gap before ${segs[i].subject}`);
  console.log("\n✓ timeline mapper WORKS — Ronaldo leads, in order, no gaps, no inverted segments");
}
