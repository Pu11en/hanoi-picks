# VIDEO EDITOR PLAN — Hyperframes + Agent

## What this builds
A "Make Video" screen inside the existing Next.js app where Drew:
1. Approves vertical clips for each player
2. Gets a polished first-draft video auto-composed by the agent
3. Refines it by talking to the agent inside an editor
4. Hits render → downloads the MP4
5. Every good video teaches the system → builds toward full automation

Engine: **Hyperframes only** (agent skills + Studio editor + renders via ffmpeg/Puppeteer)
Input always starts from: `test-fixtures/locked-voice.mp3` + `locked-voice.json` + `locked-transcript.txt`

---

## The 5 phases (build in this order)

---

### Phase 1 — Clip Discovery + Timeline Mapping
**Goal:** Find enough native 9:16 footage for every moment of the script. The visual ALWAYS shows the subject being talked about — no filler, no generic b-roll, ever.

**Step A — Map the script to a timeline (the key step):**
- Read `locked-voice.json` (word-by-word timestamps)
- Find when each subject (player OR team) is spoken → build a time segment for it
  - e.g. Ronaldo = 0:00–0:11, Waterman = 0:11–0:21, Kane = 0:21–0:30
- A subject mentioned more than once gets footage in EVERY spot it's mentioned
- **Hook rule:** order the script/legs so the biggest name leads — the opening seconds are the visual hook that makes the clip perform
- This segment map drives everything: each subject owns its slice of the timeline

**Step B — Find enough footage to fill each slot:**
- For each subject: search YouTube Shorts first, TikTok second via yt-dlp
  - Player: `yt-dlp "ytsearch8:Ronaldo soccer shorts" --match-filter "height>=1080 & width<height"`
  - Team: search the team name OR its star players
  - TikTok fallback: `yt-dlp "https://www.tiktok.com/search?q=Ronaldo+soccer"`
- **Pull enough clip seconds to cover that subject's whole segment.** If a slot is 11s, grab enough clips to fill 11s with no gap.
- Show thumbnail previews per subject; Drew approves the look. If clips are junk, agent scrapes more on command.
- Approved clips download to `app/public/clips/`. **All clip audio muted** — only the voiceover plays.
- **Rules:** Never download a horizontal clip. Never leave a slot unfilled. If nothing vertical found → flag it, ask Drew to pick manually.

**Already scaffolded:** `/api/search-clips`, `/api/download-clip`, Step 4 UI — needs real testing/tuning with the vertical filter.

---

### Phase 2 — Hyperframes First Draft (agent composes)
**Goal:** Agent auto-lays a first-draft composition using approved clips + voiceover + captions.

Setup:
```bash
npx skills add heygen-com/hyperframes   # installs agent skills
npx hyperframes init video-output        # scaffolds the composition project
```

Agent reads:
- Approved clip paths (from Phase 1)
- `locked-voice.mp3` → audio track, drives total duration
- `locked-voice.json` → word-by-word timings for caption sync
- `recipe.json` (if exists from a previous video — see Phase 5)

Agent writes `video-output/index.html`:
- **Clips placed by the Phase 1 segment map** — each subject's clips sit exactly in their time slot, so the visual matches the voiceover word-for-word (Ronaldo on screen while "Ronaldo" is spoken, cut to the next leg when the script switches)
- Biggest name leads = the hook
- Each slot filled completely — no gaps, no clip running out mid-sentence
- All clip audio muted; `locked-voice.mp3` on the audio track, full duration, drives total length
- Word-synced captions built from `locked-voice.json` timings, styled for 9:16 in Hanoi Picks brand colors
- Composition size: 1080×1920
- Uses Hyperframes catalog blocks for captions + any transitions

First draft will be rough — expected. That's what Phase 3 is for.

---

### Phase 3 — Editor + Agent Chat (refine together)
**Goal:** Drew sits in the editor and talks to the agent to shape the video.

**The core mechanism (how chat actually edits the video):**
Drew types a message → the pi coding agent rewrites `video-output/index.html` using the Hyperframes skills → the preview re-renders. That loop IS the editor's engine. The agent runs on the GitHub Copilot auto-router (Copilot subscription models only) plus pi research tools.

Two panels side by side:
- **Left:** Hyperframes Studio (`@hyperframes/studio`) embedded or launched — live preview player + timeline. Drew can drag clip order, scrub, see captions.
- **Right:** Chat panel — Drew types natural language, agent edits `index.html` live, preview refreshes.

Example agent commands Drew can say:
- "Make the Ronaldo clip longer"
- "Move the caption to the bottom third"
- "Add a flash transition between clips"
- "The Kane clip feels slow, swap it for a different one"

Agent uses the Hyperframes skills (already know the production loop) so plain language actually produces correct output — not guesswork.

---

### Phase 4 — Render + Download
**Goal:** One button → finished MP4.

```bash
npx hyperframes render   # outputs video-output/dist/output.mp4
```

- Wired to a `/api/render` route that calls `hyperframes render` as a child process
- Progress streamed back to the UI
- Download button appears when done
- Output: `1080x1920` MP4, ready to post

---

### Phase 5 — Recipe (the learning layer)
**Goal:** Every video makes the next one better. Path to full automation.

After Drew approves a render:
- Save the final `index.html` as `recipes/recipe-YYYY-MM-DD.html`
- Save a `recipe.json` summary: clip timing ratios, caption style, transitions used, total duration
- Next video: agent loads the latest `recipe.json` as its starting template instead of building from scratch

Over time:
- Recipe captures Drew's taste (caption position, clip pacing, style)
- Agent's first drafts get closer to done with every video
- When recipe is stable enough → add a "Full Auto" button that runs Phases 1–4 with no approvals needed

This is not machine learning. It's a growing template file. Simple, versioned, editable.

---

### Phase 6 — Background Music (later, for auto-posting)
**Goal:** Add trending music under the voiceover, auto-balanced so it's pleasant.

- Scrape popular TikTok audio (or another trending-music source) → get the MP3
- Lay it on a low-volume music track under the voiceover
- **Auto-balance the levels:** voiceover stays clearly on top, music sits under it — never overbearing, never too quiet. Use ffmpeg loudness normalization (e.g. `loudnorm` / ducking) to hit a consistent good ratio every time.
- Defer until auto-posting is being built; not needed for the manual editor.

---

## Build order for next session

1. **Fix clip search** — add vertical-only filter to existing `/api/search-clips`, test it actually returns Shorts/TikTok vertical clips
2. **Install Hyperframes** — `npx skills add heygen-com/hyperframes`, init the composition project inside `Mediaposts-flow/`
3. **Build `/api/compose`** — route that takes approved clip paths + fixtures → agent writes `index.html` first draft
4. **Wire the editor page** — "Make Video" page with Studio embed on left, chat panel on right
5. **Build `/api/render`** — calls `hyperframes render`, streams progress, returns download link
6. **Add recipe save/load** — after first successful render, add the recipe layer

---

## App facts (carry forward)
- Next.js app: `Mediaposts-flow/app` — run: `setsid npm run dev -- --port 4000 </dev/null >/tmp/mediaposts.log 2>&1 & disown`
- Tools installed: yt-dlp, ffmpeg, whisper (local, free)
- Keys: `app/.env.local` (gitignored)
- Checks before "done": `npx tsc --noEmit && npx eslint app/ && npm run build`
- Commit: `lrc --skip --staged` then `git commit --no-verify`
- Part 1 (script + voice) is FROZEN — never touch it

---

## What "automated" looks like eventually
Drew pastes pick notes → app extracts players → finds vertical clips → agent composes using recipe → renders → ready to post. Zero manual steps. The recipe is what gets us there, one video at a time.
