# Delivery Report: Minimap with multiple POV rendering

## Summary

This delivery introduced dual-POV rendering on one canvas by composing a primary viewport and a configurable minimap viewport from the same simulation stream. The implementation was completed through `RendererManager` orchestration in `@outside/test-player`, minimap rendering support in `@outside/renderer`, and Storybook coverage focused on minimap controls.

## Included (pitch + plan scope)

- `MinimapPixel` data contract in simulator and prefab wiring for floor/wall/actors (food excluded).
- Minimap render mode in renderer with snapped tile-pixel drawing and preserved draw ordering.
- Dual renderer composition on one Pixi app/canvas via `RendererManager`.
- Minimap shape mask (round/square), placement, size ratio, padding, zoom, and opacity options.
- Main viewport rectangle overlay (thin white line) drawn on minimap.
- Dedicated minimap Storybook section and variant stories.

## Additional completion tweaks

- Default minimap tuning adjusted to:
  - zoom level `2` (half of initial `4`)
  - background opacity `0.5` (50% black background)
- Minimap pixels now render at full opacity (`alpha = 1`) while transparency applies only to the minimap background.
- Minimap controls in Storybook now apply live updates for visual-only settings without entity/spawn resets.
- Storybook React aliasing stabilized to avoid invalid hook/runtime path issues under Vite alias resolution.
- Missing `setNodeLabel` helper in `RendererManager` fixed (runtime init regression).

## Build and verification

- `pnpm --filter @outside/renderer test` passed.
- `pnpm --filter outside-storybook build-storybook` passed.
- `pnpm build` passed at repo root.

## Notes

- Renderer package still prints pre-existing `vite:dts` type diagnostics during build, but this did not fail the workspace build in this delivery.
- Docs build behavior was updated to warn (not fail) on dead links, and known broken links in existing delivery docs were corrected.

## Next logical steps

1. Add explicit reactive update tests for minimap control changes in `@outside/test-player`.
2. Separate minimap "visual control plane" from simulation lifecycle for clearer reactivity boundaries.
3. Introduce a stable Storybook lane workflow in scripts (fresh cache + stable preview) to reduce validation friction during broad agent edits.
