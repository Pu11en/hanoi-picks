# Hanoi Picks — Premium Purchase Flow — 2026-06-17

## Status

- [x] 1. Confirm payment platform — **WHOP** chosen ("Winnable" was Winible; client also said whop; going Whop)
- [x] 2. Teach Hanoi Agent to walk the client through Whop setup — DONE (10-step guide in workspace/CLAUDE.md; session cleared so agent loads it)
- [ ] 3. Client (via agent) creates Whop account + connects Discord — pending (client does in Whop UI)
- [ ] 4. Client creates 3 products ($10/wk, $25/mo, $500 lifetime) — pending
- [ ] 5. Client maps products → auto-assign **Premium** role — pending
- [ ] 6. Buy link posted in public `free-premium` channel — pending
- [ ] 7. Test purchase → confirm role + channels unlock — pending
- [ ] 8. Client connects payout/bank — pending (client-only)

Approach decided by Drew: the **agent walks the client through** steps 3–8 (client has agent access). My job = configure the agent's knowledge to guide it.

Status legend: ⬜ pending · 🟦 in progress · ✅ done · ⏸ deferred · 🚫 dropped

## Pre-flight findings

- Server is built + live; **Premium** role + locked PICKS/MEMBERS already exist.
- Drew does NOT want the bot to assign roles — the payment platform's native Discord integration assigns Premium automatically on purchase.
- Most steps happen in the platform's web dashboard (Drew clicks), not in bot code. Some steps only Drew can do (login, connecting payout/bank).
- Pricing locked: $10/week · $25/month · $500 lifetime.

## Open questions

- Q1: Platform = **Winible** (winible.com, capper-specific all-in-one) or **Whop** (whop.com, Discord-membership standard)? Client mentioned both. This changes the whole build:
  - Whop → drops into our existing role-gated Discord channels (pay → Premium role → unlock). Minimal change.
  - Winible → broader capper platform that may deliver picks through ITS own app/feed across Discord+SMS+email; Discord channels could become secondary. Bigger rework + likely higher cost.

## Verification

- (not yet run) — "verification" here = a live test purchase unlocks the channels.

## Spinoffs

- (none yet)

---

## Item details

### 1. Confirm payment platform
**Status:** pending
Whop is the standard for paid Discord memberships (handles payments + auto-assigns a Discord role on purchase). Need to confirm "Winnable" = Whop or something specific.

### 2. Create account + connect to Discord
**Status:** pending
Sign up, connect the platform's official bot to the Hanoi server, grant it permission to manage the Premium role.

### 3. Create the 3 products
**Status:** pending
$10/week, $25/month (recurring) + $500 lifetime (one-time).

### 4. Map products → Premium role
**Status:** pending
Each product, on successful payment, grants the **Premium** role → unlocks PICKS + MEMBERS automatically.

### 5. Buy link in free-premium
**Status:** pending
Post the checkout link/CTA in the public `🔓 free-premium` channel so free users can purchase.

### 6. Test purchase
**Status:** pending
Run one real/test checkout, confirm the buyer gets Premium and sees the locked channels.

### 7. Payout / bank setup
**Status:** pending
Connect bank/payout so revenue lands with you. Drew-only step.
