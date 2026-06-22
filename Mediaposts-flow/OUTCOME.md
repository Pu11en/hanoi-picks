# Mediaposts-flow — Locked Outcome (v1)

The finish line for the first build. Funnel for the Hanoi Picks Discord. Localhost app, Claude Code as the engine.

## What it does, end to end
A pick goes in → a finished 9×16 video comes out, looking like our reels. Stops at **render-ready** (you tap post yourself). True auto-post is a later phase.

## The flow
1. **Dump the pick** — form: sport/event, 2–3 legs (player, stat, line, recent-form stat, optional matchup edge).
2. **Script** — written in the locked Hanoi voice (see SCRIPT-TEMPLATE.md). Edit back-and-forth, lock it.
3. **Voiceover — two ways in:**
   - ElevenLabs API (channel voice), OR
   - Upload an MP3 of a real person reading the script.
4. **Clips** — from the script, pull out the named players/teams → find + download clean clips → stitch to match the voiceover.
5. **Captions + motion graphics** — word-synced captions + motion graphics that visualize the picks. Style still to be dialed.
6. **Preview → approve → render** the final 9×16 MP4. Done. (Post manually for now.)

## Parts we build on (proven, not hand-written)
- **remotion-superpowers** — Claude Code plugin = the orchestration brain (commands: create-short, add-voiceover, find-footage, add-captions, add-music, review-video).
- **remotion-captioneer** — Whisper → word-synced animated captions engine.
- **claude-shorts** — caption-styles + remotion-patterns references; compute_reframe.py / snap_boundaries.py for auto 9×16 reframe.
- **YumCut + ScryptCut** — dashboard layout reference.
- **yt-dlp / VidBee** — clip fetching (already proven working).

## Clip sourcing — mapped (tiered)
The agent finds + downloads clips by itself. Built in tiers:
- **Tier 1 (start here, no API key):** yt-dlp search-and-download. Agent turns script names into queries ("[player] [stat] highlights"), pulls top 3-5 candidates. Wrap as an MCP tool (ref: ytdlp-mcp / ytmp3-mcp) so Claude Code can call it. User taps which clip to use.
- **Tier 2 (smarter pick):** CLIP/semantic ranking so it auto-picks the best on-screen moment, not just the first hit. Refs: SemanticHoops (NBA footage + CLIP/Qdrant), footage-retrieval-automation (script-line → footage → stitch + voiceover).
- **No cropping:** convert 16:9 → 9:16 via **blurred-background fill** (ffmpeg boxblur pad), clip centered, nothing cut off. NOT a center crop.

**Build order decision:** build everything UP TO the clip layer first, then tackle clip-finding as its own focused step.

## Out of scope for v1
Auto-posting to TikTok/IG. Multi-brand (this is Hanoi Picks only).
