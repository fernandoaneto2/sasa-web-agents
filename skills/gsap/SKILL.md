---
name: gsap
description: Reference and verification driver for adding GSAP (GreenSock, gsap.com/docs/v3/Installation) animation to a client site — npm install, ScrollTrigger, useGSAP() for React/Next.js, horizontal/vertical scroll sections, prefers-reduced-motion fallback. Use when implementing, installing, or verifying GSAP/ScrollTrigger animations, scroll-driven motion, or the team's dynamic-interface standard on a client project.
---

# GSAP

Paths below are relative to the **client project root** (not this plugin
repo) — GSAP is installed and used inside the site being built, per the
portability rule: production code never depends on `.claude/`.

This skill is a verified reference, not a running app of its own — the
"app" it documents is the GSAP setup `frontend-senior` writes into each
client project. Everything below was built and driven end-to-end in a
scratch Next.js + TypeScript app in this container: installed, built for
production, served, and scrolled with a real Chromium instance via
Playwright, confirming both the animated path and the
`prefers-reduced-motion` fallback actually change pixels — see
`verify-gsap.mjs`.

## Install (verified)

GSAP's core (including ScrollTrigger and all other plugins — no paid tier
since the 2024 Webflow move, everything is in the free `gsap` package) plus
the React hook:

```bash
npm install gsap @gsap/react
```

Confirmed working versions in this container: `gsap@3.15.0`, `@gsap/react@2.1.2`.

## Core pattern (React / Next.js)

`examples/scroll-section.tsx` is the verified reference component — copy
its shape, not its exact content, into the client project. Three rules it
encodes, all confirmed by the driver run below:

1. **`useGSAP()` from `@gsap/react`**, not a bare `useEffect` — it scopes
   selectors to the component root and auto-reverts tweens/ScrollTriggers
   on unmount and React Strict Mode's double-invoke, which a manual
   `useEffect` + `gsap.context()` gets wrong in subtle ways.
2. **`gsap.matchMedia()` for `prefers-reduced-motion`** — branch inside the
   same `useGSAP` call (`isReduced` vs `isNotReduced` media queries) so the
   static end-state and the animated version are the only two code paths;
   never ship motion with no opt-out.
3. **`"use client"` + client-only `gsap.registerPlugin(ScrollTrigger)`** —
   GSAP touches `window`/`document`, so the component must be a client
   component. `npm run build` (Next.js static prerender) succeeded with
   this pattern in this container; it fails if GSAP code runs during SSR.

Horizontal scroll (pin + scrub tied to vertical scroll distance) is the
same file's second half — `scrollTrigger: { pin: true, scrub: 1, end: () =>
'+=' + scrollLength }` on the track element, no manual wheel/touch
handling.

## Run (agent path) — verify the animation actually fires

Don't just read the code — drive the built page and diff computed styles
before/after scroll. `verify-gsap.mjs` is the driver (Playwright + the
container's prebuilt Chromium):

```bash
# from the client project root, with the project's dev/prod server already running
node <path-to-this-skill>/verify-gsap.mjs --url=http://localhost:3000 --selector=".panel" --scroll=900
node <path-to-this-skill>/verify-gsap.mjs --url=http://localhost:3000 --selector=".panel" --scroll=900 --reduced-motion
```

It resolves `playwright` from the **client project's** `node_modules`
(via `cwd`), so the project needs `playwright` as a devDependency (the
`qa-test-strategy` agent's e2e stack already provides this on most
projects this team builds; add it with `npm install -D playwright` if not).

What it does: loads the URL, screenshots, scrolls the selector into view,
sends a wheel scroll of the given amount, waits, screenshots again, and
diffs `opacity`/`transform`. Prints `PASS`/`FAIL`:
- Without `--reduced-motion`: PASS means the selector's style changed
  (the animation fired).
- With `--reduced-motion`: PASS means it **didn't** change (the reduced
  fallback held).

Exact commands run against a scratch Next.js app in this container, with
their real output:

```bash
$ npm install gsap @gsap/react
added 6 packages

$ npm run build
✓ Compiled successfully
✓ Generating static pages (4/4)

$ npm run start -- -p 4123 &

$ PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node skills/gsap/verify-gsap.mjs --url=http://localhost:4123 --selector=".panel" --scroll=900
{ "before": { "opacity": "0" }, "after": { "opacity": "1" }, "changed": true }
PASS: element animated on scroll

$ PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node skills/gsap/verify-gsap.mjs --url=http://localhost:4123 --selector=".panel" --scroll=900 --reduced-motion
{ "before": { "opacity": "1" }, "after": { "opacity": "1" }, "changed": false }
PASS: static under reduced motion
```

The pinned horizontal-scroll section was checked the same way, screenshot
diffed by hand: `transform: matrix(1,0,0,1,0,0)` at rest →
`matrix(1,0,0,1,-892.163,0)` after a 900px wheel scroll, i.e. the track
actually slides.

`PLAYWRIGHT_CHROMIUM_PATH` is only needed in a sandboxed container like
this one where Playwright's own `chromium.executablePath()` lookup can be
off; a normal dev machine with `npx playwright install chromium` run once
doesn't need it.

## Performance / accessibility rules (non-negotiable, per frontend-senior's standard)

- Animate `transform`/`opacity` only — never `top`/`left`/`width`/`height`
  (layout thrash, kills 60fps).
- Always provide the `prefers-reduced-motion: reduce` branch via
  `gsap.matchMedia()` — verified above, don't skip it.
- `ScrollTrigger` leaks across route changes/unmounts if not cleaned up —
  `useGSAP()`'s auto-revert (shown in the example) handles this; don't
  hand-roll `useEffect` cleanup instead.

## Gotchas

- **SSR crash if `gsap.registerPlugin(ScrollTrigger)` runs outside a
  client component.** `window is not defined` at build time. Keep it
  inside a `"use client"` file, called once at module scope (as in the
  example) — `npm run build` only stays green with this.
- **`useGSAP`'s cleanup return value is required**, even when the reduced-
  motion branch does nothing — `gsap.matchMedia().add()`'s callback must
  return a function (return `() => {}` if there's nothing to revert), or
  GSAP's context revert throws on cleanup.
- **Horizontal scroll length must be computed from `scrollWidth -
  innerWidth`, not a hardcoded value** — the example does this in the
  `useGSAP` callback (after layout), not at module scope, otherwise it
  reads `0` before the DOM has real dimensions.
- **`playwright` resolves relative to `process.cwd()`, not the driver
  script's location** — `verify-gsap.mjs` lives in the skill directory,
  but must be *run* with cwd set to the client project so it finds that
  project's own `playwright` install. Running it from elsewhere throws
  `ERR_MODULE_NOT_FOUND`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `browserType.launch: Failed to launch chromium because executable doesn't exist at /opt/pw-browsers/chromium/chrome-linux/chrome` | Wrong path guess — check the real one with `find /opt/pw-browsers -iname chrome` (in this container it's `chromium-1194/chrome-linux/chrome`, not `chromium/chrome-linux/chrome`), and pass it via `PLAYWRIGHT_CHROMIUM_PATH`. |
| `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'` running `verify-gsap.mjs` | Run it with cwd inside the client project (`cd <client-project> && node <skill-dir>/verify-gsap.mjs ...`) — it resolves `playwright` from cwd's `node_modules`, and the project needs `playwright` as a devDependency. |
| `verify-gsap.mjs` reports `changed: false` when you expected animation | Check the `--selector` actually matches the animated element (not a wrapper with no style change) and that `--scroll` is enough to cross the `ScrollTrigger`'s `start` threshold. |
