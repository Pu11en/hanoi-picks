# Hanoi Picks — Message Operator Bot Plan

## Scope (locked)

**This is the ONLY bot we are building right now.** The Front Desk (the bot that
answers members) is DEFERRED — we don't yet know what members will ask, so we are
not building it. All focus is the Message Operator.

## What this bot is

The Message Operator is the bot for official server posts. It writes and posts the
official messages into specific channels: announcements, member announcements,
join premium, free premium, premium wins, giveaways, social, contact-us, and tickets.

## Core decision (locked)

- **Engine: MiniMax M3 agent.** Not Claude.
- **Home: the `agent-control` channel.** That is the single place the owner goes
  to command it — "make an announcement", "do a member announcement",
  "post the join-premium offer", etc. The owner talks to it there; it posts the
  finished message into the correct target channel.
- **Templates: one instruction file per message type.** Each type (announcement,
  member-announcement, join-premium, free-premium, premium-wins, giveaway,
  social, contact-us, tickets) gets its own template file telling the bot how to write
  that kind of post. The owner just says what they want; the bot pulls the
  matching template and fills it in.
- **Draft-first, never auto-post.** It drafts, shows the target channel, and
  waits for the owner's approval before anything goes live.

## Owner flow

1. Owner opens the `agent-control` channel.
2. Owner says what they want, for example:
   - “Make a Premium announcement for tonight.”
   - “Post a free Premium promo.”
   - “Make a Premium wins post from this screenshot.”
   - “Write a giveaway post.”
3. Bot asks for any missing info.
4. Bot drafts the message in the right style.
5. Bot shows:
   - target channel
   - final message
   - buttons: approve, edit, cancel
6. Owner approves.
7. Bot posts in the target channel.
8. Bot logs what it posted.

## Channel jobs

### announcements

Purpose: public server-wide updates.

Use for:

- New feature / new offer.
- Big win recap.
- Schedule update.
- Server update.
- Important reminder.

Style:

- Clear headline.
- Short body.
- One CTA.
- Sales-forward but not messy.

Example:

> 📢 HANOI PICKS UPDATE
>
> Premium is live for tonight’s board.
>
> 8+ plays, full data writeups, and value spots across the slate.
>
> If you’re still in free chat, check `join-premium` or use code HANOI on a partner book to unlock access.

### member-announcements

Purpose: Premium-only updates.

Use for:

- Premium card is posted.
- Timing changes.
- Important instructions for paid members.
- Member-only reminders.

Style:

- Direct.
- More operational.
- Less selling because they already paid.

Example:

> 🚨 PREMIUM BOARD IS LIVE
>
> Tonight’s slips are posted.
>
> Check the writeups, manage units, and don’t chase late steam unless the update says so.

### join-premium

Purpose: convert free users into paid or free-Premium users.

Use for:

- Main Premium offer.
- Pricing.
- What Premium includes.
- How to get free Premium with partner books.

Must include:

- $12 weekly
- $30 monthly
- $300 lifetime
- 8+ daily plays
- full data writeups
- major sports list
- code HANOI
- 1 signup = 4 weeks free
- 2+ signups = 12+ weeks free

Example:

> 🌟 START WINNING WITH HANOI PICKS
>
> Premium gets the full board: 8+ daily slips, full data writeups, EV+ picks, and every major sport.
>
> 💳 Membership:
> • $12 weekly
> • $30 monthly
> • $300 lifetime
>
> Want free Premium? Use code HANOI on a partner book.
> 1 signup = 4 weeks free. 2+ signups = 12+ weeks free.
>
> Once you sign up, DM proof and say if you’re in Free Chat or Premium.

### free-premium

Purpose: explain the sportsbook signup route.

Use for:

- Chalkboard.
- Sleeper.
- Underdog.
- Parlay Play.
- Free Premium claiming instructions.

Example:

> 🎁 GET FREE PREMIUM
>
> Use code HANOI on any partner platform:
>
> 📋 Chalkboard — 1 month free + $100 deposit match
> 💤 Sleeper — 1 month free + $100 deposit match
> 🐶 Underdog — deposit $5, get $75 free
> 🃏 Parlay Play — 1 month free + $100 deposit match
>
> 1 signup = 4 weeks free.
> 2+ signups = 12+ weeks free.
>
> After signing up, DM proof and say if you’re in Free Chat or Premium.

### premium-wins / premium-results / premium-testimonials

Purpose: proof and momentum.

Use for:

- Winning slips.
- Screenshots.
- Monthly recap.
- Member testimonials.
- Track record proof.

Rules:

- Never invent wins.
- Only post from owner-provided screenshots, numbers, or text.
- If details are missing, ask before posting.

Example:

> ✅ PREMIUM RESULTS
>
> Another clean night from the board.
>
> Full history stays verified inside Premium.
>
> If you’re watching from free chat, the full card is in Premium.

### giveaways

Purpose: giveaways and promotions.

Use for:

- Free Premium giveaways.
- Signup promos.
- Social follow giveaways.
- Referral contests.

Style:

- Clear prize.
- Clear entry rule.
- Clear deadline.
- No confusing terms.

Example:

> 🎁 GIVEAWAY IS LIVE
>
> Prize: free Premium access.
>
> To enter:
> 1. Follow Hanoi Picks on social.
> 2. Drop proof in the thread.
> 3. Stay active in free chat.
>
> Winner will be picked after the deadline.

### social-media

Purpose: push followers to the social funnel.

Use for:

- Instagram.
- TikTok.
- YouTube.
- New clip posted.
- Follow CTA.

Example:

> 📲 FOLLOW HANOI PICKS
>
> Instagram: https://www.instagram.com/hanoipicks?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr
> TikTok: www.tiktok.com/@hanoipicks
> YouTube: https://www.youtube.com/@hanoipicks
>
> Free plays, clips, results, and Premium updates drop there too.

### tickets / contact-us

Purpose: support, proof review, and issue handoff.

Use for:

- Payment help.
- Proof submission help.
- Access problems.
- Confused users.
- Opening private support tickets / threads.

Style:

- Short.
- Helpful.
- Route to human when needed.

Example:

> 🎫 NEED HELP? OPEN A TICKET
>
> Use this channel for access issues, payment questions, and free Premium proof.
>
> Include what you’re trying to access, whether you’re in Free Chat or Premium, and screenshot/proof if needed.

## Safety rules

The Message Operator must always:

- Show target channel before posting.
- Ask for approval before posting.
- Never post into Premium pick channels unless explicitly allowed later.
- Never invent results, testimonials, or winning history.
- Never change prices without owner confirmation.
- Never DM members unless that is explicitly added later.
- Log every approved post.

## Commands we probably need

- `/draft channel:<channel> goal:<what to post>`
- `/announce channel:<channel> message:<short instruction>`
- `/promo type:<join-premium|free-premium|giveaway>`
- `/wins source:<screenshot/text>`
- `/social platform:<instagram|tiktok|youtube|all>`
- `/templates` — shows available channel templates
- `/approve` — post current draft
- `/cancel` — discard current draft

## Build order

1. Lock the channel list.
2. Build template config for each channel.
3. Build draft-only mode.
4. Add approval buttons.
5. Add posting permission checks.
6. Add post log.
7. Test in one safe channel.
8. Roll out channel by channel.

## What we have now

We have the plan and the message templates.

We do not yet have the live Discord bot that posts these messages. That is the next build step.
