---
title: Minimap with multiple POV rendering Roadmap
delivery_date: 2026-02-12
status: 'done'
type: 'roadmap'
related_documents: ['./pitch.md', './plan.md']
---

This roadmap tracks the **todos** and **success criteria** for adding a configurable minimap rendered as a second POV from the same simulation stream. Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for details.

## Workstreams

- **W1: Simulation data** (`MinimapPixel` component and prefab integration)
- **W2: Renderer core** (minimap mode in `PixiEcsRenderer` and render pass)
- **W3: Renderer composition** (`RendererManager`, masking, overlay rectangle)
- **W4: Product integration** (`TestPlayer` props and runtime wiring)
- **W5: Storybook coverage** (minimap section with focused controls and variants)
- **W6: Validation** (tests/checks and regression verification)

## Agent workflow

1. Complete one todo.
2. Add or update tests and ensure they pass.
3. Update roadmap/plan checkboxes.
4. Commit checkpoint. Then repeat.

## Milestones / Todos

### Phase 0: Simulation Contract

- [x] Complete `MinimapPixel` component + render schema + prefab wiring.

### Phase 1: Renderer Minimap Mode

- [x] Complete minimap render mode and snapped pixel pass in `@outside/renderer`.

### Phase 2: RendererManager Composition

- [x] Complete dual-renderer composition, masking, placement, and viewport rectangle overlay.

### Phase 3: Test Player API

- [x] Complete minimap props/defaults and `TestPlayer` integration.

### Phase 4: Storybook Minimap Section

- [x] Complete minimap stories and minimap-only control surface.

### Phase 5: Verification

- [x] Complete tests/checks and validate non-minimap behavior remains unchanged.
