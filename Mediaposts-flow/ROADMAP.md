# Mediaposts-flow — Roadmap & Decisions

The product makes 9:16 sports-betting videos for Hanoi Picks. One video at a time, iterate until automation is good.

## The locked test fixture (why we do the voice ONCE)
We generate the script + ElevenLabs MP3 + transcript a single time, then freeze it in `test-fixtures/`.
Everything downstream (scraping, editing, render) reuses that frozen MP3 + transcript so we never burn
script/voice credits while iterating. The transcript (with word timings from Whisper) is the source of
truth that drives clip search and caption timing.

## Script template = DONE
- Dynamic hybrid prompt built from real winning examples (pivotpicks, teeshsports) in `references-v2/`.
- Structure: hook ("easiest path to $1,000") -> 3-4 legs (player + line/stat -> recent-form proof -> matchup angle) -> CTA -> correlated bonus teaser.
- CTA: Discord now; promo codes (Chalkboard/Sleeper/Dabble) added later when Hanoi has them.
- We are effectively done making scripts. Focus shifts to video.

## NOW (current build)
1. Take ONE real parlay/pick from Drew.
2. Generate the dynamic script -> Drew approves.
3. ElevenLabs MP3 (or Drew uploads his own MP3).
4. Run `lock-fixture.sh` -> freeze MP3 + Whisper transcript into `test-fixtures/`.
5. Add a "Find Clips" section to the web app: the AI reads the transcript, searches for the right
   gameplay/highlight videos (players + events named in the transcript), shows candidates, Drew approves,
   it downloads them.

## PHASE 2 — Clip scraping (next)
- AI brain = the **pi coding agent** (this agent), NOT Claude Code.
  - Reason: pi has the Copilot auto-router (routes across models inside the GitHub Copilot subscription
    only — NOT Drew's other subscriptions) and strong research/GitHub tools (octocode, brave-search)
    for finding footage.
  - Architecture: the app's API route shells out to the pi agent the same way it currently shells out to
    `claude -p`. The pi agent gets the transcript + player list and runs the search/download.
- Sources: YouTube + YouTube Shorts first (vertical preferred); TikTok and other sources added after.
- Output: candidate cards (thumbnail, title, length, link, vertical/horizontal) -> Drew approves -> yt-dlp downloads to a per-video folder.

## PHASE 3 — Video editing section (later, plan only)
- A section where the AI drops the downloaded gameplay MP4s (decent-length chunks) into a workspace.
- Drew manually arranges them on a timeline / structure.
- Likely additions: AI-generated graphics/captions via Remotion or hyperframes; word-synced captions from the
  locked transcript timings.
- First render WILL be rough. Keep iterating to find the best automation flow before locking it.

## Open questions for later
- Exact handoff format between pi agent (scraper) and the editing timeline.
- Whether graphics are Remotion-rendered, HTML/hyperframes, or AI images.
- How much of the timeline is auto-assembled vs manual.
