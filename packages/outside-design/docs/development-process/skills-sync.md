# Skills Sync

Project skills are authored in `skills/` at the repository root.

To make these skills available to vendor-specific tooling, run the sync script:

```bash
pnpm run sync:skills
```

## What gets synced

The script copies `skills/` into:

- `.gemini/skills/`
- `.claude/skills/`
- `.cursor/skills/`
- `.codex/skills/` (OpenAI Codex)

## When to run it

- After adding a new skill
- After updating or renaming a skill
- After deleting a skill directory
- Before verifying skills behavior in vendor tools

## Notes

- `skills/` remains the single source of truth.
- Vendor folders are generated outputs and can be refreshed at any time by re-running the command.
