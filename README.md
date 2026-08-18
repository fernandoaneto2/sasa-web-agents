# sasa-web-agents

A Claude Code plugin: a senior-level web development team of 7 specialist subagents, plus a client-discovery-driven orchestration skill, for building client websites with highly dynamic interfaces (GSAP, horizontal/vertical scroll, images that interact with each other).

## Install

```
/plugin marketplace add fernandoaneto2/sasa-web-agents
/plugin install sasa-web-agents@sasa-web-agents
```

## Use

| Situation | How to invoke |
|---|---|
| Starting a new client project (no briefing yet) | `/sasa-web-agents:start` — runs the discovery briefing, then the full orchestration flow |
| Resuming a project that already has `docs/briefing-cliente.md` | `/sasa-web-agents:start` too — the skill detects the existing briefing and jumps straight to triage |
| Consulting one specific agent outside the full flow (e.g. an accessibility audit on a site not built with this team) | @-mention the agent directly, or use the Agent tool with that agent's name — no need to go through the skill |
| Small maintenance task on an existing project | No need for the skill — just ask normally; the relevant agents get dispatched directly if it makes sense |

## The agents

| Agent | Role | Tools | Notes |
|---|---|---|---|
| `architect` | Structural decisions: monolith vs. services, API style, database, cache, auth strategy | Read, Grep, Glob, WebSearch, WebFetch, Write | Read-only on app code; writes only ADRs to `docs/adr/` |
| `backend-senior` | API routes, data models, business logic, integrations | Read, Edit, Write, Bash, Grep, Glob | Enforces validation, consistent errors, no N+1, pagination, rate limiting, idempotency, secrets hygiene, structured logging |
| `frontend-senior` | Components, state, routing, and the site's motion/interaction layer | Read, Edit, Write, Bash, Grep, Glob | Default stack: Next.js + React + TypeScript. Default motion stack: GSAP + ScrollTrigger, horizontal/vertical scroll, `prefers-reduced-motion` fallback — see the `gsap` skill below |
| `ui-ux-accessibility` | Visual consistency, responsiveness, WCAG 2.1 AA audit | Read, Grep, Glob, Write | Read-only on app code; writes only audit reports to `docs/audits/`. Also checks that GSAP/scroll sections stay accessible |
| `qa-test-strategy` | Unit, integration, and e2e tests | Read, Edit, Write, Bash, Grep, Glob | Covers edge cases, malicious input, network failures — not just the happy path |
| `code-reviewer` | Final independent review: security, performance, correctness, standards | Read, Grep, Glob, Bash | Fully read-only — no Edit/Write tool at all |
| `consolidator` | Synthesizes QA/UI-UX/code-review findings into one prioritized fix list | Read, Grep, Glob | Reads on-disk reports itself so the orchestrator never has to; read-only |

## Skills

| Skill | Use |
|---|---|
| `start` | `/sasa-web-agents:start` — client discovery + orchestration flow |
| `gsap` | Reference + driver for GSAP + ScrollTrigger animation (install, `useGSAP()`, `prefers-reduced-motion` fallback, and a Playwright-based `verify-gsap.mjs` script that confirms an animation actually fires on the built page). Default motion library for scroll storytelling — see `skills/gsap/SKILL.md`. |
| `animejs` | Reference + driver for anime.js v4 (`createScope()`, click/hover-triggered sequences, manual `prefers-reduced-motion` check). For imperative interaction animation, not scroll storytelling — see `skills/animejs/SKILL.md`. |
| `react-spring` | Reference + driver for react-spring (`useSpring()`, built-in `useReducedMotion()`). For physics-based, interruptible hover/press feedback — see `skills/react-spring/SKILL.md`. |
| `motion` | Reference + driver for Motion for React (motion.dev, npm package `motion`). For declarative `motion.div` props (`whileInView`, `whileHover`, `AnimatePresence`) — includes a verified fix for a real bug where Motion's own `useReducedMotion()`/`MotionConfig` didn't reliably disable animations in this container. See `skills/motion/SKILL.md`. |

## How orchestration works (`/sasa-web-agents:start`)

0. **Discovery** — if `docs/briefing-cliente.md` doesn't exist yet, the skill asks a structured set of questions (business, brand, copy, media, functionality, interaction style, technical, SEO) and saves the answers there. Existing briefings are reused, not re-asked.
1. **Triage** — classify the task Trivial / Standard / Structural before dispatching anything. Trivial tasks (a single contained file, no dependency/schema/contract change) skip the entire flow below — the Tech Lead implements and self-checks directly. Structural tasks (new stack, new integration, DB/auth decisions) get `architect` first. Standard tasks (the common case) skip straight to step 2.
2. **Parallel implementation** — `backend-senior` and `frontend-senior` run in parallel on non-overlapping scope.
3. **Quality & review — one parallel batch** — `qa-test-strategy`, `ui-ux-accessibility`, and `code-reviewer` all run together, in parallel, in a single dispatch. All three are independent read-mostly reviewers of the same implementation (none consumes another's output), so batching them removes a full sequential round-trip compared to running review after quality.
4. **Consolidate** — `consolidator` synthesizes the QA, UI/UX, and code-review findings into one prioritized fix list, reading the on-disk UI/UX audit report itself so the orchestrator doesn't have to; findings get triaged and fixed before anything is handed back as done.

## Design philosophy

- **Dynamic interfaces by default.** `frontend-senior` defaults to GSAP + ScrollTrigger, horizontal and vertical scroll sections, and interactive imagery for projects that call for an immersive experience — not decoration, a core requirement, with performance (60fps) and `prefers-reduced-motion` treated as non-negotiable alongside it.
- **Portability.** No client project's production code may depend on its own `.claude/` folder. A client's repository must build, run, and deploy the same with `.claude/` deleted — this is what keeps handing off a client's code on GitHub safe and clean, independent of this plugin.
- **Nothing ships unreviewed.** `qa-test-strategy`, `ui-ux-accessibility`, and `code-reviewer` all run before work is considered done.

## Efficiency

- **Risk-tiered triage.** Not every task pays for the full flow — Step 1 classifies each task Trivial/Standard/Structural before any agent is dispatched. A Trivial change (single contained file, no dependency/schema/contract change) skips `architect`, the quality/review batch, and `consolidator` entirely; the Tech Lead implements and self-checks it directly. This is the main lever for delivery speed in this plugin — proportional review, not weaker review.
- **One parallel quality-and-review batch instead of two sequential ones.** `qa-test-strategy`, `ui-ux-accessibility`, and `code-reviewer` are independent, read-mostly reviewers of the same implementation — none consumes another's output. They used to run as "QA + UI/UX in parallel, then code review after"; now all three dispatch together in one batch, cutting a full sequential agent round-trip from every Standard/Structural task with no change to what gets checked.
- **Model choice is not the speed lever.** All seven subagents stay on `sonnet` (see `skills/start/SKILL.md`'s Model policy) — downgrading a review or implementation role to a faster model would trade away the quality this team exists to deliver. Speed comes from doing less unnecessary work (triage) and doing independent work concurrently (batching), not from thinking less carefully.
- **Delegated consolidation.** The orchestrating session never reads the raw UI/UX audit report (or other on-disk QA artifacts) directly — `consolidator` reads them in its own isolated context and returns a compact, deduplicated fix list instead. Measured against a representative 8-finding audit report: ~808 estimated tokens of raw report replaced by ~291 estimated tokens of synthesis, a ~63% reduction *for that one report, per consolidation cycle* (estimated at ~4 characters/token; not a plugin-wide token-usage claim — see `docs/superpowers/specs/2026-08-17-token-time-instrumentation-design.md` for the full method).
- **Per-agent duration log.** Every invocation of the 7 subagents is timed automatically via bundled hooks and appended to a local CSV (`${CLAUDE_PLUGIN_DATA}/agent-durations.csv`) — no setup required, works for anyone who installs this plugin.

## License

MIT — see [LICENSE](LICENSE).
