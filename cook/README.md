# Fridge Chef

Two tiers:
- **Free (ad-supported, zero AI cost):** tap the ingredients you have -> built-in recipe engine (`engine.js`, 33 recipes + a generic skillet fallback, diet/time filters) -> step-by-step cook mode. Also "Surprise me".
- **Pro ($6.99/mo):** AI photo scan of your fridge/pantry, no ads.


## Setup
1. Netlify: set env var `ANTHROPIC_API_KEY` (function: `netlify/functions/cook.js`, model Claude Haiku 4.5).
2. Stripe: create a $6.99/mo Payment Link and paste it into `CFG.checkoutUrl` in `cook/index.html`.
3. Ads: once Google AdSense approves your site, set `CFG.adsenseClient` and the `CFG.adSlots` IDs in `cook/index.html`. Until then free users see clearly labelled placeholder ad boxes. You'll need a privacy policy and EU/UK consent banner for AdSense.
4. Dev only: open on localhost with `?pro=1` to preview Pro.
5. Without the key the app runs in labelled demo mode.

## Unit economics (estimates, verify against your real usage)
- One scan (1024px photo + ~2k output tokens) is roughly $0.01 at Haiku 4.5 list pricing.
- Pro: $6.99/mo, 100 scans/mo cap -> worst-case AI cost about $1.00; after ~3% + $0.30 payment fees, margin is about 80% even for a maxed-out user.
- Free: no AI calls, so free users cost ~$0 and ad revenue is pure upside.

## Known gaps before charging real money
- Pro status and scan limits are client-side only (bypassable). Add auth + a Stripe webhook that records subscribers, and enforce the cap in the function.
- No per-IP rate limiting on the function yet.
