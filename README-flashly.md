# Flashly — a study product for college students

A self-contained, no-login flashcard + spaced-repetition + exam-planner web
app, plus a landing page and a Pro upgrade flow. Built to sit alongside the
other static sites already in this repo (deployed via Netlify per
`netlify.toml`).

## Files

- `flashly.html` — marketing/landing page. Links to the app and to the Gumroad "Buy Pro" page.
- `flashly-app.html` — the actual app (flashcards, spaced repetition, exam countdown planner, Pomodoro timer, stats). Fully self-contained (inline CSS/JS), stores everything in the visitor's `localStorage`. No backend required to use the free tier.
- `netlify/functions/verify-license.js` — serverless function that checks a Gumroad license key server-side and unlocks "Pro" in the app.

## Why this product

The ask was: something that saves college students time or helps them
memorize, with minimal ongoing effort from you. Flashcards + spaced
repetition are one of the best-evidenced ways to cut study time for the same
recall, and pairing that with an exam-countdown planner covers the other
big time-sink (figuring out *what* to study, and *when*). It's a static
site — no servers to run, no ongoing API costs, and it works offline, which
matters to students studying in dorms/libraries with bad wifi.

## Monetization — what's built in, and what you still need to do

The app ships with a Free tier (2 decks, 30 cards/deck, 1 exam plan) and a
**Pro** tier ($9 one-time, suggested price — change it to whatever you want)
unlocked by a Gumroad license key.

To make this live and sellable:

1. **Create a Gumroad product** called something like "Flashly Pro" and
   enable "Generate a unique license key per sale" in its settings.
   Note the product's *permalink* (the slug in its Gumroad URL).
2. **Set the `GUMROAD_PRODUCT_PERMALINK` environment variable** on your
   Netlify site to that permalink. (The function falls back to
   `flashly-pro` if unset — don't ship on the fallback by accident.)
3. **Update the two hard-coded Gumroad links** (`https://gumroad.com/l/flashly-pro`)
   in `flashly.html` and `flashly-app.html` to your real product URL.
4. Deploy (this repo already has `netlify.toml` pointing at
   `netlify/functions`, so the function should pick up automatically on a
   Netlify deploy).

**Caveat on the license-check function:** it's written against Gumroad's
documented license-verification endpoint (`POST
https://api.gumroad.com/v2/licenses/verify`, no secret key required for that
specific call). I could not reach Gumroad's docs to re-verify this live
while building it (network egress to Gumroad's domains was blocked in this
session) — double-check it against Gumroad's current API docs before you
rely on it for real payments. It's also not hard DRM: someone comfortable
with devtools could flip a flag in `localStorage` to unlock Pro for free.
That's a normal, accepted tradeoff for a low-price indie tool like this —
just don't be surprised it isn't bulletproof.

## Honest note on "$100/day"

I'm not going to pretend a fixed digital product guarantees any specific
income — that depends entirely on how many people actually find and buy it,
which is a distribution problem, not a code problem. What I can say
concretely:

- At $9/sale, $100/day is **~11-12 sales a day**. At a $5/mo subscription
  model instead, it's ~20 paying subscribers net of churn — subscriptions
  are harder to bootstrap without existing audience/support overhead, which
  is why this ships as a one-time purchase.
- The product itself won't sell on its own. The highest-leverage next step
  is distribution: posting the free tool (not a sales pitch) where students
  already are — college subreddits, class-specific Discord servers,
  study-related TikTok, campus Facebook groups, professors' extra-credit or
  study-group threads. Lead with "here's a free flashcard tool," not "buy
  my app."
- Consider a second revenue stream once there's traffic: pre-made decks for
  popular intro courses (Bio 101, Micro/Macro Econ, Psych 101, MCAT/USMLE
  prep, language vocab) sold or bundled, since deck import/export already
  exists in the Pro tier.

None of this is guaranteed — treat it as a reasonable, testable plan, not a
promise.

## Local preview

These are plain static HTML files — open `flashly.html` or
`flashly-app.html` directly in a browser, or serve the repo root with any
static file server. The Netlify function only runs in a real Netlify
environment (or via `netlify dev` locally with the Netlify CLI).
