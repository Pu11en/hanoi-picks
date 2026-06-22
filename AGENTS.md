# AGENTS.md

## What this is

Hanoi Picks is a paid sports-picks Discord business. The Discord is the product: free members see public channels, paying members get Premium access, and MiniMax-powered bots help welcome, answer, and publish inside the server.

## How it is organized

- `brand/` — brand direction, voice, colors, logo notes, and moodboard.
- `marketing/` — space for social posts, ads, campaigns, and public growth work.
- `product/` — the source-of-truth Discord product/bot code, docs, scripts, and workspace notes.

## Bot basics

Planned production bots should use MiniMax, not Claude Code. The current codebase contains a Node 20+ TypeScript Discord controller from the earlier Claude setup, but the go-forward plan is MiniMax bots on Railway:

- Front Desk — public welcome, FAQ, contact-us, gentle Premium nudges.
- Message Operator — owner-commanded announcements, promos, wins, giveaways, and channel-specific official posts.
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
