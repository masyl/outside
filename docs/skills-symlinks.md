# Skills Symlink Setup

This repo keeps skills in a single canonical directory: `skills/`.

Cursor (and other agent vendors) often expect skills in vendor-specific folders.
Rather than duplicating files, use symlinks that point back to `skills/`.

## Current Setup

- `skills/` is the source of truth.
- `.cursor/skills` is a symlink to `../skills`.

## Add Another Vendor

Create a symlink in the location your vendor expects.
Example commands (adjust paths to match your vendor):

```bash
# OpenAI Codex (example)
mkdir -p .codex
ln -s ../skills .codex/skills

# Claude (example)
mkdir -p .claude
ln -s ../skills .claude/skills

# Gemini (example)
mkdir -p .gemini
ln -s ../skills .gemini/skills

# GitHub Copilot (example)
mkdir -p .github/copilot
ln -s ../../skills .github/copilot/skills
```

If a vendor does not follow symlinks, replace `ln -s` with a copy step or a sync script.
