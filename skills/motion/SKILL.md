---
name: motion
description: Reference and verification driver for adding Motion for React (motion.dev, npm package "motion", the successor to Framer Motion) animation to a client site — npm install, motion.div with whileInView/whileHover, and a manually-verified prefers-reduced-motion pattern (Motion's own useReducedMotion()/MotionConfig did not pass verification in this container — see Gotchas). Use when implementing, installing, or verifying Motion/Framer-Motion-style declarative animation, whileInView scroll reveals, AnimatePresence, or gesture animations on a client project.
---

# Motion (motion.dev)

Paths below are relative to the **client project root** (not this plugin
repo) — Motion is installed and used inside the site being built, per the
portability rule: production code never depends on `.claude/`.

When to reach for this instead of `gsap`/`animejs`/`react-spring`: Motion
is the **declarative, prop-driven** option — animation state expressed as
JSX props (`initial`/`animate`/`whileInView`/`whileHover`/`whileTap`) on a
`motion.div` instead of an imperative call. It's the natural fit when a
component's animation state should live alongside its React state/props
(e.g. `AnimatePresence` for mount/unmount transitions, gesture props for
hover/tap/drag). Use `gsap` for scroll-driven storytelling with pinning,
`animejs` for imperative sequences, `react-spring` for physics-only
feedback.

This skill is a verified reference, not a running app of its own. Built
and driven end-to-end in a scratch Next.js + TypeScript app in this
container: installed, built for production, served, and scrolled with a
real Chromium instance via Playwright — see `verify-motion.mjs`. **Read
the Gotchas below before using this library's own reduced-motion APIs** —
they did not pass verification here.

## Install (verified)

```bash
npm install motion
```

Confirmed working version in this container: `motion@13.1.0`. Import the
React bindings from `motion/react` (not the bare `motion` package root,
and not the old `framer-motion` package name — `motion` is its successor
and wraps it internally).

## Core pattern (React / Next.js)

`examples/scroll-reveal.tsx` is the verified reference component — a
`motion.div` with `initial`/`whileInView`/`viewport` for a scroll-triggered
reveal, `"use client"` since Motion touches the DOM.

## `prefers-reduced-motion`: do NOT use Motion's own hook/config for this

This is the load-bearing finding of this skill. Motion ships
`useReducedMotion()` and `<MotionConfig reducedMotion="user">`, and the
natural-looking pattern is:

```tsx
// DOES NOT WORK — verified in this container, see below
const shouldReduceMotion = useReducedMotion();
<motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} ... />
```

Driving this with Playwright's `reducedMotion: 'reduce'` context emulation
(`motion@13.1.0`), the entrance animation **still ran** — `before`/`after`
computed style showed `changed: true` in both the normal and the
"reduced" context. Two independent bugs compound here:

1. **Motion's internal detection queries `matchMedia("(prefers-reduced-motion)")` with no value.** That's a boolean-context media query, and it does not reliably reflect the user's actual `reduce` vs. `no-preference` setting — `prefersReducedMotion.current` came back `false` in the emulated-reduced context in this container, both through `useReducedMotion()` and through `<MotionConfig reducedMotion="user">` (same detection code underneath). Query `matchMedia("(prefers-reduced-motion: reduce)")` — **with the value** — yourself instead.
2. **Even after fixing the query, gating the `initial` prop on state that updates in a `useEffect` still didn't work**, for a second, unrelated reason: Motion only applies `initial` once, at genuine mount. Re-rendering the same `motion.div` with a changed `initial` prop value does nothing — the entrance start-state was already committed on first mount, before the effect had a chance to run. Forcing a fresh mount once the real preference is known — `key={String(reducedMotion)}` with `reducedMotion` starting `null` (unknown) and flipping to `true`/`false` after a `useEffect` — fixes it. See the example.

The example's `usePrefersReducedMotion()` + `key` combination is the
verified-working pattern. Use it (or copy it) instead of
`useReducedMotion()`/`MotionConfig` for gating `initial`/`whileInView`
entrance animations. (Separately, `MotionConfig reducedMotion="user"` only
ever affects **layout/shared-layout projection animations** in this
version — not general `initial`/`animate`/`whileInView` tweens — so it
wasn't going to do what the docs' phrasing suggests here regardless of the
query bug.)

## Run (agent path) — verify the animation actually fires

`verify-motion.mjs` drives the built page with Playwright, scrolls the
target into view, and diffs computed `opacity`/`transform`:

```bash
# from the client project root, with the project's dev/prod server already running
node <path-to-this-skill>/verify-motion.mjs --url=http://localhost:3000 --selector='[data-testid="motion-card"]'
node <path-to-this-skill>/verify-motion.mjs --url=http://localhost:3000 --selector='[data-testid="motion-card"]' --reduced-motion
```

It resolves `playwright` from the **client project's** `node_modules`
(via `cwd`) — same mechanism as the `gsap`, `animejs`, and `react-spring`
skills.

Exact commands run against a scratch Next.js app in this container, with
their real output (using the manual-check pattern from
`examples/scroll-reveal.tsx`, not Motion's own hook):

```bash
$ npm install motion
added 15 packages

$ npm run build
✓ Compiled successfully
✓ Generating static pages (7/7)

$ npm run start -- -p 4124 &

$ PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node skills/motion/verify-motion.mjs --url=http://localhost:4124/motion --selector='[data-testid="motion-card"]'
{ "before": { "opacity": "0" }, "after": { "opacity": "1" }, "changed": true }
PASS: element animated on scroll

$ PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node skills/motion/verify-motion.mjs --url=http://localhost:4124/motion --selector='[data-testid="motion-card"]' --reduced-motion
{ "before": { "opacity": "1" }, "after": { "opacity": "1" }, "changed": false }
PASS: static under reduced motion
```

`PLAYWRIGHT_CHROMIUM_PATH` is only needed in a sandboxed container like
this one where Playwright's own `chromium.executablePath()` lookup can be
off; a normal dev machine with `npx playwright install chromium` run once
doesn't need it.

## Performance / accessibility rules (non-negotiable, per frontend-senior's standard)

- Animate `transform`/`opacity` only — never `top`/`left`/`width`/`height`.
- Use the verified manual `prefers-reduced-motion` pattern above, not
  `useReducedMotion()`/`MotionConfig` alone, for gating entrance/scroll
  animations.
- `whileInView` with `viewport={{ once: true }}` avoids re-triggering the
  animation every time the element scrolls in and out of view — set this
  unless the design specifically wants a repeating reveal.

## Gotchas

- **`useReducedMotion()`/`MotionConfig reducedMotion="user"` did not
  disable this entrance animation when verified end-to-end in this
  container** (`motion@13.1.0`) — see the dedicated section above. Don't
  trust the docs' framing here without re-verifying against the installed
  version; if a future Motion release fixes the underlying
  `matchMedia("(prefers-reduced-motion)")` query, re-run
  `verify-motion.mjs --reduced-motion` using the built-in hook before
  switching back to it.
- **`initial` is a mount-time-only prop.** Changing it on a re-render of
  an already-mounted `motion.div` does not restart or alter the entrance
  animation. If a prop needs to change the *starting* state (not just the
  animate-to target), remount with a changed `key`.
- **Import from `motion/react`, not `framer-motion`.** The `motion`
  package supersedes `framer-motion` (which it still depends on
  internally, so error stacks may reference `framer-motion` file paths —
  that's expected, not a sign you installed the wrong package).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Entrance/scroll animation still plays under `prefers-reduced-motion: reduce` even after gating with `useReducedMotion()` | Expected in this version — see "`prefers-reduced-motion`: do NOT use Motion's own hook/config for this" above. Switch to the manual `matchMedia("(prefers-reduced-motion: reduce)")` + `key`-remount pattern in `examples/scroll-reveal.tsx`. |
| Gating `initial` with a state value that flips after mount has no visible effect | `initial` only applies at genuine mount. Force a remount with `key={String(state)}` once the real value is known. |
| `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'` running `verify-motion.mjs` | Run it with cwd inside the client project — it resolves `playwright` from cwd's `node_modules`. |
