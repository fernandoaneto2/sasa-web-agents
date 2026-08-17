# Token & Time Instrumentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the plugin-level parts of the two adapted specs — a documented model policy, a new `consolidator` subagent that removes the orchestrator's direct read of the raw UI/UX audit file, and per-subagent duration logging via bundled hooks — so every future installer of `sasa-web-agents` gets these benefits automatically.

**Architecture:** Pure additions/edits to existing plugin files (`agents/*.md`, `skills/start/SKILL.md`) plus one new `hooks/` directory (`hooks.json` + two Node.js scripts) and manifest/README updates. No application code, no test framework in this repo — verification is structural (`claude plugin validate . --strict`, grep checks) and manual hook-contract simulation via Bash.

**Tech Stack:** Claude Code plugin conventions (agent frontmatter, skill markdown, `hooks/hooks.json`); Node.js for hook scripts (no new dependency — Node is a Claude Code prerequisite already).

## Global Constraints

- All changes live in versioned files inside this repository only — nothing added to any personal `~/.claude/settings.json`. (Design spec, "Decisões de escopo".)
- No existing agent's `model` or `tools` frontmatter changes — there is no eval suite in this repo to validate a quality tradeoff, so none is risked. (Design spec, "Sem eval suite formal".)
- Hook matcher for both `SubagentStart` and `SubagentStop`: exactly `architect|backend-senior|frontend-senior|qa-test-strategy|ui-ux-accessibility|code-reviewer|consolidator`.
- CSV log path: `${CLAUDE_PLUGIN_DATA}/agent-durations.csv`, header exactly `timestamp,agent_type,agent_id,session_id,cwd,duration_seconds`.
- Hook scripts are Node.js, must never throw an uncaught exception or exit non-zero — best-effort logging must never block the user's session. (Design spec, Riscos e mitigações.)
- Any token-reduction figure published in README.md must state its measurement method and exact scope — never a plugin-wide percentage. (Design spec, "Medição".)

---

### Task 1: Document the model policy in `SKILL.md`

**Files:**
- Modify: `skills/start/SKILL.md:104-106`

**Interfaces:**
- Produces: a `## Model policy` section other tasks can reference by heading name (Task 2 will mention `consolidator` there too).

- [ ] **Step 1: Insert the new section**

In `skills/start/SKILL.md`, the file currently reads (lines 104-106):

```
Small, single-file tasks don't need the full flow — Step 1's triage sets how much of this process a given task actually needs.

## Portability rule (applies to every project this skill touches)
```

Replace that exact block with:

```
Small, single-file tasks don't need the full flow — Step 1's triage sets how much of this process a given task actually needs.

## Model policy

All seven subagents (`architect`, `backend-senior`, `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`, `code-reviewer`, `consolidator`) are pinned to `model: sonnet`. None are downgraded to `haiku` — every one of them produces or judges senior-level code, architecture, or review output, which benefits from stronger reasoning than a classification/summarization model provides. None are escalated to `opus` — nothing in this team's current scope (client web projects: architecture decisions, implementation, tests, accessibility audits, code review) has shown a need for it, and doing so would raise cost without a matching quality requirement. Revisit only if a future task class clearly needs the extra capability.

## Portability rule (applies to every project this skill touches)
```

- [ ] **Step 2: Verify the section landed correctly**

Run: `grep -n "^## Model policy$" skills/start/SKILL.md`
Expected: one match, followed shortly by `grep -n "^## Portability rule" skills/start/SKILL.md` still matching once, confirming nothing was duplicated or dropped.

- [ ] **Step 3: Commit**

```bash
git add skills/start/SKILL.md
git commit -m "$(cat <<'EOF'
Document model policy for sasa-web-agents subagents

All subagents are pinned to sonnet; write down why (no haiku downgrade,
no opus escalation) so the choice is an explicit, revisitable policy
instead of an unexplained default.
EOF
)"
```

---

### Task 2: Add the `consolidator` subagent and delegate Step 5 to it

**Files:**
- Create: `agents/consolidator.md`
- Modify: `skills/start/SKILL.md:3-4` (frontmatter `description`)
- Modify: `skills/start/SKILL.md:8` (body roster line)
- Modify: `skills/start/SKILL.md:100-102` (Step 5 section)
- Modify: `skills/start/SKILL.md:109` (new — the `## Model policy` line added in Task 1, add `consolidator` there — already done in Task 1's text above, no further edit needed here)

**Interfaces:**
- Produces: subagent `consolidator` (invocable via the Agent tool with `subagent_type: "consolidator"`), tools `Read, Grep, Glob`, `model: sonnet`. Consumes no code from other tasks; other tasks reference it only by name.

- [ ] **Step 1: Create `agents/consolidator.md`**

```markdown
---
name: consolidator
description: Use at the end of a sasa-web-agents task to synthesize QA, UI/UX, and code-review findings into one compact, prioritized fix list. Reads on-disk reports (docs/audits/*.md and similar) directly so the orchestrating session never has to. Read-only; produces a synthesis, never edits code.
tools: Read, Grep, Glob
model: sonnet
---

You are consolidating the end-of-task quality gate for a client web project built by the sasa-web-agents team. You were given, inline in your dispatch prompt, whatever `qa-test-strategy` and `code-reviewer` already reported. You are also given a path (or paths) to on-disk reports — typically `docs/audits/ui-ux-accessibility-<date>.md` from `ui-ux-accessibility`, and any other report file left on disk. Read those files yourself; the orchestrating session does not.

## What you produce

One prioritized list, ordered blocker → nice-to-have, of everything that must be fixed before this task can be considered done. Deduplicate: if the same underlying issue is reported by more than one of the three sources (e.g. a WCAG contrast failure flagged by both `ui-ux-accessibility` and `code-reviewer`), list it once, noting which sources raised it.

For each item: what's wrong, where (file/line or page/component), and why it blocks completion (or why it doesn't, if you're deliberately including it as a non-blocking note).

## What you do not do

- Do not paste the full text of any source report into your output. Your output is the synthesis, not a copy.
- Do not fix anything — you have no `Edit`/`Write` tool, and even if you did, that isn't this role's job.
- Do not soften or omit a blocker to make the list shorter — completeness of the *decision-relevant* findings matters more than brevity.
```

- [ ] **Step 2: Update `SKILL.md`'s frontmatter description to include `consolidator`**

Current (lines 3-4, this is a single-line frontmatter value):

```
description: Use to kick off or resume a client web project with the sasa-web-agents team — runs the client discovery briefing (once per project) then orchestrates architect, backend-senior, frontend-senior, qa-test-strategy, ui-ux-accessibility, and code-reviewer through triage, parallel implementation, quality, and review.
```

Replace with:

```
description: Use to kick off or resume a client web project with the sasa-web-agents team — runs the client discovery briefing (once per project) then orchestrates architect, backend-senior, frontend-senior, qa-test-strategy, ui-ux-accessibility, code-reviewer, and consolidator through triage, parallel implementation, quality, review, and consolidation.
```

- [ ] **Step 3: Update the body roster line**

Current (line 8):

```
You are acting as the Tech Lead for a client web project built with the sasa-web-agents team: `architect`, `backend-senior`, `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`, `code-reviewer`. You orchestrate them directly using the Agent tool — you do not delegate orchestration itself to a subagent.
```

Replace with:

```
You are acting as the Tech Lead for a client web project built with the sasa-web-agents team: `architect`, `backend-senior`, `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`, `code-reviewer`, `consolidator`. You orchestrate them directly using the Agent tool — you do not delegate orchestration itself to a subagent.
```

- [ ] **Step 4: Replace the Step 5 section**

Current (lines 100-102):

```
## Step 5 — Consolidate

Gather the findings from QA, UI/UX, and Code Reviewer. Decide what must be fixed before considering the task done. Only then report the result back to the user — never hand over unreviewed ("raw") code.
```

Replace with:

```
## Step 5 — Consolidate

Do not read `docs/audits/*.md` or any other on-disk QA/audit artifact yourself. Dispatch `consolidator`, passing it inline whatever `qa-test-strategy` and `code-reviewer` already returned in Steps 3–4, plus the path(s) to any on-disk report those agents wrote (e.g. `docs/audits/ui-ux-accessibility-<date>.md`). It reads those directly, in its own isolated context, and returns one compact, prioritized fix list.

Decide what from that list must be fixed before considering the task done. Only then report the result back to the user — never hand over unreviewed ("raw") code.
```

- [ ] **Step 5: Structural validation**

Run:

```bash
claude plugin validate . --strict
```

Expected: `✔ Validation passed` (matches the precedent already recorded in `docs/superpowers/plans/2026-08-16-sasa-web-agents-plugin-acceptance.md`).

Then run the extended manual structural check, covering all 7 agents:

```bash
for a in architect backend-senior frontend-senior ui-ux-accessibility qa-test-strategy code-reviewer consolidator; do
  test -f "agents/$a.md" && grep -q "^name: $a$" "agents/$a.md" && grep -q '^description:' "agents/$a.md" && grep -q '^tools:' "agents/$a.md" && grep -q '^model:' "agents/$a.md" || echo "FAIL: $a"
done
test -f skills/start/SKILL.md && grep -q '^name: start$' skills/start/SKILL.md || echo "FAIL: SKILL.md"
echo "done"
```

Expected: no `FAIL:` lines printed, just `done`.

- [ ] **Step 6: Commit**

```bash
git add agents/consolidator.md skills/start/SKILL.md
git commit -m "$(cat <<'EOF'
Add consolidator subagent, delegate Step 5 audit synthesis to it

The orchestrator previously read the raw UI/UX audit file (and any other
on-disk QA artifact) directly to decide what's blocking. That read now
happens inside a dedicated, isolated consolidator subagent, which returns
only a deduplicated, prioritized fix list — the orchestrator's own
context no longer absorbs the raw report.
EOF
)"
```

---

### Task 3: Per-subagent duration logging via bundled hooks

**Files:**
- Create: `hooks/hooks.json`
- Create: `hooks/log-agent-start.js`
- Create: `hooks/log-agent-stop.js`

**Interfaces:**
- Consumes: nothing from Tasks 1-2.
- Produces: `${CLAUDE_PLUGIN_DATA}/agent-durations.csv` (append-only, one row per completed subagent invocation) and a transient `${CLAUDE_PLUGIN_DATA}/.starts/<agent_id>` file per in-flight invocation. Both paths are runtime-only (not part of the repo, not committed).

- [ ] **Step 1: Write `hooks/log-agent-start.js`**

```javascript
#!/usr/bin/env node
'use strict';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

async function main() {
  const fs = require('fs');
  const path = require('path');

  const raw = await readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const agentId = input.agent_id;
  const dataDir = process.env.CLAUDE_PLUGIN_DATA;
  if (!agentId || !dataDir) {
    process.exit(0);
  }

  try {
    const startsDir = path.join(dataDir, '.starts');
    fs.mkdirSync(startsDir, { recursive: true });
    fs.writeFileSync(path.join(startsDir, agentId), String(Date.now()));
  } catch {
    // Best-effort logging must never block the session.
  }

  process.exit(0);
}

main();
```

- [ ] **Step 2: Write `hooks/log-agent-stop.js`**

```javascript
#!/usr/bin/env node
'use strict';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

function csvEscape(value) {
  const s = String(value == null ? '' : value);
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function main() {
  const fs = require('fs');
  const path = require('path');

  const raw = await readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const agentId = input.agent_id;
  const dataDir = process.env.CLAUDE_PLUGIN_DATA;
  if (!agentId || !dataDir) {
    process.exit(0);
  }

  try {
    const startFile = path.join(dataDir, '.starts', agentId);
    const now = Date.now();
    let start = now;
    if (fs.existsSync(startFile)) {
      const parsed = parseInt(fs.readFileSync(startFile, 'utf8'), 10);
      if (Number.isFinite(parsed)) start = parsed;
    }
    const durationSeconds = Math.max(0, Math.round((now - start) / 1000));

    const csvPath = path.join(dataDir, 'agent-durations.csv');
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, 'timestamp,agent_type,agent_id,session_id,cwd,duration_seconds\n');
    }

    const row = [
      new Date(now).toISOString(),
      input.agent_type,
      agentId,
      input.session_id,
      input.cwd,
      durationSeconds,
    ].map(csvEscape).join(',') + '\n';

    fs.appendFileSync(csvPath, row);

    if (fs.existsSync(startFile)) {
      fs.unlinkSync(startFile);
    }
  } catch {
    // Best-effort logging must never block the session.
  }

  process.exit(0);
}

main();
```

- [ ] **Step 3: Write `hooks/hooks.json`**

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "architect|backend-senior|frontend-senior|qa-test-strategy|ui-ux-accessibility|code-reviewer|consolidator",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/log-agent-start.js\""
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "architect|backend-senior|frontend-senior|qa-test-strategy|ui-ux-accessibility|code-reviewer|consolidator",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/log-agent-stop.js\""
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 4: Validate `hooks.json` is well-formed**

Run: `node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json', 'utf8')); console.log('valid json')"`
Expected: `valid json`

- [ ] **Step 5: Simulate the hook contract end-to-end (no real Claude Code session needed)**

```bash
export CLAUDE_PLUGIN_DATA="$(mktemp -d)"
echo "Using $CLAUDE_PLUGIN_DATA"

# Simulate SubagentStart for agent_id "test-agent-1"
echo '{"agent_id":"test-agent-1","agent_type":"backend-senior","session_id":"sess-1","cwd":"/tmp/client-project"}' \
  | node hooks/log-agent-start.js
test -f "$CLAUDE_PLUGIN_DATA/.starts/test-agent-1" && echo "PASS: start file created" || echo "FAIL: start file missing"

sleep 2

# Simulate SubagentStop for the same agent_id
echo '{"agent_id":"test-agent-1","agent_type":"backend-senior","session_id":"sess-1","cwd":"/tmp/client-project"}' \
  | node hooks/log-agent-stop.js

test -f "$CLAUDE_PLUGIN_DATA/agent-durations.csv" && echo "PASS: csv created" || echo "FAIL: csv missing"
cat "$CLAUDE_PLUGIN_DATA/agent-durations.csv"
test -f "$CLAUDE_PLUGIN_DATA/.starts/test-agent-1" && echo "FAIL: start file not cleaned up" || echo "PASS: start file cleaned up"

# Resilience case: Stop with no prior Start (RF-05 equivalent) must not crash and must log duration 0
echo '{"agent_id":"orphan-agent","agent_type":"code-reviewer","session_id":"sess-1","cwd":"/tmp/client-project"}' \
  | node hooks/log-agent-stop.js
grep "orphan-agent" "$CLAUDE_PLUGIN_DATA/agent-durations.csv" && echo "PASS: orphan stop logged without crashing"

rm -rf "$CLAUDE_PLUGIN_DATA"
```

Expected output includes: `PASS: start file created`, `PASS: csv created`, a CSV with a header row plus a `backend-senior` row showing `duration_seconds` of approximately `2`, `PASS: start file cleaned up`, and `PASS: orphan stop logged without crashing` with the `orphan-agent` row showing `duration_seconds` of `0`.

- [ ] **Step 6: Commit**

```bash
git add hooks/hooks.json hooks/log-agent-start.js hooks/log-agent-stop.js
git commit -m "$(cat <<'EOF'
Add per-subagent duration logging via bundled SubagentStart/Stop hooks

Logs one CSV row per completed invocation of this plugin's 7 subagents
to ${CLAUDE_PLUGIN_DATA}/agent-durations.csv (agent_type, duration,
cwd to disambiguate projects sharing the same plugin install). Ships
inside the plugin so it applies to anyone who installs it, no personal
settings.json edits required. Node.js scripts (no jq dependency);
best-effort, never blocks the session on failure.
EOF
)"
```

---

### Task 4: Measure the Step-5 delegation's token effect and publish it

**Files:**
- Modify: `README.md`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: the measured numbers below (already computed against a representative fixture — reproduce to confirm, do not re-invent the fixture).

- [ ] **Step 1: Reproduce the measurement**

The fixture below represents a realistic `ui-ux-accessibility` audit report (the exact artifact `consolidator` now reads instead of the orchestrator) and the corresponding `consolidator` synthesis for the same underlying findings. Write both to a scratch location and measure:

```bash
mkdir -p /tmp/sasa-measure && cd /tmp/sasa-measure
cat > before.md <<'EOF'
# UI/UX & Accessibility Audit — 2026-08-17

## Finding 1
**What's wrong:** Primary CTA button ("Solicitar orçamento") uses `#7a7a7a` text on a `#9c9c9c` background, a contrast ratio of 1.8:1.
**Where:** `components/Hero/CtaButton.tsx`, line 34.
**Why it matters:** Users with low vision cannot read the button label. Blocks WCAG 1.4.3 (Contrast Minimum).
**Criterion:** WCAG 2.1 AA 1.4.3.

## Finding 2
**What's wrong:** The horizontal-scroll portfolio section traps keyboard focus once a user tabs into it — arrow keys scroll the section but Tab does not exit it.
**Where:** `components/Portfolio/HorizontalScroll.tsx`, `useScrollTrigger` hook.
**Why it matters:** Keyboard-only users get stuck and cannot reach the footer or contact form. Blocks WCAG 2.1.2 (No Keyboard Trap).
**Criterion:** WCAG 2.1 AA 2.1.2.

## Finding 3
**What's wrong:** Screen readers announce every image in the "interactive imagery" masonry grid as "image", with no descriptive alt text.
**Where:** `components/Gallery/MasonryGrid.tsx`, line 51.
**Why it matters:** Blind and low-vision users get no information about gallery content. Blocks WCAG 1.1.1 (Non-text Content).
**Criterion:** WCAG 2.1 AA 1.1.1.

## Finding 4
**What's wrong:** The mobile nav toggle is a 32×32px tap target with 4px of surrounding padding.
**Where:** `components/Nav/MobileToggle.tsx`, line 12.
**Why it matters:** Falls below the 44×44px minimum touch target, a common miss-tap source for users with motor impairments.
**Criterion:** WCAG 2.1 AA 2.5.5 (Target Size).

## Finding 5
**What's wrong:** Several scroll-triggered fade/slide animations have no `prefers-reduced-motion` fallback — checked via DevTools emulation, the animation still plays at full intensity.
**Where:** `lib/gsap/scrollAnimations.ts`, all `ScrollTrigger.create` calls.
**Why it matters:** Users who've opted out of motion (vestibular disorders, motion sickness) still get the full animated experience. Blocks WCAG 2.3.3 (Animation from Interactions).
**Criterion:** WCAG 2.1 AA 2.3.3.

## Finding 6
**What's wrong:** Spacing scale is inconsistent between the "Serviços" and "Sobre" sections — one uses an 8px-based scale, the other a 10px-based scale, producing visibly uneven rhythm when scrolling between them.
**Where:** `components/Services/Section.module.css` vs `components/About/Section.module.css`.
**Why it matters:** Reads as unpolished/unfinished to the client and end users; not a WCAG issue, but a visual-consistency defect.

## Finding 7
**What's wrong:** On tablet breakpoint (768–1024px), the pricing table overflows its container by ~40px, causing horizontal page scroll.
**Where:** `components/Pricing/Table.tsx`, missing `overflow-x: auto` wrapper.
**Why it matters:** Breaks layout and hides the rightmost pricing column entirely on iPad-sized viewports.

## Finding 8
**What's wrong:** Live region for the contact form's submit-success message is missing — the message renders visually but is not announced by screen readers.
**Where:** `components/ContactForm/SuccessMessage.tsx`, line 9.
**Why it matters:** Screen reader users get no confirmation their form submitted, and may resubmit. Blocks WCAG 4.1.3 (Status Messages).
**Criterion:** WCAG 2.1 AA 4.1.3.
EOF

cat > after.md <<'EOF'
## Consolidated fix list (blocker → nice-to-have)

1. **Blocker — WCAG 2.1.2:** Horizontal-scroll portfolio traps keyboard focus (`components/Portfolio/HorizontalScroll.tsx`). Tab can't exit the section.
2. **Blocker — WCAG 1.4.3:** CTA button contrast is 1.8:1, needs ≥4.5:1 (`components/Hero/CtaButton.tsx:34`).
3. **Blocker — WCAG 1.1.1:** Gallery images have no alt text, announced as "image" (`components/Gallery/MasonryGrid.tsx:51`).
4. **Blocker — WCAG 2.3.3:** Scroll animations ignore `prefers-reduced-motion` (`lib/gsap/scrollAnimations.ts`, all `ScrollTrigger.create` calls).
5. **Blocker — WCAG 4.1.3:** Form success message isn't announced to screen readers, no live region (`components/ContactForm/SuccessMessage.tsx:9`).
6. **Should-fix:** Pricing table overflows container on tablet (768–1024px), hides rightmost column (`components/Pricing/Table.tsx`).
7. **Should-fix — WCAG 2.5.5:** Mobile nav toggle is 32×32px, below the 44×44px minimum (`components/Nav/MobileToggle.tsx:12`).
8. **Nice-to-have:** Spacing scale inconsistent between "Serviços" (8px-based) and "Sobre" (10px-based) sections — visual polish, not WCAG.
EOF

before_chars=$(wc -c < before.md)
after_chars=$(wc -c < after.md)
before_tok=$(( (before_chars + 3) / 4 ))
after_tok=$(( (after_chars + 3) / 4 ))
saved_tok=$(( before_tok - after_tok ))
pct=$(( 100 * saved_tok / before_tok ))
echo "before_tok_est=$before_tok after_tok_est=$after_tok saved_tok_est=$saved_tok pct=${pct}%"
cd - && rm -rf /tmp/sasa-measure
```

Expected: `before_tok_est=808 after_tok_est=291 saved_tok_est=517 pct=63%` (estimated at ~4 characters per token — a standard rough heuristic for English/Portuguese prose, not an exact Claude tokenizer count).

- [ ] **Step 2: Update `README.md`**

Change line 3 from:

```
A Claude Code plugin: a senior-level web development team of 6 specialist subagents, plus a client-discovery-driven orchestration skill, for building client websites with highly dynamic interfaces (GSAP, horizontal/vertical scroll, images that interact with each other) — in the spirit of reference sites like the Lando Norris personal site.
```

to:

```
A Claude Code plugin: a senior-level web development team of 7 specialist subagents, plus a client-discovery-driven orchestration skill, for building client websites with highly dynamic interfaces (GSAP, horizontal/vertical scroll, images that interact with each other) — in the spirit of reference sites like the Lando Norris personal site.
```

In the agents table, add a row after the `code-reviewer` row:

```
| `consolidator` | Synthesizes QA/UI-UX/code-review findings into one prioritized fix list | Read, Grep, Glob | Reads on-disk reports itself so the orchestrator never has to; read-only |
```

Change the "How orchestration works" step 5 line from:

```
5. **Consolidate** — findings get triaged and fixed before anything is handed back as done.
```

to:

```
5. **Consolidate** — `consolidator` reads the raw QA/UI-UX/code-review reports and returns one prioritized fix list; findings get triaged and fixed before anything is handed back as done.
```

Add a new subsection right after "## Design philosophy"'s existing bullet list (i.e. after the "Nothing ships unreviewed" bullet, before "## License"):

```

## Efficiency

- **Delegated consolidation.** The orchestrating session never reads the raw UI/UX audit report (or other on-disk QA artifacts) directly — `consolidator` reads them in its own isolated context and returns a compact, deduplicated fix list instead. Measured against a representative 8-finding audit report: ~808 estimated tokens of raw report replaced by ~291 estimated tokens of synthesis, a ~63% reduction *for that one report, per consolidation cycle* (estimated at ~4 characters/token; not a plugin-wide token-usage claim — see `docs/superpowers/specs/2026-08-17-token-time-instrumentation-design.md` for the full method).
- **Per-agent duration log.** Every invocation of the 7 subagents is timed automatically via bundled hooks and appended to a local CSV (`${CLAUDE_PLUGIN_DATA}/agent-durations.csv`) — no setup required, works for anyone who installs this plugin.
```

- [ ] **Step 3: Update `.claude-plugin/plugin.json`**

Change `"description"` from `"...team of 6 specialist subagents plus a client-discovery orchestration skill..."` to `"...team of 7 specialist subagents plus a client-discovery orchestration skill..."`.

Change `"version"` from `"1.0.0"` to `"1.1.0"`.

- [ ] **Step 4: Update `.claude-plugin/marketplace.json`**

Change the nested plugin entry's `"description"` from `"...team of 6 specialist subagents plus a client-discovery orchestration skill..."` to `"...team of 7 specialist subagents plus a client-discovery orchestration skill..."`, and its `"version"` from `"1.0.0"` to `"1.1.0"`.

- [ ] **Step 5: Re-validate**

Run: `claude plugin validate . --strict`
Expected: `✔ Validation passed`

- [ ] **Step 6: Commit**

```bash
git add README.md .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "$(cat <<'EOF'
Document efficiency benefits in README, bump plugin to v1.1.0

Adds the consolidator subagent to the roster, publishes the measured
(not guessed) token effect of delegating audit-report reads to it, and
notes the automatic per-agent duration log. Scoped precisely to what
changed — not a plugin-wide token-savings claim.
EOF
)"
```

---

## Final report to user

After Task 4's commit, tell the user the measured numbers from Step 1 (before/after estimated tokens and percentage, with the ~4 chars/token method called out explicitly) and confirm the README section is live.
