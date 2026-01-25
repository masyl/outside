# Delivery Report: Remove Legacy Animations / Unified Renderer / Continuous Motion

## Overview

This delivery started as “remove the legacy animation loop”, but evolved into a broader stabilization + modernization pass that:

- Unifies rendering of **terrain + bots** under a single pipeline
- Introduces **deterministic continuous bot motion** driven by reducer actions (timeline-friendly)
- Fixes multiple regressions (camera follow, layering, zoom scaling, sprite facing, walk cycle)
- Improves **FPS stability** and makes the debug overlay cheaper (especially on Safari)

## Delivered features

### 1. Unified renderer (single pipeline)

- A renderer-side data model (`Renderable`, `SpriteSpec`) derived from `WorldState`
- A single `UnifiedRenderer` lifecycle (create/update/delete) with a Pixi adapter
- Correct draw ordering (bots above terrain; debug overlay above all)

### 2. Deterministic continuous bot motion (timeline-friendly)

- `WorldState.timeMs` added as simulation time
- Per-bot motion state (`velocity`, `motion`) stored in `WorldState`
- `SIM_TICK` reducer action to advance motion deterministically (replayable)
- Tile-based collision “bounce” while rendering bots at **subtile** positions

### 3. Rendering + UX regressions fixed

- Camera follow updates every frame (selected bot tracking restored)
- Bot/debug layering over terrain fixed (z-order + container order)
- Bot zoom scaling fixed (bots now scale with global zoom like terrain)
- Sprite facing uses velocity direction (`directionFromVelocity`)
- Walk animation phase is continuous (distance-based accumulator)

### 4. FPS + debug overlay improvements

- Frame pacing stabilized with Pixi ticker configuration and **WebGL preference** for stability
- Debug overlay performance improved:
  - single multiline `pixiText` (reduces text texture churn, helps Safari)
  - FPS sampling loops pause when the panel is hidden

### 5. Documentation (design-side)

- ECS technical recommendation updated to match the current architecture and a safe transition strategy
- Roadmap created/maintained for the ECS + unified renderer migration

## Changes vs original plan

- **Original intent**: remove the legacy animation loop and keep movement simple.
- **What happened**: we used the opportunity to remove the legacy renderer paths entirely and land a unified renderer, then moved bot motion to a deterministic continuous system to unlock smooth visuals without breaking timeline/replay.

## Testing & coverage summary

- `pnpm build` ✅
- `pnpm test` ✅ (core + client suites green)
- `pnpm test:coverage` ✅
  - `@outside/core`: ~95% statements/lines
  - `@outside/client`: ~48% statements/lines (below the long-term target; see next steps)

See [`testing.md`](./testing.md) for commands + details.

## Known issues / deferred

- Bot sprite top-row cropping is still observed intermittently.
- 8-direction sprite coverage has not been exhaustively verified visually.
- Safari performance is improved, but still more sensitive than Chrome when overlays are enabled.

## Next steps

- Fix the sprite cropping issue (likely texture frame math / anchor / rounding at certain zooms).
- Add targeted renderer + debug layer coverage (client coverage is still low overall).
- Complete remaining wrapup docs for this delivery:
  - `commit.md` (prepared merge message)
  - README refresh (current `README.md` summary is out of date vs what was actually delivered)
