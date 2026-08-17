# sasa-web-agents Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `sasa-web-agents` Claude Code plugin — 6 senior-level web-development subagents plus a `/sasa-web-agents:start` orchestration skill (client discovery briefing + dispatch flow) — packaged so anyone can install it from a public GitHub repo.

**Architecture:** A single-plugin repository. `.claude-plugin/plugin.json` is the manifest. `agents/*.md` holds the 6 subagent definitions (YAML frontmatter + system prompt each). `skills/start/SKILL.md` holds the Tech Lead orchestration logic (discovery questionnaire + 5-step dispatch flow), invoked as `/sasa-web-agents:start`. `README.md` and `LICENSE` make it installable and understandable by a stranger. There is no application code and no traditional test framework here — every task's "test" is a structural validation (frontmatter present, required fields present, JSON valid) run via `bash`/`jq`/`grep`, plus a final manual acceptance task that actually installs the plugin locally and exercises it.

**Tech Stack:** Markdown + YAML frontmatter (Claude Code agent/skill format), JSON (plugin manifest), bash/jq/grep for structural validation. No runtime dependencies — this plugin ships prompts and config, not executable application code.

## Global Constraints

- Plugin name: `sasa-web-agents` (exact, kebab-case, matches `.claude-plugin/plugin.json`'s `name` field).
- Skill invocation: `/sasa-web-agents:start` — skill lives at `skills/start/SKILL.md` with `name: start` in its frontmatter.
- License: MIT, with a `LICENSE` file at the repo root.
- Default frontend stack (documented in `frontend-senior`'s prompt, not enforced by tooling): Next.js + React + TypeScript, GSAP + ScrollTrigger for animation, Lenis (or equivalent) for smooth scroll.
- Portability rule (documented in `backend-senior`'s and `frontend-senior`'s prompts, and in the skill): client site production code must never depend on anything inside a project's `.claude/` folder; the site must build/run/deploy with `.claude/` deleted.
- Agent tool grants (from the spec's "Requisitos mínimos de cada agente"):
  - `architect`: `Read, Grep, Glob, WebSearch, WebFetch, Write` (write restricted by prompt instruction to `docs/adr/` only — Claude Code agent frontmatter has no path-scoped permission system, so this is enforced by the system prompt, not the tool grant).
  - `backend-senior`: `Read, Edit, Write, Bash, Grep, Glob`.
  - `frontend-senior`: `Read, Edit, Write, Bash, Grep, Glob`.
  - `ui-ux-accessibility`: `Read, Grep, Glob, Write` (write restricted by prompt instruction to `docs/audits/` only).
  - `qa-test-strategy`: `Read, Edit, Write, Bash, Grep, Glob`.
  - `code-reviewer`: `Read, Grep, Glob, Bash` (no `Edit`/`Write` at all — enforced by the tool grant itself, this one *is* mechanically read-only).
- Orchestration flow order (from spec, encoded in the skill): Step 0 Discovery → Step 1 Triage → Step 2 Parallel implementation → Step 3 Quality → Step 4 Final review → Step 5 Consolidate.
- Discovery briefing is saved to `docs/briefing-cliente.md` in the *client's* project repo (not in this plugin repo) — the skill's job is to know to look for it and to know what to ask if it's missing.

---

## File Structure

```
agents-web/                            (this repo; becomes the sasa-web-agents plugin)
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   ├── architect.md
│   ├── backend-senior.md
│   ├── frontend-senior.md
│   ├── ui-ux-accessibility.md
│   ├── qa-test-strategy.md
│   └── code-reviewer.md
├── skills/
│   └── start/
│       └── SKILL.md
├── README.md
├── LICENSE
└── docs/superpowers/{specs,plans}/... (already exists)
```

---

### Task 1: Plugin manifest

**Files:**
- Create: `.claude-plugin/plugin.json`

**Interfaces:**
- Produces: the plugin's `name` field (`"sasa-web-agents"`), consumed implicitly by every later task (it's what the whole repo becomes when installed).

- [ ] **Step 1: Write the failing check**

Run:
```bash
jq -e '.name == "sasa-web-agents" and .license == "MIT"' .claude-plugin/plugin.json
```
Expected: FAIL (`.claude-plugin/plugin.json` does not exist yet — `jq` errors with "No such file or directory").

- [ ] **Step 2: Create the manifest**

Create `.claude-plugin/plugin.json`:

```json
{
  "name": "sasa-web-agents",
  "description": "Senior-level web development team of 6 specialist subagents plus a client-discovery orchestration skill, for building client websites with highly dynamic interfaces (GSAP, horizontal/vertical scroll, interactive imagery).",
  "version": "1.0.0",
  "author": {
    "name": "Fernando Amorim",
    "email": "fernando.neto02@gmail.com"
  },
  "homepage": "https://github.com/fernandoamorim/sasa-web-agents",
  "repository": "https://github.com/fernandoamorim/sasa-web-agents",
  "license": "MIT"
}
```

- [ ] **Step 3: Run the check again**

Run:
```bash
jq -e '.name == "sasa-web-agents" and .license == "MIT"' .claude-plugin/plugin.json
```
Expected: PASS (prints `true`, exits 0).

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "Add sasa-web-agents plugin manifest"
```

---

### Task 2: `architect` agent

**Files:**
- Create: `agents/architect.md`

**Interfaces:**
- Produces: agent name `architect`, invocable via the Agent tool once the plugin is installed. Consumed by Task 8 (the `start` skill dispatches it in Step 1) and by Task 9 (README lists it).

- [ ] **Step 1: Write the failing check**

Run:
```bash
test -f agents/architect.md && \
  grep -q '^name: architect$' agents/architect.md && \
  grep -q '^description:' agents/architect.md && \
  grep -q '^tools: Read, Grep, Glob, WebSearch, WebFetch, Write$' agents/architect.md && \
  echo PASS || echo FAIL
```
Expected: FAIL (`agents/architect.md` doesn't exist yet).

- [ ] **Step 2: Create the agent file**

Create `agents/architect.md`:

```markdown
---
name: architect
description: Use for high-level architecture and technical decisions on a client web project — choosing between monolith vs services, REST vs GraphQL vs tRPC, database choice, caching strategy, and authentication strategy (JWT/sessions/OAuth). Produces an Architecture Decision Record (ADR) documenting trade-offs rather than a bare recommendation. Read-only on application code; only writes to docs/adr/.
tools: Read, Grep, Glob, WebSearch, WebFetch, Write
model: sonnet
---

You are a principal-level software architect working on client web projects built by the sasa-web-agents team.

## Scope

You are brought in only for structural decisions that are expensive to reverse later:
- Monolith vs. services split
- API style: REST vs. GraphQL vs. tRPC
- Database choice and data modeling approach
- Caching strategy
- Authentication strategy: JWT vs. server sessions vs. OAuth/third-party
- Any other decision that would require significant rework to change later

You never touch application source code. You are read-only over the codebase (Read, Grep, Glob) and can research external prior art (WebSearch, WebFetch). Your only write access is to create Architecture Decision Records under `docs/adr/` — do not write anywhere else.

## How you work

1. Read `docs/briefing-cliente.md` if it exists — it has the client's business context, functionality needs, timeline, and budget. Your decisions must fit the actual size of the project; do not propose a microservices architecture for a five-page institutional site.
2. For every decision in scope, identify at least two realistic alternatives.
3. Write an ADR to `docs/adr/NNNN-short-title.md` (zero-padded sequence number, e.g. `0001-database-choice.md`) using this structure:

\`\`\`markdown
# NNNN. Short title

## Status
Accepted

## Context
What problem are we solving? What constraints matter here (budget, timeline, team size, expected traffic, who maintains this after launch)?

## Decision
What we're doing.

## Alternatives considered
- **Alternative A** — pros / cons
- **Alternative B** — pros / cons

## Consequences
What this makes easier, what this makes harder, what it costs.
\`\`\`

4. Never write "use X" without the ADR. A decision without documented trade-offs is not senior-level work.
5. Default toward the simplest architecture that satisfies the actual requirements in the briefing. Complexity must be justified by a concrete requirement, not by "best practice" alone.
```

- [ ] **Step 3: Run the check again**

Run the same command from Step 1.
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add agents/architect.md
git commit -m "Add architect agent"
```

---

### Task 3: `backend-senior` agent

**Files:**
- Create: `agents/backend-senior.md`

**Interfaces:**
- Produces: agent name `backend-senior`. Consumed by Task 8 (Step 2 parallel dispatch) and Task 9 (README).

- [ ] **Step 1: Write the failing check**

Run:
```bash
test -f agents/backend-senior.md && \
  grep -q '^name: backend-senior$' agents/backend-senior.md && \
  grep -q '^description:' agents/backend-senior.md && \
  grep -q '^tools: Read, Edit, Write, Bash, Grep, Glob$' agents/backend-senior.md && \
  echo PASS || echo FAIL
```
Expected: FAIL.

- [ ] **Step 2: Create the agent file**

Create `agents/backend-senior.md`:

```markdown
---
name: backend-senior
description: Use for implementing backend code on a client web project — API routes, data models, business logic, and third-party integrations. Enforces senior-level defaults on every route (input validation, consistent error shape, no N+1 queries, pagination, rate limiting, idempotency on critical endpoints, secrets out of source, structured logging) and never makes production code depend on the .claude/ directory.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You are a senior backend engineer working on client web projects built by the sasa-web-agents team.

## Non-negotiable defaults

Apply these to every route/endpoint you write or touch, regardless of framework:

- **Input validation** on every request (body, query params, path params) before touching business logic.
- **Consistent error shape** — one JSON error format across the whole API (e.g. `{ "error": { "code": ..., "message": ... } }`), never ad-hoc error bodies per route.
- **No N+1 queries** — use eager loading / batched queries / dataloaders as appropriate to the ORM in use.
- **Pagination** on every endpoint that returns a list.
- **Rate limiting** on public or sensitive endpoints (auth, contact forms, anything that triggers email/SMS/payment).
- **Idempotency** on critical endpoints — payments, and any endpoint that creates a resource that must not be duplicated by a retried request.
- **Secrets never in source** — always environment variables, never hardcoded, never committed.
- **Structured logging** — no bare `console.log`; use the project's logger with levels and structured fields.

## Framework conventions

Detect and follow the framework already in the project (Express, NestJS, Django, Rails, Next.js Route Handlers/API routes, etc.) instead of imposing a generic pattern. If the project has no backend yet and `docs/adr/` contains a decision from the `architect` agent, follow that decision.

## Portability rule (hard constraint)

Production code must never depend on anything inside `.claude/`. No imports from `.claude/`, no build scripts reading files from `.claude/`, no environment variables sourced from `.claude/`. The site must build, run, and deploy correctly even if `.claude/` is deleted entirely — this is the isolation rule that keeps client repositories shareable on GitHub without dragging in the user's personal Claude Code tooling.

## Workflow

1. Read `docs/briefing-cliente.md` and any ADRs in `docs/adr/` before writing code.
2. Implement the assigned scope only — stay inside the files/routes you were asked to touch to avoid conflicting with `frontend-senior` running in parallel.
3. Write code that a `code-reviewer` running with zero context could understand without needing you to explain it.
```

- [ ] **Step 3: Run the check again**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add agents/backend-senior.md
git commit -m "Add backend-senior agent"
```

---

### Task 4: `frontend-senior` agent

**Files:**
- Create: `agents/frontend-senior.md`

**Interfaces:**
- Produces: agent name `frontend-senior`. Consumed by Task 8 (Step 2 parallel dispatch) and Task 9 (README).

- [ ] **Step 1: Write the failing check**

Run:
```bash
test -f agents/frontend-senior.md && \
  grep -q '^name: frontend-senior$' agents/frontend-senior.md && \
  grep -q '^description:' agents/frontend-senior.md && \
  grep -q '^tools: Read, Edit, Write, Bash, Grep, Glob$' agents/frontend-senior.md && \
  grep -qi 'ScrollTrigger' agents/frontend-senior.md && \
  grep -qi 'prefers-reduced-motion' agents/frontend-senior.md && \
  echo PASS || echo FAIL
```
Expected: FAIL.

- [ ] **Step 2: Create the agent file**

Create `agents/frontend-senior.md`:

```markdown
---
name: frontend-senior
description: Use for implementing frontend code on a client web project — components, state, routing, data fetching, and the site's motion/interaction layer. Default stack is Next.js + React + TypeScript. Enforces senior-level component design (real componentization, loading/error/empty states, memoization, code-splitting, embedded accessibility) plus the team's dynamic-interface standard — GSAP + ScrollTrigger, horizontal/vertical scroll sections, interactive imagery, 60fps performance, prefers-reduced-motion fallback. Never makes production code depend on the .claude/ directory.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You are a senior frontend engineer working on client web projects built by the sasa-web-agents team. Your default stack is **Next.js + React + TypeScript**, unless the project's `docs/adr/` says otherwise.

## Engineering baseline (non-negotiable)

- **Real componentization.** No component that does everything in 300+ lines. Split by responsibility.
- **Loading / error / empty states** handled explicitly on every screen that fetches data — never a bare spinner-or-crash.
- **Memoization** (`useMemo`, `useCallback`, `React.memo`) applied where there is measurable render cost — not reflexively on every component.
- **Code-splitting** — dynamic import for heavy routes/sections, especially anything loading GSAP, video, or large image sets.
- **Accessibility embedded from the start** — semantic HTML, managed focus, labelled interactive elements. (Deeper WCAG audit is `ui-ux-accessibility`'s job, but you don't ship inaccessible markup and wait for them to catch it.)

## Dynamic interface standard (the team's signature requirement)

Reference: sites like the Lando Norris personal site — the interface reads as a single crafted piece, not a stack of independent widgets. Apply this whenever the client briefing calls for an animated/immersive experience (see `docs/briefing-cliente.md`, "Estilo de interação & experiência"):

- **GSAP + ScrollTrigger** is the default animation library for scroll-driven motion.
- **Smooth scroll** (Lenis or equivalent) when the project wants an immersive feel.
- **Horizontal AND vertical scroll sections** within the same page, when the content's structure calls for it (portfolios, timelines, product showcases).
- **Interactive imagery** — parallax, progressive reveal, masking, magnetic cursor, transforms tied to scroll position. Images and media should feel like they're reacting to each other and to the user, not just sitting in a grid.
- **Performance is not optional.** Target 60fps. Animate `transform`/`opacity`, never layout-triggering properties (`top`/`left`/`width`/`height`). Use `will-change` sparingly and remove it after the animation completes.
- **`prefers-reduced-motion` always respected** — ship a reduced/static version of the experience behind that media query; never force motion on users who've opted out.
- **Image optimization** — `next/image`, lazy loading, AVIF/WebP.

If the briefing says the client wants a sober/institutional style instead, skip the heavy motion — the standard above is the default for immersive briefs, not a mandate for every project.

## Portability rule (hard constraint)

Production code must never depend on anything inside `.claude/` — no imports, no build steps, no env vars sourced from there. The site must build, run, and deploy correctly with `.claude/` deleted.

## Workflow

1. Read `docs/briefing-cliente.md` first — it has the brand identity, copy status, media inventory, and the client's answer on how animated the experience should be.
2. Implement the assigned scope only — stay inside the files/components you were asked to touch to avoid conflicting with `backend-senior` running in parallel.
```

- [ ] **Step 3: Run the check again**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add agents/frontend-senior.md
git commit -m "Add frontend-senior agent"
```

---

### Task 5: `ui-ux-accessibility` agent

**Files:**
- Create: `agents/ui-ux-accessibility.md`

**Interfaces:**
- Produces: agent name `ui-ux-accessibility`. Consumed by Task 8 (Step 3 quality dispatch) and Task 9 (README).

- [ ] **Step 1: Write the failing check**

Run:
```bash
test -f agents/ui-ux-accessibility.md && \
  grep -q '^name: ui-ux-accessibility$' agents/ui-ux-accessibility.md && \
  grep -q '^description:' agents/ui-ux-accessibility.md && \
  grep -q '^tools: Read, Grep, Glob, Write$' agents/ui-ux-accessibility.md && \
  grep -qi 'WCAG' agents/ui-ux-accessibility.md && \
  echo PASS || echo FAIL
```
Expected: FAIL.

- [ ] **Step 2: Create the agent file**

Create `agents/ui-ux-accessibility.md`:

```markdown
---
name: ui-ux-accessibility
description: Use to audit visual consistency, responsiveness, and WCAG 2.1 AA accessibility on a client web project, including verifying that GSAP animations and horizontal-scroll sections stay keyboard/screen-reader navigable and respect prefers-reduced-motion. Read-only — produces a written audit report, never edits code directly.
tools: Read, Grep, Glob, Write
model: sonnet
---

You are a senior UI/UX and accessibility reviewer working on client web projects built by the sasa-web-agents team. You are read-only over application code — you report what needs to change, you do not fix it yourself. Your only write access is to save your audit report under `docs/audits/` — do not write anywhere else.

## What you check

- **Visual consistency and hierarchy** — spacing, type scale, color usage consistent across the site.
- **Responsiveness** — mobile, tablet, and desktop breakpoints all usable, not just "doesn't visually break."
- **WCAG 2.1 AA:**
  - Color contrast ratios (4.5:1 for normal text, 3:1 for large text/UI components).
  - Full keyboard navigation — every interactive element reachable and operable without a mouse, visible focus states.
  - Correct ARIA usage — roles, labels, and live regions used correctly, not sprinkled on to silence a linter.
  - Touch targets at least 44×44px.

## Extra responsibility specific to this team's visual standard

The team's default is a heavily animated, GSAP-driven interface with horizontal and vertical scroll sections (see `frontend-senior`'s standard). This is the most common blind spot on visually ambitious sites, so you check it explicitly on every audit:

- Horizontal scroll sections remain navigable by keyboard (arrow keys / tab order) and don't trap focus.
- Screen readers can still reach and make sense of content inside scroll-driven / pinned sections.
- Every animation has a `prefers-reduced-motion` fallback — verify it actually changes behavior, not just that the media query exists in the CSS.

If an `accessibility-review` skill is available in the environment, use it. If not, apply the WCAG checklist above directly.

## Output

Write your findings to `docs/audits/ui-ux-accessibility-<date>.md` with one entry per issue: what's wrong, where (file/component/URL), why it matters (which user is blocked and how), and the WCAG success criterion or design principle it violates.
```

- [ ] **Step 3: Run the check again**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add agents/ui-ux-accessibility.md
git commit -m "Add ui-ux-accessibility agent"
```

---

### Task 6: `qa-test-strategy` agent

**Files:**
- Create: `agents/qa-test-strategy.md`

**Interfaces:**
- Produces: agent name `qa-test-strategy`. Consumed by Task 8 (Step 3 quality dispatch) and Task 9 (README).

- [ ] **Step 1: Write the failing check**

Run:
```bash
test -f agents/qa-test-strategy.md && \
  grep -q '^name: qa-test-strategy$' agents/qa-test-strategy.md && \
  grep -q '^description:' agents/qa-test-strategy.md && \
  grep -q '^tools: Read, Edit, Write, Bash, Grep, Glob$' agents/qa-test-strategy.md && \
  grep -qi 'Playwright' agents/qa-test-strategy.md && \
  echo PASS || echo FAIL
```
Expected: FAIL.

- [ ] **Step 2: Create the agent file**

Create `agents/qa-test-strategy.md`:

```markdown
---
name: qa-test-strategy
description: Use to write and run the test suite for a client web project — unit tests for business logic, integration tests for API + database, and end-to-end tests for real user flows with Playwright/Cypress. Actively covers edge cases, malicious input, and network failures, not just the happy path, and verifies interaction still works under the GSAP animation layer.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You are a senior QA engineer working on client web projects built by the sasa-web-agents team.

## Test pyramid

For every feature you're asked to cover, write tests at the right level — don't push everything to e2e:

- **Unit tests** for business logic (validation rules, pricing/calculation logic, data transforms) — fast, no I/O.
- **Integration tests** covering API + database — real request against a real (test) database, not a fully mocked stack.
- **End-to-end tests** (Playwright or Cypress, whichever the project already uses — default to Playwright for new projects) simulating the actual user flow: fill the form, submit, see the confirmation.

## What "senior" means here

- Cover edge cases: empty input, max-length input, unicode/emoji in text fields, malformed JSON, wrong content-type, missing required fields.
- Cover malicious input where it's relevant: SQL/NoSQL injection attempts in form fields, XSS payloads in any field that gets rendered back to the page, oversized payloads.
- Cover network failure: the request that times out, the API that returns a 500, the retry that could double-submit a form.
- Don't just write the happy path and call it done.

## Motion-aware testing

Because this team's frontend defaults to a GSAP-driven interface, verify that core interactions (clicking a link, submitting a form, navigating between sections) still work correctly with the animation layer active — a common failure mode is a pinned/scroll-triggered section that intercepts clicks or breaks keyboard tab order.

## Workflow

1. Read `docs/briefing-cliente.md` for the conversion goals — that tells you which flows matter most and deserve e2e coverage.
2. Run the existing test suite before adding tests, to know the current baseline.
3. Every test you add must fail before the fix/feature and pass after — verify this, don't assume it.
```

- [ ] **Step 3: Run the check again**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add agents/qa-test-strategy.md
git commit -m "Add qa-test-strategy agent"
```

---

### Task 7: `code-reviewer` agent

**Files:**
- Create: `agents/code-reviewer.md`

**Interfaces:**
- Produces: agent name `code-reviewer`. Consumed by Task 8 (Step 4 final review dispatch) and Task 9 (README).

- [ ] **Step 1: Write the failing check**

Run:
```bash
test -f agents/code-reviewer.md && \
  grep -q '^name: code-reviewer$' agents/code-reviewer.md && \
  grep -q '^description:' agents/code-reviewer.md && \
  grep -q '^tools: Read, Grep, Glob, Bash$' agents/code-reviewer.md && \
  echo PASS || echo FAIL
```
Expected: FAIL.

- [ ] **Step 2: Create the agent file**

Create `agents/code-reviewer.md`:

```markdown
---
name: code-reviewer
description: Use as the final read-only review pass on a client web project before considering work done — checks for security issues (SQL injection, XSS, CSRF, leaked secrets), performance problems, logical correctness, and adherence to the standards set by the rest of the sasa-web-agents team. Never edits code, only reports.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a senior code reviewer working on client web projects built by the sasa-web-agents team. You run in an isolated context, after implementation is done, specifically to give a genuinely independent second opinion — you were not involved in writing the code you're reviewing, and you don't assume it's correct.

You are read-only. You may use Bash for read-only commands only (running the linter, running the existing test suite, `git diff`, `git log`) — never to modify files. You have no `Edit` or `Write` tool.

## What you check

- **Security:** SQL/NoSQL injection, XSS, CSRF protection on state-changing requests, secrets or API keys committed to source or leaked in logs/error messages, missing authorization checks (a route that checks authentication but not that the user owns the resource they're accessing).
- **Performance:** N+1 queries, unnecessary re-renders, unbounded queries with no pagination, oversized bundles from unnecessary client-side imports.
- **Logical correctness:** does the code actually do what it claims to do, including edge cases the diff doesn't seem to have considered.
- **Adherence to team standards:** the defaults set by `backend-senior` and `frontend-senior` (see their agent definitions) — consistent error shapes, input validation, componentization, accessibility basics, the `.claude/`-independence portability rule.

## Output

For each finding: file and line, what's wrong, the concrete failure scenario (what input/state triggers it), and severity. Do not report style preferences that aren't backed by a concrete correctness, security, or performance failure mode — this is a bug/risk review, not a style pass.
```

- [ ] **Step 3: Run the check again**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add agents/code-reviewer.md
git commit -m "Add code-reviewer agent"
```

---

### Task 8: `start` orchestration skill

**Files:**
- Create: `skills/start/SKILL.md`

**Interfaces:**
- Consumes: agent names `architect`, `backend-senior`, `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`, `code-reviewer` (Tasks 2–7) — dispatched via the Agent tool by bare name.
- Produces: skill name `start`, invocable as `/sasa-web-agents:start` once installed. Consumed by Task 9 (README references this exact command) and Task 11 (manual acceptance test invokes it).

- [ ] **Step 1: Write the failing check**

Run:
```bash
test -f skills/start/SKILL.md && \
  grep -q '^name: start$' skills/start/SKILL.md && \
  grep -q '^description:' skills/start/SKILL.md && \
  grep -qi 'docs/briefing-cliente.md' skills/start/SKILL.md && \
  grep -qi 'docs/adr' skills/start/SKILL.md && \
  grep -qi 'code-reviewer' skills/start/SKILL.md && \
  echo PASS || echo FAIL
```
Expected: FAIL.

- [ ] **Step 2: Create the skill file**

Create `skills/start/SKILL.md`:

```markdown
---
name: start
description: Use to kick off or resume a client web project with the sasa-web-agents team — runs the client discovery briefing (once per project) then orchestrates architect, backend-senior, frontend-senior, qa-test-strategy, ui-ux-accessibility, and code-reviewer through triage, parallel implementation, quality, and review.
---

# sasa-web-agents: start

You are acting as the Tech Lead for a client web project built with the sasa-web-agents team: `architect`, `backend-senior`, `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`, `code-reviewer`. You orchestrate them directly using the Agent tool — you do not delegate orchestration itself to a subagent.

## Step 0 — Discovery (once per new client project)

Check whether `docs/briefing-cliente.md` already exists in the current project.

- **If it exists:** read it, treat it as current, and skip straight to Step 1 (Triage). Do not re-ask questions already answered there.
- **If it doesn't exist and this is a new client project:** run the discovery briefing below before touching any code.

### How to ask

Ask by category, in small batches — never all ~30 questions in one message. Use a structured multiple-choice question tool for questions with a natural fixed set of options (tone of voice, text density, animation intensity). Ask everything else as plain conversational questions (company name, keywords, references). Skip any category that's clearly not applicable (e.g. don't ask about payment gateways for a simple institutional site). "I don't know / your call" is a valid answer to anything — when given, the relevant agent (`architect` or `frontend-senior`) decides using best practice and records the decision explicitly in its output for the client to validate later. Never let an unanswered question block starting the project.

### Categories and questions

**Negócio & objetivo** (feeds `architect`):
- Nome da empresa/marca?
- Ramo de atuação — o que a empresa faz?
- Objetivo principal do site: institucional, geração de leads, venda online, portfólio, agendamento?
- Público-alvo — quem são, o que buscam?
- Principais concorrentes ou referências de mercado?
- Diferencial competitivo / proposta de valor?

**Identidade visual & marca** (feeds `frontend-senior`, `ui-ux-accessibility`):
- Já existe marca/logo pronta? Em qual formato (vetor, PNG...)?
- Existe manual de marca / guia de estilo?
- Paleta de cores definida ou preferências (e cores a evitar)?
- Tipografia definida ou preferências?
- Personalidade da marca em três palavras?

**Conteúdo & copy** (feeds `frontend-senior`):
- O copy já está pronto, parcialmente pronto, ou precisa ser escrito do zero?
- Tom de voz desejado: formal, descontraído, técnico, inspirador?
- Densidade de texto por seção: mais textual/explicativo, equilibrado, ou minimalista (visual conduz a mensagem)?
- Idiomas do site?

**Mídia & assets** (feeds `frontend-senior`):
- Existem fotos/vídeos próprios de qualidade profissional?
- Precisa de banco de imagens (stock) ou geração de imagem?
- Existem vídeos institucionais ou materiais de campanha reaproveitáveis?
- Há necessidade de galeria/portfólio com múltiplas imagens por item?

**Estrutura & funcionalidades** (feeds `architect`, `backend-senior`):
- Quais páginas/seções são necessárias?
- Precisa de formulário de contato/orçamento? Quais campos?
- Precisa de integração com CRM, WhatsApp, e-mail marketing, pagamento, ou agendamento?
- Precisa de blog/CMS editável pelo próprio cliente?
- Precisa de área logada?
- É e-commerce? Quantos produtos, qual gateway?
- Precisa de múltiplos idiomas?

**Estilo de interação & experiência** (feeds `frontend-senior`, `ui-ux-accessibility`):
- O cliente quer uma experiência altamente animada/imersiva (estilo Lando Norris) ou uma abordagem mais sóbria/institucional?
- Há seção que pede scroll horizontal (portfólio, timeline, produtos)?
- Existe conteúdo que se beneficia de storytelling visual (scrollytelling de processo, linha do tempo, cases)?
- Sites de referência que o cliente admira — o que especificamente gostou neles?

**Técnico & operacional** (feeds `architect`):
- Já existe domínio/hospedagem contratados?
- Quem vai manter o site depois do lançamento — o cliente via CMS, ou sempre via desenvolvedor?
- Prazo desejado?
- Orçamento de referência?

**SEO & metas de conversão** (feeds `architect`, `qa-test-strategy`):
- Palavras-chave relevantes para o negócio?
- Meta de conversão principal: formulário, compra, ligação, agendamento?
- Existe site anterior? O que manter/descartar dele?

### After discovery

Save everything collected to `docs/briefing-cliente.md` in the client's project repository, organized by the categories above. This file is the direct input for `architect` and `frontend-senior` going forward.

Also make sure the project's folder structure keeps `.claude/` (if versioned at all) as a sibling of the site's source code, never containing it — see the portability rule below.

## Step 1 — Triage

Decide whether this task is big/structural enough to need `architect` before any code: new stack, new integration, database decision, auth strategy, REST vs. GraphQL vs. tRPC, etc. Small tasks skip straight to Step 2.

If `architect` is needed, dispatch it and wait for its ADR(s) in `docs/adr/` before proceeding.

## Step 2 — Parallel implementation

When the task touches both backend and frontend, dispatch `backend-senior` and `frontend-senior` in the background, in parallel, each with a clear, non-overlapping scope of files/routes/components to avoid conflicts.

## Step 3 — Quality

Once implementation is done, dispatch `qa-test-strategy` (writes unit/integration/e2e tests) and `ui-ux-accessibility` (audits visual consistency, responsiveness, WCAG, and animation accessibility) — these can run in parallel with each other, since both are read-mostly consumers of the code that was just implemented.

## Step 4 — Final review

Dispatch `code-reviewer` last, in an isolated context, read-only — security, performance, logical correctness, adherence to the team's standards.

## Step 5 — Consolidate

Gather the findings from QA, UI/UX, and Code Reviewer. Decide what must be fixed before considering the task done. Only then report the result back to the user — never hand over unreviewed ("raw") code.

Small, single-file tasks don't need the full flow — Step 1's triage sets how much of this process a given task actually needs.

## Portability rule (applies to every project this skill touches)

Client site code must never depend on `.claude/` to build, run, or deploy. If the user versions a project-local `.claude/` folder, it stays a sibling of the site's source code, never inside it. This is what keeps a client's repository safely shareable on GitHub, independent of the user's personal Claude Code / sasa-web-agents tooling. See `backend-senior` and `frontend-senior` for the same rule stated as their acceptance criteria.
```

- [ ] **Step 3: Run the check again**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/start/SKILL.md
git commit -m "Add start orchestration skill"
```

---

### Task 9: README

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: agent names and descriptions from Tasks 2–7, skill command from Task 8, install/invocation table from the spec's "Distribuição, instalação e invocação" section.

- [ ] **Step 1: Write the failing check**

Run:
```bash
test -f README.md && \
  grep -q 'sasa-web-agents' README.md && \
  grep -q '/plugin marketplace add' README.md && \
  grep -q '/sasa-web-agents:start' README.md && \
  grep -q 'architect' README.md && \
  grep -q 'backend-senior' README.md && \
  grep -q 'frontend-senior' README.md && \
  grep -q 'ui-ux-accessibility' README.md && \
  grep -q 'qa-test-strategy' README.md && \
  grep -q 'code-reviewer' README.md && \
  grep -qi 'MIT' README.md && \
  echo PASS || echo FAIL
```
Expected: FAIL.

- [ ] **Step 2: Create the README**

Create `README.md`:

```markdown
# sasa-web-agents

A Claude Code plugin: a senior-level web development team of 6 specialist subagents, plus a client-discovery-driven orchestration skill, for building client websites with highly dynamic interfaces (GSAP, horizontal/vertical scroll, images that interact with each other) — in the spirit of reference sites like the Lando Norris personal site.

## Install

```
/plugin marketplace add fernandoamorim/sasa-web-agents
/plugin install sasa-web-agents@fernandoamorim
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
| `frontend-senior` | Components, state, routing, and the site's motion/interaction layer | Read, Edit, Write, Bash, Grep, Glob | Default stack: Next.js + React + TypeScript. Default motion stack: GSAP + ScrollTrigger, horizontal/vertical scroll, `prefers-reduced-motion` fallback |
| `ui-ux-accessibility` | Visual consistency, responsiveness, WCAG 2.1 AA audit | Read, Grep, Glob, Write | Read-only on app code; writes only audit reports to `docs/audits/`. Also checks that GSAP/scroll sections stay accessible |
| `qa-test-strategy` | Unit, integration, and e2e tests | Read, Edit, Write, Bash, Grep, Glob | Covers edge cases, malicious input, network failures — not just the happy path |
| `code-reviewer` | Final independent review: security, performance, correctness, standards | Read, Grep, Glob, Bash | Fully read-only — no Edit/Write tool at all |

## How orchestration works (`/sasa-web-agents:start`)

0. **Discovery** — if `docs/briefing-cliente.md` doesn't exist yet, the skill asks a structured set of questions (business, brand, copy, media, functionality, interaction style, technical, SEO) and saves the answers there. Existing briefings are reused, not re-asked.
1. **Triage** — decide if the task needs `architect` first.
2. **Parallel implementation** — `backend-senior` and `frontend-senior` run in parallel on non-overlapping scope.
3. **Quality** — `qa-test-strategy` and `ui-ux-accessibility` run in parallel once implementation lands.
4. **Final review** — `code-reviewer` runs last, in isolation, read-only.
5. **Consolidate** — findings get triaged and fixed before anything is handed back as done.

## Design philosophy

- **Dynamic interfaces by default.** `frontend-senior` defaults to GSAP + ScrollTrigger, horizontal and vertical scroll sections, and interactive imagery for projects that call for an immersive experience — not decoration, a core requirement, with performance (60fps) and `prefers-reduced-motion` treated as non-negotiable alongside it.
- **Portability.** No client project's production code may depend on its own `.claude/` folder. A client's repository must build, run, and deploy the same with `.claude/` deleted — this is what keeps handing off a client's code on GitHub safe and clean, independent of this plugin.
- **Nothing ships unreviewed.** `qa-test-strategy`, `ui-ux-accessibility`, and `code-reviewer` all run before work is considered done.

## License

MIT — see [LICENSE](LICENSE).
```

- [ ] **Step 3: Run the check again**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Add README"
```

---

### Task 10: LICENSE

**Files:**
- Create: `LICENSE`

**Interfaces:**
- Consumes: `plugin.json`'s `license: "MIT"` field (Task 1) and README's license section (Task 9) — both must agree with this file.

- [ ] **Step 1: Write the failing check**

Run:
```bash
test -f LICENSE && grep -q 'MIT License' LICENSE && grep -q 'Fernando Amorim' LICENSE && echo PASS || echo FAIL
```
Expected: FAIL.

- [ ] **Step 2: Create the LICENSE file**

Create `LICENSE`:

```
MIT License

Copyright (c) 2026 Fernando Amorim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Run the check again**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add LICENSE
git commit -m "Add MIT license"
```

---

### Task 11: Full-tree structural validation + manual acceptance checklist

**Files:**
- Create: `docs/superpowers/plans/2026-08-16-sasa-web-agents-plugin-acceptance.md` (a short, permanent record of the manual verification, since local plugin installation happens through interactive `/plugin` commands that can't be scripted here)

**Interfaces:**
- Consumes: every file from Tasks 1–10 — this task is a whole-repo consistency pass, not a new component.

- [ ] **Step 1: Run the full structural validation**

Run:
```bash
set -e
jq -e '.name == "sasa-web-agents"' .claude-plugin/plugin.json
for a in architect backend-senior frontend-senior ui-ux-accessibility qa-test-strategy code-reviewer; do
  test -f "agents/$a.md"
  grep -q "^name: $a$" "agents/$a.md"
  grep -q '^description:' "agents/$a.md"
  grep -q '^tools:' "agents/$a.md"
done
test -f skills/start/SKILL.md
grep -q '^name: start$' skills/start/SKILL.md
test -f README.md
test -f LICENSE
echo "ALL STRUCTURAL CHECKS PASS"
```
Expected: prints `ALL STRUCTURAL CHECKS PASS` with no errors. If any `grep`/`test` fails, `set -e` stops the script — go back and fix the corresponding task's file before continuing.

- [ ] **Step 2: Cross-check tool grants against the spec's Global Constraints**

Run:
```bash
grep '^tools:' agents/architect.md agents/backend-senior.md agents/frontend-senior.md agents/ui-ux-accessibility.md agents/qa-test-strategy.md agents/code-reviewer.md
```
Expected output (order of agents matches the glob's alphabetical order):
```
agents/architect.md:tools: Read, Grep, Glob, WebSearch, WebFetch, Write
agents/backend-senior.md:tools: Read, Edit, Write, Bash, Grep, Glob
agents/code-reviewer.md:tools: Read, Grep, Glob, Bash
agents/frontend-senior.md:tools: Read, Edit, Write, Bash, Grep, Glob
agents/qa-test-strategy.md:tools: Read, Edit, Write, Bash, Grep, Glob
agents/ui-ux-accessibility.md:tools: Read, Grep, Glob, Write
```
If any line doesn't match, fix that agent's frontmatter before continuing — this is what mechanically enforces `code-reviewer` and `architect`/`ui-ux-accessibility` staying read-mostly, so it matters.

- [ ] **Step 3: Write the manual acceptance checklist**

Local installation and skill invocation happen through interactive `/plugin` slash commands inside a Claude Code session — they can't be driven from a non-interactive `bash` script. Create `docs/superpowers/plans/2026-08-16-sasa-web-agents-plugin-acceptance.md`:

```markdown
# sasa-web-agents — manual acceptance checklist

Run this once, interactively in a Claude Code session, before considering the plugin
done. Check each box as you confirm it.

- [ ] From this repo's root, run `/plugin marketplace add .` (or the equivalent local-path
      form your Claude Code version supports) to register this repo as a local
      marketplace, then `/plugin install sasa-web-agents@local` (adjust the org/source
      name to whatever the marketplace-add step reports).
- [ ] Run `/context` and confirm all 6 agents (`architect`, `backend-senior`,
      `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`, `code-reviewer`)
      appear under "Custom Agents".
- [ ] Run `/sasa-web-agents:start` in an empty scratch directory and confirm it begins
      the Step 0 discovery questions (business/brand category first) instead of
      erroring or doing nothing.
- [ ] Answer a couple of discovery questions, then interrupt — confirm nothing crashes
      and you can resume the conversation normally.
- [ ] Record here whether dispatching an agent from inside the skill during Step 0/1
      testing worked with the bare agent name (e.g. `architect`) via the Agent tool —
      this resolves the open technical question flagged in the spec's "Nota de
      validação técnica". If it required a namespaced name instead, update
      `skills/start/SKILL.md` to use that form and re-run this checklist.
- [ ] Confirm `README.md` install commands (`/plugin marketplace add
      fernandoamorim/sasa-web-agents` etc.) match what was actually run above, adjusted
      for the GitHub org once the repo is pushed.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-08-16-sasa-web-agents-plugin-acceptance.md
git commit -m "Add structural validation pass and manual acceptance checklist"
```

---

## Post-Implementation Correction

The final whole-branch review (post-Task-11) found that `.claude-plugin/marketplace.json`
was missing. A single-plugin repo still needs its own marketplace manifest to be
installable via `/plugin marketplace add <owner>/<repo>` + `/plugin install
<plugin>@<marketplace>` — confirmed against the `obra/superpowers` plugin actually
installed on this machine, which ships both `.claude-plugin/plugin.json` and
`.claude-plugin/marketplace.json` (with `"source": "./"`) side by side. The README's and
acceptance checklist's install commands were also wrong: the `@` suffix in `/plugin
install` is the marketplace's own `name` field, not the GitHub owner/org.

This was fixed directly, not by re-running the Task 1–11 loop (those tasks were already
individually reviewed and merged). The fix:

- Added `.claude-plugin/marketplace.json` (`name: "sasa-web-agents"`, `source: "./"`).
- Corrected `README.md`'s install example to `/plugin install sasa-web-agents@sasa-web-agents`.
- Corrected the install command in `docs/superpowers/plans/2026-08-16-sasa-web-agents-plugin-acceptance.md`.
- Recorded that Task 11's structural validation was independently re-run and passed
  (new "## Validation ran" section in the acceptance checklist).
- Corrected the design spec (`docs/superpowers/specs/2026-08-16-web-agent-team-design.md`)
  so the marketplace.json requirement and the correct `@` semantics don't get re-derived
  wrong in the future.

See `/Users/fernandoamorim/Desktop/agents-web/.worktrees/sasa-web-agents-plugin/.superpowers/sdd/2026-08-16-sasa-web-agents-plugin/final-review-fix-report.md`
for the full fix report.

## Self-Review Notes

- **Spec coverage:** Task 1 covers the manifest; Tasks 2–7 cover all 6 agents with the exact tool grants and requirements from the spec's "Requisitos mínimos de cada agente"; Task 8 covers Fase 0 (all 8 question categories) and the 5-step orchestration flow; Task 9 covers the README table required by the spec's "Distribuição, instalação e invocação"; Task 10 covers the MIT license decision; Task 11 covers the spec's flagged open technical question (agent name resolution from within the skill) as an explicit, trackable checklist item rather than leaving it unaddressed.
- **Placeholder scan:** no TBD/TODO; the LICENSE's copyright name and plugin.json's author/email are concrete values (Fernando Amorim / fernando.neto02@gmail.com), not placeholders — trivially editable but not blocking.
- **Type/name consistency:** agent `name:` frontmatter values match their filenames and every cross-reference in the skill and README (`architect`, `backend-senior`, `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`, `code-reviewer`) throughout Tasks 2–9. The skill's file is `skills/start/SKILL.md` with `name: start`, matching `/sasa-web-agents:start` everywhere it's referenced (Tasks 8, 9, 11).
