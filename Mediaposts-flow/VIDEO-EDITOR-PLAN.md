# VIDEO EDITOR PLAN — clone-and-strip, two agents

## What this builds
A "Make Video" flow for Hanoi (and the other brands) that turns the locked voiceover into a post-ready 9:16 video. **We do not build a video editor from scratch** — we install proven open-source agent skills and adapt them.

## The two agents (kept separate on purpose)
1. **Canvas / image agent** — turns pasted inspiration into branded overlays + cutout graphics.
   - Engine: **Gemini Nano Banana Pro** (`gemini-3-pro-image-preview`, best) / **Nano Banana 2** (`gemini-3.1-flash-image`, fast). The canvas already uses `@google/genai`.
   - Skills to strip: **`smixs/visual-skills`** (current Gemini 3 Pro/Flash prompting) + **`bananahub-ai/bananahub-skill`** (Google's official image best-practices). Prompt library: **`YouMind-OpenLab/awesome-nano-banana-pro-prompts`**.
   - Cutouts (transparent PNG, "just the element"): **`rembg`** — local, free, one command. No Gemini needed.
2. **Video agent** — assembles the actual MP4.
   - Brain to strip: **`browser-use/video-use`** — chat-driven video editor. Drop clips in a folder, talk, get `final.mp4`. Already cuts, color-grades, burns captions, self-checks output, and uses **Hyperframes** for overlays.
   - Craft skills to add: **`iart-ai/tiktok-video-skills`** — `short-form-video`, `caption-animation` (kinetic captions), `lower-thirds` (leg/odds graphics), `countdown-video` (hype).

## Why clone-and-strip
`video-use` + the iart motion skills + the Gemini image skills already encode the craft (timing, safe areas, frame-accurate render, on-brand type). Installing them makes the agent a professional editor on day one. We adapt, we don't reinvent.

---

## The pipeline (start → finish)
1. **Locked fixture in** — `test-fixtures/locked-voice.mp3` + `locked-voice.json` (word timings) + transcript.
2. **Timeline map** — read word timings → a segment per subject (player/team). Biggest name leads = hook. Repeated names get footage in every spot.
3. **Find vertical clips** — yt-dlp searches YouTube Shorts first, TikTok second, native 9:16 only. Pull enough seconds to fill each segment. Drew approves thumbnails; agent scrapes more on command. All clip audio muted.
4. **Brand overlays from the canvas** — the canvas (folded into the app, see below) holds pasted inspiration. Canvas agent makes branded overlays + cutouts (Gemini + rembg). These feed the video as graphics.
5. **Assemble** — `video-use` lays clips into their slots under the voiceover, burns kinetic captions synced to `locked-voice.json`, drops lower-thirds (leg + odds), applies the brand recipe. Self-evals each cut.
6. **Render + download** — `final.mp4`, 1080×1920, ready to post.
7. **Per-brand recipe saved** — the approved look saved as that brand's template; next video for that brand starts in its style. (Tomo's point: brand-specific recipes so no babysitting across 8 brands.)
8. **Music (later)** — trending audio under the voice, auto-balanced with ffmpeg `loudnorm`/ducking. Deferred to auto-posting.

---

## The canvas, folded in
`creative-canvas-local` already exists: tldraw board, paste/drop auto-named images, every image agent-aware, Gemini image gen/edit wired, local-only. **Its guts move into the Hanoi app** as a style panel — Drew pastes inspiration, the canvas agent makes overlays, the video agent uses them. No separate app, no image hosting needed (files read off disk).

---

## Per-brand recipes (scaling to 8 brands)
- Each brand = one recipe file: colors, caption style, overlay look, pacing.
- Built once from that brand's canvas references, then reused.
- Video agent loads the brand recipe and executes the style automatically — Drew approves, doesn't restyle.

---

## Build order (next session)
1. **Install + smoke-test the skills** — `video-use`, `iart-ai/tiktok-video-skills`, `smixs/visual-skills`, `bananahub-skill`; install `rembg`. Confirm each runs.
2. **Wire the clip finder** — vertical-only yt-dlp (Shorts→TikTok) driven by the timeline map; approval UI. (Existing `/api/search-clips` adapted.)
3. **Fold the canvas into the app** — style panel: paste → Gemini overlay → rembg cutout → saved as brand asset.
4. **Point `video-use` at the pipeline** — feed it approved clips + voiceover + word timings + brand overlays → `final.mp4`.
5. **Brand recipe save/load** — capture the approved look per brand.
6. **Make Video page** — one screen: timeline + clip approval + style panel + chat + preview + render.

---

---

## The endgame: mass multi-platform auto-posting
Once a brand's video renders, the same pipeline posts it across that brand's accounts — **8 brands × 3 platforms (YouTube, TikTok, Instagram)**. Drew has all logins. The client-brain AI (Tomo-style: knows each brand's voice/strategy) writes the caption/title/hashtags per platform, then publishes.

**Brand × platform map (accounts exist for all of these):**

| Brand | Handle | YouTube | TikTok | Instagram |
|---|---|---|---|---|
| Hanoi | hanoipicks | ✓ | ✓ | ✓ |
| Yun | yun.plays | ✓ | ✓ | ✓ |
| Tias | tias.locks | ✓ | ✓ | ✓ |
| Mandem | mandem.plays | ✓ | ✓ | ✓ |
| Halic | halicpicks | ✓ | ✓ | ✓ |
| Evora | evoralocks | ✓ | ✓ | ✓ |
| Doze | doze.picks | ✓ | ✓ | ✓ |
| Dakar | dakarpicks | ✓ | ✓ | ✓ |

**Credentials:** stored ONLY in `secrets/social-accounts.secret.json` — gitignored, chmod 600, never committed/pushed. The plan and repo never contain passwords.

**Posting approach (decide at build time):** prefer official upload APIs / a proven scheduler over raw password automation, which gets accounts flagged/banned. Two candidates already in hand: **Blotato** (Drew pays for it; has an API made for multi-platform posting — the lazy win) and **`gitroomhq/postiz-app`** (open-source social scheduler, free backup). This is a later phase — captured here so the pipeline is built to feed it. Deferred until the single-brand (Hanoi) video flow is proven end to end.

---

## App facts
- Next.js app: `Mediaposts-flow/app` — run: `setsid npm run dev -- --port 4000 </dev/null >/tmp/mediaposts.log 2>&1 & disown`
- Installed local + free: yt-dlp, ffmpeg, whisper. To add: `rembg`, the four skill repos above.
- Keys: `app/.env.local` (gitignored). `GEMINI_API_KEY` already used by the canvas. `video-use` wants `ELEVENLABS_API_KEY` (already set) for its transcribe step — but we already have word timings, so that step may be skippable.
- The video AI runs on the GitHub Copilot auto-router (Copilot subscription models only).
- Checks before "done": `npx tsc --noEmit && npx eslint app/ && npm run build`, then curl localhost:4000.
- Commit: `lrc --skip --staged` then `git commit --no-verify`. Repo: Pu11en/hanoi-picks.
- Part 1 (script + voice) is FROZEN — never touch it.

## Tools / repos referenced
- `browser-use/video-use` — chat-driven video editor (the brain)
- `iart-ai/tiktok-video-skills` — vertical short-form craft (captions, lower-thirds, countdown)
- `smixs/visual-skills` + `bananahub-ai/bananahub-skill` — Gemini Nano Banana Pro/2 image skills
- `YouMind-OpenLab/awesome-nano-banana-pro-prompts` — overlay style prompt library
- `rembg` — transparent-background cutouts
- `heygen-com/hyperframes` — overlay render engine (used by video-use)
