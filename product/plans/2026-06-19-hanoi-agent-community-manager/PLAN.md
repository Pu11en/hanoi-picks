# Hanoi Community Bot — LangBot + MiniMax M3 — 2026-06-19

## Status

- [ ] 1. Stand up LangBot as a separate 3rd bot (own Discord app + token, own process — never touches the 2 Claude admin bots) — pending
- [ ] 2. Wire MiniMax M3 as the LLM (OpenAI-compatible endpoint, key, model id, verify it answers) — pending
- [ ] 3. Per-channel responsibility map (active / quiet / hands-off for every channel) — pending ← Drew's core ask
- [ ] 4. Community persona + knowledge base (identity, FAQ, free vs premium, pricing, hard guardrails) — pending
- [ ] 5. Concierge — answer member Qs + contact-us tickets (LangBot native knowledge base) — pending ✅ native
- [ ] 6. Greeter — welcome new joiners (small `on_member_join` plugin or Discord Welcome Screen) — pending 🟠 small build
- [ ] 7. Guard — delegate to Double Counter + Discord AutoMod (NOT a LangBot build) — pending ➡️ delegated
- [ ] 8. Sales (quiet funnel) — testimonials/results/join-link posts — pending
- [ ] 9. Guardrails + go-live test (cost cap, kill-switch, injection defense, 2nd-account test) — pending

Status legend: ⬜ pending · 🟦 in progress · ✅ done · ⏸ deferred · 🚫 dropped

## Decision log

- **Base = LangBot** (langbot-app/LangBot, ~16k stars, active). Web dashboard + knowledge base = Drew can edit the bot's brain himself. Chosen over kirara-ai (heavier) and llmcord (too bare).
- **Model = MiniMax M3** (Drew's pick — cheap + good, used heavily). Wired via OpenAI-compatible endpoint.
- **Separate 3rd bot.** Two existing bots stay untouched: admin `#agent-control` (Claude Code) + the social-media one. This community bot is its own Discord application with its own token → additive by design, zero risk to the working bots.
- **Jobs:** Greeter + Concierge + Guard + quiet Sales. NO loud hype/engagement.

## Pre-flight findings (LangBot capabilities VERIFIED 2026-06-19)

- **Concierge ✅ NATIVE** — LangBot has a knowledge-base/RAG engine + web dashboard (`:5300`) a non-technical owner edits directly. FAQ/support is its core strength. (Production pattern uses Dify for the knowledge base.)
- **Greeter ❌ NOT NATIVE** — LangBot only reacts to incoming messages; it does NOT listen to Discord's `guildMemberAdd`. Needs a small custom plugin (hook `on_member_join`) OR Discord's built-in Welcome Screen. ~small build.
- **Guard ❌ NOT NATIVE** — LangBot is purely conversational; no anti-spam/timeout/kick/ban. → **Delegate guard to Double Counter + Discord AutoMod (already in the admin stack, free, purpose-built)** rather than rebuild it in LangBot. LangBot can optionally flag suspicious chat to admin later.
- **Per-channel active/silent ⚠️** — LangBot's pipelines aren't clearly bindable per-channel. Hands-off is solved by permissions (don't grant locked-channel access). To keep it quiet in `announcements` vs active in `free-chat` among public channels, use a channel-allowlist plugin or just let it respond only when mentioned/messaged. Confirm at setup.
- **DMs ⚠️** — docs say it works in DMs but no example; TEST before relying on it for the greeter's welcome DM.
- **MiniMax M3 wiring:** provider supported natively; OpenAI-compatible. Base URL `https://api.minimax.io/v1`, model id `MiniMax-M3` (released 2026-06-01, 1M context), ~$0.30/1M input · $1.20/1M output. VERIFY exact base_url + key format at setup against platform.minimax.io docs.
- **Deployment:** LangBot via Docker (`docker compose --profile all up`), web UI on `:5300`. Separate Discord app + token → zero interference with the 2 Claude bots.
- **Verification commands** (for any companion plugin we write): TBD per language; LangBot itself is Docker.

## Open questions

- Q-1 (per-channel map): confirm the proposed active/quiet/hands-off map below (Item 3) — esp. ambiguous channels: is the PREMIUM section public-sales or locked? Does the bot touch the MEMBERS (premium) channels at all?
- Q-2 (greeter delivery): DM the new joiner, post in `start-here`, or DM-with-channel-fallback?
- Q-3 (guard): auto-act (timeout/delete) or flag-to-admin for one-tap action? (Existing Double Counter + AutoMod already do always-on protection per the admin persona.)
- Q-4 (sales triggers): scheduled, admin-approved, or on-demand?
- Q-5 (hosting): run LangBot on the same Linux box as the Claude bots, or separate? (Railway can't do the Claude subscription bot, but LangBot on MiniMax has no such limit — Railway is viable for this one.)

## Per-channel responsibility map (Item 3 — LOCKED against LIVE server 2026-06-19)

Source = live Discord (co-owner owns layout; "whatever's there now is fine" per Drew). Roles: Drew, Hanoi Agent, Premium, Free Member, @everyone.

**KEY SAFETY DESIGN:** community bot = its own Discord app + own role. We grant it view of **PUBLIC channels only**. It is never given access to the Premium-locked or bots-only channels → it *physically cannot* see/post in PRO PICKS, MEMBERS, or AI AGENT. Hands-off is enforced by permissions, not by prompt discipline.

**🟢 ACTIVE — bot engages:**
- `start-here` (public) — greeter orients new members
- `free-chat` (public) — main hangout: concierge + guard
- `free-locks` (public) — concierge + soft "want all picks? go premium" nudge
- `contact-us` (public) — concierge home: answer Qs, handle tickets, escalate to admin
- `join-premium` (public) — answers "how do I join/pay" (ties to Winible when live)

**🟡 QUIET — silent / proof-or-on-command only:**
- `announcements` (public) — owner's voice, bot stays quiet
- `premium-wins` / `premium-testimonials` / `premium-results` (public) — public sales proof; post on command, no chatting
- `social-media` (public) — links only
- SPORTSBOOKS (`underdog`,`sleeper`,`chalkboard`,`parlay-play`,`kalshi`, public) — answer basic "what is X" only

**🔴 HANDS-OFF — bot has NO access (permission-enforced):**
- PRO PICKS `1`–`4` (🔒 Premium) — cappers' picks. bot can't see them. zero leak risk.
- MEMBERS `premium-chat`,`member-picks` (🔒 Premium) — members' space. (Default: no access. If Drew later wants guard here, grant view explicitly.)
- PREMIUM-locked `member-announcements`,`free-premium`,`giveaways` (🔒 Premium) — no access by default.
- AI AGENT `agent-control`,`social-agent` (🔒 bots-only) — the 2 admin bots' turf; community bot fully out.

## Verification

- (not yet run)

## Spinoffs

- (none yet)

---

## Item details

### 1. Stand up LangBot as a separate 3rd bot
**Status:** pending
Create a new Discord application + bot token (separate from the 2 existing). Deploy LangBot (Docker). Invite it to the Hanoi Picks guild with least-privilege permissions. Confirm it runs alongside the Claude bots without interference (separate token/process).

### 2. Wire MiniMax M3
**Status:** pending
Set LangBot's model provider to MiniMax M3 via OpenAI-compatible base_url + key + model id. Verify a test message gets a coherent reply. Confirm cost-per-message ballpark.

### 3. Per-channel responsibility map
**Status:** pending
Lock the active/quiet/hands-off map above. This drives LangBot's channel bindings (which channels it listens in) and per-channel prompts. Backbone of the whole bot.

### 4. Community persona + knowledge base
**Status:** pending
Populate LangBot's knowledge base: identity, FAQ, free vs premium, pricing ($10/wk·$25/mo·$500 lifetime), social links, and hard guardrails (never leak premium picks, no guaranteed-winnings claims, no financial/legal advice, gambling disclaimer, refuse jailbreak/admin-power requests).

### 5. Concierge
**Status:** pending
Answer member questions + contact-us tickets from the knowledge base. Escalate unknowns to admin. LangBot's core strength.

### 6. Greeter ⚠️
**Status:** pending
Welcome new joiners per Q-2. If LangBot can't hook member-join natively (suspected), add a small companion (event listener → MiniMax intro → DM/post).

### 7. Guard ⚠️
**Status:** pending
Spam/scam detection per Q-3. Likely a plugin or companion. Reconcile with existing Double Counter + AutoMod (which own always-on protection).

### 8. Sales (quiet funnel)
**Status:** pending
Post testimonials/results/join-link reminders per Q-4. Reuse public wins/testimonials content.

### 9. Guardrails + go-live test
**Status:** pending
Per-member rate + cost caps, kill-switch (disable community bot instantly), prompt-injection defense, live test with a 2nd/incognito account before real members are exposed. Trust gate — nothing goes live until this passes.
