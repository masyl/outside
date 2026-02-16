# Implementation Plan: Minimap with multiple POV rendering

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

Add a second point-of-view renderer that draws a simplified minimap from the same simulation stream on the same canvas as the main view. The minimap will be configurable (shape, placement, size, padding, opacity, zoom), default to bottom-right, and include a white viewport rectangle that represents the main camera coverage.

## Architectural Principles

1. Same renderer module, different mode: minimap uses `PixiEcsRenderer` with a minimap render configuration.
2. Renderer composition is centralized in a `RendererManager` responsible for lifecycle, visibility, stream fanout, layout, and sizing.
3. Minimap visibility is data-driven from simulation via a `MinimapPixel` component; entities without it are excluded.
4. Minimap pixel rendering snaps to tile coordinates and ignores sub-tile offsets.
5. Storybook minimap stories run through `@outside/test-player` and expose only minimap-relevant controls.

## 1. Simulation: Minimap Pixel Contract

### Checklist

- [x] Add `MinimapPixel` component to `@outside/simulator` with RGB fields (`r`, `g`, `b`).
- [x] Include `MinimapPixel` in `RENDER_COMPONENTS` and `RENDER_SNAPSHOT_COMPONENTS` so render stream includes minimap color data.
- [x] Add `MinimapPixel` to floor and wall prefabs.
- [x] Add `MinimapPixel` to bot and hero prefabs.
- [x] Keep food entities without `MinimapPixel` so they are excluded from minimap.

## 2. Renderer: Multi-POV and Minimap Mode

### Checklist

- [x] Extend `PixiRendererOptions` to support mode/configuration for composed rendering (`default` vs minimap), host container, and alpha.
- [x] Add minimap-specific render pass in `@outside/renderer` that draws snapped colored pixels from `MinimapPixel`.
- [x] Ensure minimap draw order follows existing depth ordering logic.
- [x] Add viewport sizing support in view controller independent from full renderer dimensions to support sub-viewports.
- [x] Keep main renderer behavior unchanged for existing consumers.

## 3. Test Player: RendererManager Composition

### Checklist

- [x] Add `RendererManager` in `@outside/test-player` to own primary and minimap renderer instances.
- [x] Ensure both renderer instances share one Pixi `Application`/canvas.
- [x] Add minimap layout computation: size from display-height ratio, cardinal placement, and horizontal/vertical padding relative to display height.
- [x] Add round/square minimap masking on the composed minimap viewport.
- [x] Add minimap viewport rectangle overlay (thin white line) representing the main viewport bounds.
- [x] Keep minimap center synchronized with main viewport center.

## 4. Test Player API and Controls

### Checklist

- [x] Extend `TestPlayerProps` with minimap configuration (enabled, shape, placement, zoom level, transparency, size ratio, paddings).
- [x] Set defaults: enabled false globally; when enabled default opacity 0.50, zoom level 2, size ratio 0.20, placement bottom-right.
- [x] Wire props through `TestPlayer` to `RendererManager` and keep existing pointer/controller behavior intact.

## 5. Storybook: Minimap Section and Stories

### Checklist

- [x] Add a dedicated Storybook section for minimap using `TestPlayer`.
- [x] Use a large dungeon scenario with about 24 diverse actors.
- [x] Add 5–6 story variants spanning round/square, size, placement, zoom, opacity, and padding combinations.
- [x] Restrict Storybook controls to minimap-relevant knobs for this section.

## 6. Verification and Regression Checks

### Checklist

- [x] Add/adjust unit tests for minimap component and renderer minimap pass behavior.
- [x] Run targeted tests for simulator and renderer packages.
- [x] Run Storybook package tests/build checks as feasible in this environment.
- [x] Validate no regressions in default non-minimap rendering behavior.

## Master Checklist

- [x] Simulation emits minimap pixel data for intended entities.
- [x] Renderer can run dual POV on one canvas.
- [x] Minimap is configurable and defaults match pitch.
- [x] Viewport rectangle is shown and aligned with main viewport.
- [x] Storybook minimap section exists with required variants.
- [x] Tests/checks pass for touched packages.

## Notes

- Exclusions stay intact: no advanced styling system for minimap lines/colors in this delivery.
- Review question defaults locked from pitch answers:
  - DPI: use non-retina pixel baseline (renderer resolution 1).
  - Zoom multiplier clamp: minimum 2, maximum 16.
  - Padding units: relative to display height.
  - Entity filtering: presence of minimap color component on entity.
  - Story count: allow more than 6 if useful.
