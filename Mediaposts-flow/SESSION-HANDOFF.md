# SESSION HANDOFF — Video Pipeline (MP3 + transcript → MP4)

## Read this first, then start building Part 2.

## The two halves of this product
**Part 1 — DONE & FROZEN. Do NOT rebuild or re-test.**
- pick notes → dynamic script (Claude CLI) → MP3 (ElevenLabs OR Drew uploads his own voice).
- Confirmed working. The hybrid template (built from pivotpicks/teeshsports examples) works.
- We never burn script/voice credits again. It's locked.

**Part 2 — THE ONLY FOCUS NOW: MP3 + transcript → MP4.**
- This is what we are configuring and iterating on.
- It STARTS FROM THE LOCKED FIXTURE, not the script flow.

## The locked fixture (the input to ALL video work)
Folder: `Mediaposts-flow/test-fixtures/`
- `locked-voice.mp3` — the voiceover (Adam voice, ~30s, Ronaldo/Waterman/Kane soccer parlay)
- `locked-transcript.txt` — plain spoken text
- `locked-voice.json` — Whisper word-by-word timings (for caption sync)
- `locked-voice.srt` / `.vtt` — subtitle files
- `locked-voice.tsv` — timing table

Spoken content = a 3-leg soccer parlay: Ronaldo over 1.5 shots on target, Waterman over 0.5 shots
on target, Harry Kane anytime scorer.

## Part 2 pipeline = MP3 + transcript → MP4 (build/iterate this)
1. **Find clips** — read the transcript, pull player names (Ronaldo, Waterman, Kane), search
   YouTube per player, show candidates, Drew approves, yt-dlp downloads to `app/public/clips/`.
   (Already scaffolded: `/api/search-clips`, `/api/download-clip`, Step 4 UI. Needs real testing/tuning.)
2. **Assemble MP4** — NOT BUILT YET. This is the next real work.
   - ffmpeg (already installed) stitches approved clips back-to-back under the locked MP3.
   - Voiceover audio = `locked-voice.mp3` sits on top, drives total duration.
   - Captions = burn in word-synced from `locked-voice.json` / `.srt`.
   - 9:16 output 1080x1920. Horizontal clips get BLURRED BACKGROUND FILL, never hard crop (Drew's rule).
   - First render will be rough — expected. Iterate to find the best automation.

## IMPORTANT architecture note for Part 2
- Drew wants the VIDEO part to start directly from the locked fixture — consider a separate
  "Make Video" entry point/page that loads `test-fixtures/` directly, instead of forcing the
  user through dump → script → voice first.
- The AI brain for clip-finding/editing should eventually be the **pi coding agent** (this agent),
  using the **GitHub Copilot auto-router** (Copilot subscription models ONLY — not Drew's other subs)
  plus pi's research tools (octocode, brave-search). Currently scripts use `claude -p`; swap the
  video-AI to pi agent later.

## App facts
- Next.js app at `Mediaposts-flow/app`. Run: `npm run dev -- --port 4000`
  (use `setsid npm run dev -- --port 4000 </dev/null >/tmp/mediaposts.log 2>&1 & disown` to survive shell exit).
- Tools installed: yt-dlp, ffmpeg, whisper (all local, no API cost).
- Keys in `app/.env.local` (gitignored): ELEVENLABS_API_KEY set. Voice cloning NOT available on current
  ElevenLabs plan (needs Creator upgrade). Using stock voice "Adam" (pNInz6obpgDQGcFmaJgB) for now.
- Checks before "done": `npx tsc --noEmit && npx eslint app/ && npm run build`, then curl localhost:4000.
- Commit pattern: `lrc --skip --staged` then `git commit --no-verify`. Repo: Pu11en/hanoi-picks.

## NEXT STEP when new session starts
Build the **Assemble MP4** step: `/api/render` route that takes approved clip paths + the locked MP3 +
the caption file and uses ffmpeg to produce a 1080x1920 MP4 with blurred-fill clips, voiceover, and
burned captions. Wire the "Render Video" button (currently disabled) to it.
