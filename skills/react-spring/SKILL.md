---
name: react-spring
description: Reference and verification driver for adding react-spring (react-spring.dev) physics-based animation to a client site — npm install of @react-spring/web, useSpring()/animated.<tag>, hover/press micro-interactions, prefers-reduced-motion via the built-in useReducedMotion() hook. Use when implementing, installing, or verifying react-spring animations, spring-physics motion (as opposed to duration-based tweens), or interactive hover/drag feedback on a client project.
---

# react-spring

Paths below are relative to the **client project root** (not this plugin
repo) — react-spring is installed and used inside the site being built,
per the portability rule: production code never depends on `.claude/`.

When to reach for this instead of `gsap` or `animejs`: react-spring
models motion as **physics** (tension/friction converging on a target),
not a fixed-duration tween — the right tool for interruptible hover/press/
drag feedback that should feel alive even when the user changes their
mind mid-animation (hovers off before the animation finished, etc.). Use
`gsap` for scroll storytelling, `animejs` for duration-based
interaction/entrance sequences, `react-spring` for physics-driven UI
feedback.

This skill is a verified reference, not a running app of its own. Built
and driven end-to-end in a scratch Next.js + TypeScript app in this
container: installed, built for production, served, and hovered with a
real Chromium instance via Playwright — see `verify-react-spring.mjs`.

## Install (verified)

```bash
npm install @react-spring/web
```

Confirmed working version in this container: `@react-spring/web@10.1.2`.
(`@react-spring/web` is the DOM target — react-spring also ships
`@react-spring/native`, `@react-spring/three`, etc. for other renderers;
a Next.js/React site always wants the `/web` package.)

## Core pattern (React / Next.js)

`examples/spring-card.tsx` is the verified reference component:

1. **`useSpring({...})` + `<animated.div style={style} />`** — declare the
   target values, react-spring interpolates toward them with real spring
   physics whenever the input (here, `hovered`) changes.
2. **`useReducedMotion()` from `@react-spring/web`** — built in, unlike
   anime.js. Pass its result to `immediate` to skip the eased transition
   under `prefers-reduced-motion: reduce`.
3. **Static styles via `className`, animated styles via `style={style}`
   alone** — don't spread `{...style, width: 200, ...}` into one object
   literal. See Gotchas: it breaks TypeScript's overload resolution for
   `useSpring`.

## Run (agent path) — verify the animation actually fires

`verify-react-spring.mjs` drives the built page with Playwright, hovers
the target element, and diffs computed `opacity`/`transform`:

```bash
# from the client project root, with the project's dev/prod server already running
node <path-to-this-skill>/verify-react-spring.mjs --url=http://localhost:3000 --selector='[data-testid="spring-card"]'
node <path-to-this-skill>/verify-react-spring.mjs --url=http://localhost:3000 --selector='[data-testid="spring-card"]' --reduced-motion
```

It resolves `playwright` from the **client project's** `node_modules`
(via `cwd`) — same mechanism as the `gsap` and `animejs` skills.

Exact commands run against a scratch Next.js app in this container, with
their real output:

```bash
$ npm install @react-spring/web
added 6 packages

$ npm run build
✓ Compiled successfully
✓ Generating static pages (7/7)

$ npm run start -- -p 4124 &

$ PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node skills/react-spring/verify-react-spring.mjs --url=http://localhost:4124/spring --selector='[data-testid="spring-card"]'
{ "before": { "transform": "matrix(1,0,0,1,0,0)" }, "after": { "transform": "matrix(1.15295, 0.0622945, -0.0622945, 1.15295, 0, 0)" }, "changed": true }
PASS: hover state changed

$ PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node skills/react-spring/verify-react-spring.mjs --url=http://localhost:4124/spring --selector='[data-testid="spring-card"]' --reduced-motion
{ "before": { "transform": "matrix(1,0,0,1,0,0)" }, "after": { "transform": "matrix(1.14842, 0.0601863, -0.0601863, 1.14842, 0, 0)" }, "changed": true }
INFO (expected): hover state changed — immediate skips the eased transition, not the state change
```

Note both runs report `changed: true` — that's correct, not a bug in the
driver. See the next section.

## `prefers-reduced-motion` behaves differently here than in GSAP

The `gsap` skill's driver expects reduced motion to mean **nothing
changes** (`gsap.matchMedia()` gates the whole effect off). react-spring's
`immediate` flag is narrower: it removes the **eased transition**, not the
**target-state change**. A hover card still snaps straight to its hovered
scale/rotation under reduced motion — it just doesn't spring/oscillate on
the way there. That's the correct behavior for small UI feedback (WCAG's
reduced-motion guidance targets large, vestibular-triggering motion —
parallax, big transforms, autoplay — not "the button doesn't visibly
respond to hover at all"). Don't try to make a hover/press micro-
interaction fully static to satisfy reduced motion; that's over-applying
the rule and makes the UI feel broken. Reserve the "nothing moves" pattern
(`gsap.matchMedia()` / anime.js's manual check) for entrance animations,
parallax, and scroll-driven storytelling — the actually vestibular-risky
stuff.

## Gotchas

- **Don't spread `useSpring()`'s return value into a plain object literal
  with other CSS properties** (`style={{ ...style, width: 200, background:
  "coral" }}`) — TypeScript's overload resolution for `useSpring` breaks in
  a confusing way: adding unrelated properties into the same object literal
  makes the compiler fall back to the "imperative API" overload (the one
  returning a `[styles, api]` tuple for `useSpring(() => ({...}), deps)`
  usage), and the merged object no longer type-checks as `CSSProperties`
  at all (`npm run build`'s TypeScript pass fails with a wall of errors
  about `fill`/`accentColor`/etc. not matching). Fix: put static styles in
  a CSS class (`className`), pass `style={style}` alone for the animated
  properties — see the example.
- **`useReducedMotion()` can return `null`** before it resolves client-
  side (SSR-safe default), but `useSpring`'s `immediate` option only
  accepts `boolean | undefined` — `null` also breaks the overload
  resolution above. Coerce with `?? false`.
- **`immediate` doesn't remove the interaction** — see the section above.
  If a design genuinely needs zero visible response under reduced motion
  (rare, and usually the wrong call for a hover state), that's a product
  decision to flag back to the client, not something `immediate` does for
  you.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Object literal may only specify known properties, and 'transform' does not exist in type 'Function \| (() => ...)'` on `npm run build` | You spread `useSpring()`'s style object into a plain object literal together with other CSS props. Split static styles into a `className` and pass `style={style}` alone. |
| `Type 'boolean \| null' is not assignable to type 'MatchProp<...> \| undefined'` | `useReducedMotion()` returned `null`; coerce with `immediate: prefersReducedMotion ?? false`. |
| `verify-react-spring.mjs` reports `changed: true` even with `--reduced-motion` | Expected — see "`prefers-reduced-motion` behaves differently here than in GSAP" above. Not a driver bug. |
| `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'` running `verify-react-spring.mjs` | Run it with cwd inside the client project — it resolves `playwright` from cwd's `node_modules`. |
