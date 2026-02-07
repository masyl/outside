# Move Workspace Packages Under `packages/`

## Motivation

The repo's packages currently live at the root, which is uncommon for monorepos and makes the structure harder to scan. Tooling and contributors often expect a `packages/` folder, so adopting that convention improves clarity and reduces friction.

## Solution

Move every workspace package under `packages/` while keeping package names and behavior unchanged. Update workspace configuration, tooling, and documentation so all commands still work with the new layout.

## Inclusions

- Move all `outside-*` workspace directories under `packages/`.
- Update pnpm workspace configuration to include `packages/*`.
- Update path-based references in docs and scripts to the new locations.
- Keep existing package names (`@outside/*`) and behavior intact.

## Exclusions

- No renaming of package `name` fields.
- No dependency upgrades or refactors inside package code.
- No behavioral changes beyond path updates.

## Implementation Details

Use the move as a pure path change: relocate directories, then update references to the old paths.

## Missing Prerequisites

- None.

## Suggested follow ups

- Consider splitting `apps/` and `packages/` if the repo grows.
- Add a short onboarding note about the new layout.

## Open Questions

- None.
