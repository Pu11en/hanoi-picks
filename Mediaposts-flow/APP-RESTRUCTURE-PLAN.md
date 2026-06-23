# APP RESTRUCTURE PLAN — queue-first, one clean flow

## The core correction
The app's front door is WRONG. Right now `/` is the old manual wizard (type notes → script → voice → clips). But the input now comes from **Discord → the queue**, not typed here. So the wizard shouldn't be the front door at all. That mismatch is also what's throwing the hydration error.

## The right flow (what Drew described)
```
Discord #picks-intake  →  Queue (the home page)  →  [Go on a pick]  →  Make Video flow
```

### 1. Queue = the home page
- Picks arrive from Discord (already built). The home page IS the queue.
- Each queued pick is a card: the pick text, who posted it, when.
- Each card has a **"Make Video →"** button. Drew picks which one goes.
- No more typing notes here. Input is the queue.

### 2. Make Video flow (one page, real sections + back/next)
When Drew clicks "Make Video" on a pick:
- **Section A — Script + Voice** (Part 1, frozen): auto-generates the script from the pick, then the voiceover. (For now we can start from the locked fixture to test the rest.)
- **Section B — Clips** (the part Drew detailed):
  - Auto-reads the transcript → **auto-detects every player / team / subject** (no typing)
  - One **row per subject** (Ronaldo, Waterman, Kane…)
  - Each row auto-loads vertical TikTok clips (Apify) — already searching while Drew reviews
  - Drew **picks the clip he wants** per subject; a **"Find more"** button re-scrapes (first scrape won't always nail it)
  - When every subject has a pick → continue
- **Section C — Build**: assembles the video (clips on their timeline slots + voiceover + captions), renders the MP4.

### 3. Navigation
- Top nav: **Queue · Make Video · Library** — always visible, click to move around.
- Inside Make Video: clear **Back / Next** between sections.

## What gets auto-detected (the one new brain piece)
Pull subject names straight from the transcript automatically (players, teams). Today they're typed in by hand — that becomes automatic. The pick text also names them explicitly, so we cross-check both.

---

# AUDIT — what exists, what to fix

## Working brains (keep)
- `lib/timeline.ts` — who's on screen when (verified)
- `lib/clips.ts` — vertical TikTok finder via Apify (verified)
- `/api/search-clips`, `/api/queue` — working
- Part 1 script/voice generation (frozen, works)

## Problems to fix
1. **Fragmented pages, no navigation** — home wizard, `/clips`, `/queue` are islands. → Unify under one shell with a real nav bar.
2. **Wrong front door** — `/` is the manual wizard. → Make `/` the queue.
3. **Hydration error** — caused by `localStorage` read inside `useState` initializers in the old wizard. → Fix the pattern (load in `useEffect`), and it's mostly removed once the wizard stops being the front door.
4. **`/clips` makes Drew type names** — wrong. → Replace with auto-detected subjects fed from the transcript.
5. **No "Make Video" container** — the steps exist as scattered pieces. → One flow page with sections + back/next.

## Cleanup order
1. Add real nav links (Queue · Make Video · Library) — instant orientation
2. Make `/` the queue (kills the hydration error + fixes the front door)
3. Fix the localStorage/useState hydration pattern in the reused script/voice code
4. Build the Make Video flow page with the 3 sections
5. Clips section: auto-detect subjects → auto-search → pick → find-more
6. Wire build/render last

---

## One open decision
On the Clips section, when subjects are auto-detected: **auto-search all of them immediately** (Drew just reviews + picks) vs **a "Find clips" button per subject** (Drew triggers each). Recommendation: auto-search all on arrival so clips are loading while he reviews, plus a "Find more" button per subject for re-scrapes.
