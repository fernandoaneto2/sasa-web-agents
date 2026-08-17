# sasa-web-agents — manual acceptance checklist

Run this once, interactively in a Claude Code session, before considering the plugin
done. Check each box as you confirm it.

- [ ] From this repo's root, run `/plugin marketplace add .` (or the equivalent local-path
      form your Claude Code version supports) to register this repo as a local
      marketplace, then `/plugin install sasa-web-agents@sasa-web-agents` (the `@` suffix
      is the marketplace's own `name` field from `.claude-plugin/marketplace.json`, which
      is `sasa-web-agents` — not a placeholder org name).
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
