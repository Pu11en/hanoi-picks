# AGENTS.md

## What this is

Hanoi Picks is a paid sports-picks Discord business. The Discord is the product: free members see public channels, paying members get Premium access, and MiniMax-powered bots help welcome, answer, and publish inside the server.

## How it is organized

- `brand/` — brand direction, voice, colors, logo notes, and moodboard.
- `marketing/` — space for social posts, ads, campaigns, and public growth work.
- `product/` — the source-of-truth Discord product/bot code, docs, scripts, and workspace notes.

## Bot basics

Planned production bots should use MiniMax, not Claude Code. Current focus is the Message Operator only; defer the Front Desk member-answering bot until real member questions are known.

- Message Operator — MiniMax M3 agent commanded from `agent-control`; drafts and posts announcements, promos, wins, giveaways, and channel-specific official posts using per-type templates.
- Bouncer — Discord AutoMod plus a proven moderation bot, not custom AI.

Required before running:

- Node 20 or newer.
- Claude Code installed and already logged in.
- Discord bot token, server ID, allowed user IDs, and base project folder set in `.env`.

## Run the bot

From `product/`:

```bash
npm install
./run.sh
```

Useful commands there:

```bash
npm run dev      # run in development mode
npm run build    # build production files
npm start        # run built bot
npm test         # run tests
```

In Discord, register a project to a channel with `/register`, then talk in that channel to use Claude through the bot.
