---
name: animejs
description: Reference and verification driver for adding anime.js (animejs.com) animation to a client site — npm install, the v4 createScope()/animate()/stagger() API, click/hover-triggered interaction animation, prefers-reduced-motion fallback. Use when implementing, installing, or verifying anime.js animations, imperative/interaction-driven motion (as opposed to GSAP's scroll storytelling), or a lighter animation engine than GSAP for a client project.
---

# anime.js

Paths below are relative to the **client project root** (not this plugin
repo) — anime.js is installed and used inside the site being built, per
the portability rule: production code never depends on `.claude/`.

When to reach for this instead of the `gsap` skill: anime.js is the
lighter choice for **imperative, interaction-triggered** animation
(click/hover micro-interactions, staggered entrance effects, SVG
morphing/drawing) where GSAP's ScrollTrigger-driven scrollytelling isn't
the point. It has no separate paid tier or plugin gate (unlike GSAP pre-
2024, all of anime v4 is one free package).

This skill is a verified reference, not a running app of its own. Built
and driven end-to-end in a scratch Next.js + TypeScript app in this
container: installed, built for production, served, and clicked with a
real Chromium instance via Playwright, confirming both the interaction
animation and the `prefers-reduced-motion` fallback actually change
pixels — see `verify-animejs.mjs`.

## Install (verified)

```bash
npm install animejs
```

Confirmed working version in this container: `animejs@4.5.0` (the v4
rewrite — ESM-only, ships `createScope`, `animate`, `stagger`, `utils`,
`onScroll`, `Draggable`, `createTimeline`, `svg`/`text` helpers, etc. as
named exports; the old default-export `anime()` call style from v3 is
gone).

## Core pattern (React / Next.js)

`examples/animated-scope.tsx` is the verified reference component. Three
rules it encodes:

1. **`createScope({ root }).add(callback)` inside `useEffect`**, scoped to
   a container ref — the equivalent of GSAP's `gsap.context()` /
   `useGSAP()`. Selectors like `.card` used inside the scope only match
   descendants of `root`, so they don't collide with other components on
   the page.
2. **`scope.revert()` in the effect's cleanup function** — reverts every
   animation registered inside the scope and removes anime.js's internal
   listeners. Skipping this leaks animations across route changes/unmounts,
   the same failure mode GSAP has without `useGSAP()`'s auto-revert.
3. **Manual `prefers-reduced-motion` check** — anime.js has no
   `gsap.matchMedia()` equivalent. Query
   `window.matchMedia("(prefers-reduced-motion: reduce)").matches` yourself
   inside the scope callback and branch: `utils.set(...)` to jump straight
   to the end state, or `animate(...)` for the real animation. Reuse the
   same manual-check pattern for any named methods registered with
   `self.add(name, fn)` (see the `pulse` example) — check `reduced` there
   too, since a scope method can be triggered later, independent of the
   initial mount branch.

`self.add(name, fn)` registers a **reusable, named animation** — call it
later via `scope.methods.<name>()` (e.g. on a button's `onClick`). This is
the idiomatic anime.js v4 pattern for interaction-triggered animation
(as opposed to GSAP, where you'd typically just call `gsap.to()` directly
in the event handler).

## Run (agent path) — verify the animation actually fires

`verify-animejs.mjs` drives the built page with Playwright + the
container's prebuilt Chromium, triggers the interaction, and diffs
computed `opacity`/`transform` before and after:

```bash
# from the client project root, with the project's dev/prod server already running
node <path-to-this-skill>/verify-animejs.mjs --url=http://localhost:3000 --selector='[data-testid="pulse-button"]' --interaction=click
node <path-to-this-skill>/verify-animejs.mjs --url=http://localhost:3000 --selector='[data-testid="pulse-button"]' --interaction=click --reduced-motion
```

`--interaction` is `click` (default) or `hover`. It resolves `playwright`
from the **client project's** `node_modules` (via `cwd`), so the project
needs `playwright` as a devDependency (see the `gsap` skill's note on
this — same driver-resolution mechanism, shared across all the motion
skills in this plugin).

Exact commands run against a scratch Next.js app in this container, with
their real output:

```bash
$ npm install animejs
added 1 package

$ npm run build
✓ Compiled successfully
✓ Generating static pages (7/7)

$ npm run start -- -p 4124 &

$ PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node skills/animejs/verify-animejs.mjs --url=http://localhost:4124/anime --selector='[data-testid="pulse-button"]' --interaction=click
{ "before": { "transform": "none" }, "after": { "transform": "matrix(1.0265, 0, 0, 1.0265, 0, 0)" }, "changed": true }
PASS: element animated on interaction

$ PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node skills/animejs/verify-animejs.mjs --url=http://localhost:4124/anime --selector='[data-testid="pulse-button"]' --interaction=click --reduced-motion
{ "before": { "transform": "none" }, "after": { "transform": "none" }, "changed": false }
PASS: static under reduced motion
```

`PLAYWRIGHT_CHROMIUM_PATH` is only needed in a sandboxed container like
this one where Playwright's own `chromium.executablePath()` lookup can be
off; a normal dev machine with `npx playwright install chromium` run once
doesn't need it.

## Performance / accessibility rules (non-negotiable, per frontend-senior's standard)

- Animate `transform`/`opacity` only — never `top`/`left`/`width`/`height`.
- Always provide the `prefers-reduced-motion: reduce` branch manually —
  anime.js won't do it for you, unlike GSAP.
- Always `scope.revert()` on unmount — an un-reverted scope's listeners
  and running animations outlive the component.

## Gotchas

- **`createScope({root}).add(callback)`'s callback receives `scope:
  Scope | undefined`, not `Scope`** — TypeScript flags `self.add(...)`
  inside the callback as "possibly undefined" (`self` is the callback's
  own `scope` parameter, conventionally named `self`). Use `self?.add(...)`
  — see the example. This is a real type-checker error, not a lint nit:
  `npm run build`'s TypeScript pass fails without the optional chain.
- **No built-in reduced-motion helper.** Unlike GSAP's `gsap.matchMedia()`
  (which the `gsap` skill documents), anime.js expects you to query
  `matchMedia` yourself. Forgetting this means every anime.js animation
  ships motion with no opt-out — always add the manual check, both for the
  mount branch and for any `self.add()`-registered method that could fire
  later (a `reduced` check captured once at scope-construction time is
  enough, since it's read again inside the returned method closure — see
  the example's `pulse` method).
- **`utils.set(...)` vs `animate(...)` is the anime.js equivalent of
  GSAP's `gsap.set()` vs `gsap.to()`** — use `utils.set` for the
  reduced-motion end-state, not a zero-duration `animate()` call.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `'self' is possibly 'undefined'` on `npm run build`'s TypeScript pass | `createScope().add()`'s constructor callback types its `scope` argument as optional (`scope?: Scope`). Use `self?.add(...)` instead of `self.add(...)`. |
| `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'` running `verify-animejs.mjs` | Run it with cwd inside the client project (`cd <client-project> && node <skill-dir>/verify-animejs.mjs ...`) — it resolves `playwright` from cwd's `node_modules`. |
| A selector with `=` inside it (e.g. `[data-testid="x"]`) silently resolves to a truncated, broken selector | Fixed in this driver — earlier versions of this arg parser split on every `=` in the argument, not just the first one. If you copy this pattern elsewhere, split only on the first `=`. |
