# Implementation Plan: Move Workspace Packages Under `packages/`

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

Move all workspace packages under `packages/` while keeping package names and behavior intact. Update workspace config, tooling, and documentation so existing commands and paths keep working with the new layout.

## Architectural Principles

1. Preserve package names (`@outside/*`) and internal module structure.
2. Treat the change as a path-only refactor: no behavior changes.
3. Update all repo-root path references to the new `packages/` locations.
4. Keep workspace tooling (pnpm + turbo) aligned and functional.

## 1. Workspace Layout Move

### Checklist

- [x] Create `packages/` folder if missing.
- [x] Move all `outside-*` workspace directories into `packages/`.
- [x] Confirm no non-package assets were moved inadvertently.

## 2. Workspace Configuration

### Checklist

- [x] Update `pnpm-workspace.yaml` to use `packages/*`.
- [x] Update root `package.json` workspaces to `packages/*`.
- [x] Verify turbo configuration does not depend on old paths.

## 3. Tooling + Infra Paths

### Checklist

- [x] Update any scripts or configs that reference old root paths.

## 4. Documentation + References

### Checklist

- [x] Update README and MONOREPO docs for the new layout.
- [x] Update design docs or delivery docs that reference old paths.
- [x] Update any onboarding or agent instructions referencing old paths.

## 5. Validation

### Checklist

- [x] `pnpm -w install` succeeds after path updates.
- [x] `pnpm dev` and `pnpm build` still resolve workspace packages.
- [x] Spot-check key package scripts (client/server/storybook) still run.

## Master Checklist

- [x] Move workspace directories into `packages/`.
- [x] Update workspace configuration files.
- [x] Update infrastructure/tooling paths.
- [x] Update documentation and internal references.
- [x] Validate core commands.

## Notes

- Package names remain unchanged; only filesystem paths are updated.
- No dependency or behavior changes are in scope.
- Tests and install were run by the user after the move; `pnpm test` passed.
