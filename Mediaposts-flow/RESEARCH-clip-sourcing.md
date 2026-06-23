# RESEARCH: Vertical clip sourcing — result (2026-06-23)

## Question
Best automated way to pull native 9:16 sports clips by player/team name — reliable, cheap, scalable across 8 brands, local. Weighting: reliable + zero-manual.

## Key finding
Free GitHub tools (yt-dlp; Evil0ctal/Douyin_TikTok_Download_API, 18.4k★) **download by URL well but do NOT search by keyword**, and need login cookies that break under TikTok risk control. Plain YouTube search returns long horizontal compilations even for "#shorts" queries. So auto-search-by-name is the gap.

## Ranked recommendation
1. **Apify "TikTok Search Scraper" (apidojo / thirdwatch / automation-lab actors)** — WINNER
   - Search TikTok by keyword/hashtag/user → vertical clip URLs + metadata (views, author, music)
   - No login, no cookies; residential proxies handle blocking; ~98% success
   - Pay-per-result ~$0.001–0.002/clip + $0.025/run start; Apify free plan = $5/mo (~280 results)
   - Wire via Apify REST API + token. Zero ongoing manual.
2. **TikHub.io API** — managed, 700+ endpoints across 14 platforms incl. TikTok/IG/YouTube **search**; free daily quota via check-in; pay-as-you-go. Good cheaper cross-platform fallback.
3. **Self-hosted yt-dlp / Evil0ctal + login cookies** — free, but constant cookie upkeep, no native search. Last resort only.

## Chosen wiring (pending Drew's OK on Apify)
app sends player/team name → Apify TikTok Search Scraper returns vertical clip URLs → Drew approves thumbnails → yt-dlp downloads approved URLs to app/public/clips → into the editor.
- Vertical guard (lib/clips.ts) stays enforced; TikTok is natively vertical.
- Apify token in secrets/ (gitignored), not committed.

## Decision needed
Use Apify (cheap pay-per-use, ~free at our volume)? Needs an Apify account + API token. Recommended: yes.
