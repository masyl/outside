# Skills Sync Setup

This repo keeps project skills in a single canonical directory: `skills/`.

Some AI vendors do not consistently recognize symlinked skill folders, so this project uses a sync script to copy skills into each vendor-specific location.

## Source of truth

- `skills/` is the source of truth.

## Sync command

Run from repo root:

```bash
pnpm run sync:skills
```

This command mirrors skills to:

- `.agent/skills`
- `.gemini/skills`
- `.claude/skills`
- `.cursor/skills`
- `.codex/skills`

## Behavior

- New and updated files are copied to each vendor folder.
- Removed files are deleted from vendor folders during sync.
