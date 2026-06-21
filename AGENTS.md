# AGENTS.md

## What this is

Hanoi Picks is a paid sports-picks Discord business. The Discord is the product: free members see public channels, paying members get Premium access, and the owner uses an AI Discord bot to manage the server.

## How it is organized

- `brand/` — brand direction, voice, colors, logo notes, and moodboard.
- `business/` — plans for money, payments, premium access, and strategy.
- `marketing/` — space for social posts, ads, campaigns, and public growth work.
- `product/` — the source-of-truth Discord product/bot code, docs, scripts, and workspace notes.
- `hanoi-picks-discord/` — secondary Claude Code Discord controller copy; do not treat it as the main product unless Drew explicitly says to revive it.

## Bot basics

The bot is a Node 20+ TypeScript Discord bot. It connects Discord channels to Claude Code sessions, stores channel/session state in SQLite, and uses Discord buttons for approval when Claude wants to edit files or run commands.

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
