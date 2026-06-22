# Mediaposts-flow

Local dashboard for creating Hanoi Picks short-form betting videos.

## Current app

- The Next.js app lives in `app/`.
- Run locally from `app/` with `npm run dev -- --port 4000`.
- Step 1 is a single messy-notes paste box, not separate leg fields.
- Script generation calls the local `claude` CLI in print mode so it uses Drew's Claude Code subscription instead of a raw Anthropic API key.
- Voice generation uses ElevenLabs from `app/.env.local`, or a user-uploaded MP3.
- Clip finding/rendering is not built yet; it is the next major layer.

## Checks before calling work done

From `app/` run:

```bash
npx tsc --noEmit
npx eslint app/
npm run build
```

Then confirm `http://localhost:4000` returns successfully.
