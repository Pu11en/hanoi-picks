# Hanoi Picks — Permissions Audit

## Status

Audit run against the live Discord server.

## Confirmed good

- Free users cannot see PRO PICKS channels.
- Free users cannot see MEMBERS channels.
- Free users cannot see member-announcements.
- Free users cannot see giveaways.
- agent-control is hidden from everyone, Free, and Premium roles.
- Premium users can see the paid picks and member areas.
- support is visible to Free and Premium users.
- support has a real Open Ticket button.

## Fixed during audit

- free-premium was hidden from free users. It is now visible to free users.
- free-premium is read-only for regular users so the offer stays clean.
- @everyone, Free Member, and Premium could ping everyone. That was removed.

## Remaining admin check

The Hanoi Agent bot role still has broad admin-level power. The code prevents accidental mass pings, but the role itself should be tightened later by a Discord admin because Discord would not let the bot edit its own highest role.

Recommended bot role permissions:

- View Channels
- Send Messages
- Read Message History
- Embed Links
- Attach Files
- Add Reactions
- Use Slash Commands
- Create Private Threads
- Send Messages in Threads
- Manage Threads

Do not grant:

- Administrator
- Mention Everyone
- Manage Roles
- Ban/Kick members

## Question to decide later

Premium users currently cannot see some public/free channels, including free-chat, public announcements, and join-premium. That may be intentional, but it should be confirmed after the server layout is reviewed visually.
