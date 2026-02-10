---
name: sync-vendor-skills – Ȯ
description: Syncs project skills into vendor-specific folders for Gemini, Claude, Cursor, and OpenAI Codex using scripts/sync-skills. Use when skills are added/updated and need to be recognized by agent vendors.
---

# Sync Vendor Skills – Ȯ

Syncs `skills/` into vendor-specific folders in this repo.

## When to use

- A skill was created, renamed, moved, or deleted.
- Vendor tools do not detect updated project skills.
- Before validating skills behavior across multiple AI vendors.

## Command

Run from the repository root:

```bash
pnpm run sync:skills
```

## What it updates

- `.gemini/skills/`
- `.claude/skills/`
- `.cursor/skills/`
- `.codex/skills/`

The sync is mirror-style and removes stale files from vendor folders.
