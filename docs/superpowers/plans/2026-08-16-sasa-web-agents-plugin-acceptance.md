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
