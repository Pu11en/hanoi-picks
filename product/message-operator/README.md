# Hanoi Picks Message Operator

This is the planned MiniMax M3 Discord agent for official server messages.

## Scope

Build this first. Do not build the Front Desk member-answering bot yet.

## Behavior

- Listens only in `agent-control`.
- Uses one template per message type.
- Drafts the post first.
- Shows the target channel before posting.
- Requires owner/admin approval.
- Posts only after approval.
- Logs approved posts.

## Message types

- announcements
- member-announcements
- join-premium
- free-premium
- premium-wins
- giveaways
- social-media
- contact-us

## Private setup

Copy `.env.example` to `.env` on the machine running the bot and fill in the real Discord and MiniMax keys there. The real `.env` file must never be committed.

## How to run safely

1. Copy `.env.example` to `.env` on the machine running the bot.
2. Fill in the Discord and MiniMax keys.
3. Keep `DRY_RUN=true` for the first test.
4. Run the channel scanner to confirm it can see the server.
5. Run the Message Operator.
6. In `agent-control`, type `!templates`.
7. Draft a safe test, for example: `!draft join-premium make a short premium offer`.
8. Press the approval button. With dry run on, nothing posts live.

## Commands

- `npm run message-operator:channels` — read-only live channel list.
- `npm run message-operator:start` — starts the Message Operator.

## Next build step

1. Connect to the live Discord server.
2. Read the real channel list.
3. Replace channel names with channel IDs where needed.
4. Test draft-only mode in `agent-control`.
5. Test approval buttons in dry-run.
6. Turn off dry-run only after Drew verifies the posts look right.
