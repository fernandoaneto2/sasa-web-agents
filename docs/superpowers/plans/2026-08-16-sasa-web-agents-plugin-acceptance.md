# sasa-web-agents — manual acceptance checklist

Run this once, interactively in a Claude Code session, before considering the plugin
done. Check each box as you confirm it.

- [x] Repo pushed to `https://github.com/fernandoaneto2/sasa-web-agents` (branch `main`).
      Ran `claude plugin validate . --strict` → `✔ Validation passed`.
- [x] Ran `claude plugin marketplace add fernandoaneto2/sasa-web-agents` — cloned over
      HTTPS from GitHub and validated: `✔ Successfully added marketplace: sasa-web-agents`.
      This is the real install path (marketplace source = GitHub repo, not a local path),
      confirming `README.md`'s documented `/plugin marketplace add
      fernandoaneto2/sasa-web-agents` command is correct as written.
- [x] Ran `claude plugin install sasa-web-agents@sasa-web-agents` →
      `✔ Successfully installed plugin: sasa-web-agents@sasa-web-agents (scope: user)`.
      Confirms the `@sasa-web-agents` marketplace-name suffix (the Critical fix from the
      final review) is correct — install would have failed on the old
      `@fernandoamorim` (owner-name) form.
- [x] Ran `claude plugin details sasa-web-agents@sasa-web-agents` — component inventory
      confirms all 6 agents registered under their exact bare names (`architect`,
      `backend-senior`, `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`,
      `code-reviewer`) and 1 skill (`start`). **This resolves the open technical question
      from the spec's "Nota de validação técnica":** agents are registered plugin-wide
      under their bare names (not namespaced), so `skills/start/SKILL.md` dispatching
      them via bare `Agent` tool calls (e.g. `subagent_type: "architect"`) is correct as
      written — no change needed.
- [ ] Run `/sasa-web-agents:start` in a **fresh Claude Code session** (plugins installed
      mid-session don't register their skills/agents into the already-running session —
      confirmed: the session that ran the installs above could not see `start` as an
      invocable skill afterward) and confirm it begins the Step 0 discovery questions
      instead of erroring or doing nothing.
- [ ] Answer a couple of discovery questions, then interrupt — confirm nothing crashes
      and you can resume the conversation normally.
- [ ] In that fresh session, confirm the 6 agents also appear in `/context` under
      "Custom Agents" (component inventory above already confirms the plugin registers
      them; this step confirms the running session picked them up).

## Validation ran

Independently re-run after Task 11 (not just claimed in the implementer's report):

```
$ jq -e '.name == "sasa-web-agents"' .claude-plugin/plugin.json
true
$ for a in architect backend-senior frontend-senior ui-ux-accessibility qa-test-strategy code-reviewer; do
    test -f "agents/$a.md" && grep -q "^name: $a$" "agents/$a.md" && grep -q '^description:' "agents/$a.md" && grep -q '^tools:' "agents/$a.md"
  done
$ test -f skills/start/SKILL.md && grep -q '^name: start$' skills/start/SKILL.md
$ test -f README.md && test -f LICENSE
ALL STRUCTURAL CHECKS PASS
```

Note: when comparing `grep 'tools:' agents/*.md` output against an expected block, compare the *set* of lines, not their order — repeated runs in this sandbox printed the six lines in varying order across invocations (a shell buffering artifact), even though the underlying content was byte-identical every time.
