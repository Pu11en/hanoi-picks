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

## Next build step

1. Connect to the live Discord server.
2. Read the real channel list.
3. Replace channel names with channel IDs.
4. Build draft-only mode in `agent-control`.
5. Add approve/edit/cancel buttons.
6. Test one safe post before enabling every channel.
