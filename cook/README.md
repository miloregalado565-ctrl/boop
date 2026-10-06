# Fridge Chef

Photo of your fridge -> detected ingredients -> beginner recipes -> step-by-step cook mode.

## Setup
1. Netlify: set env var `ANTHROPIC_API_KEY` (function: `netlify/functions/cook.js`, model Claude Haiku 4.5).
2. Stripe: create a $6.99/mo Payment Link and paste it into `CFG.checkoutUrl` in `cook/index.html`.
3. Without the key the app runs in labelled demo mode.

## Unit economics (estimates, verify against your real usage)
- One scan (1024px photo + ~2k output tokens) is roughly $0.01 at Haiku 4.5 list pricing.
- Pro: $6.99/mo, 100 scans/mo cap -> worst-case AI cost about $1.00; after ~3% + $0.30 payment fees, margin is about 80% even for a maxed-out user.
- Free: 3 scans/week costs about $0.12/mo per active free user.

## Known gaps before charging real money
- Pro status and scan limits are client-side only (bypassable). Add auth + a Stripe webhook that records subscribers, and enforce the cap in the function.
- No per-IP rate limiting on the function yet.
