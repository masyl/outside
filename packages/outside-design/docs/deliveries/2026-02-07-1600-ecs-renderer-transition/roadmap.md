---
title: 'Pixi Renderer for ECS Core Roadmap'
delivery_date: '2026-02-07'
status: 'in_progress'
type: 'roadmap'
related_documents:
  - './pitch.md'
  - './plan.md'
---

## Pixi Renderer for ECS Core Roadmap

This roadmap tracks the todos and success criteria for the Pixi renderer transition.

## Workstreams

- **W1: Sync Schema + Stream** (render component list, observer serializer/deserializer, Observed tagging)
- **W2: Renderer Core** (Pixi layers, render-world ECS, classification rules)
- **W3: Animation** (directional walk cycle tied to speed, no smoothing)
- **W4: Storybook** (renderer demo stories and integration)
- **W5: Assets** (sprite reuse + pixel icon placeholders + missing icon doc)

## Milestones / Todos

### Phase 0: Sync Schema

- [ ] Define and export `RENDER_COMPONENTS` in `@outside/simulator`.
- [ ] Add `createRenderObserverSerializer` helper.
- [ ] Ensure renderable entities add `Observed` tag.

### Phase 1: Renderer Package

- [ ] Create `@outside/renderer` package scaffolding.
- [ ] Implement render-world ECS and stream application (`applyRenderStream`).
- [ ] Implement Pixi rendering layers for tiles and entities.

### Phase 2: Animation

- [ ] Directional walk animation based on speed and position delta.
- [ ] Frame selection and asset hookup (idle vs walk).

### Phase 3: Assets

- [ ] Reuse existing sprite sheets where possible.
- [ ] Add `@hackernoon/pixel-icon-library` placeholders.
- [ ] Document missing icons in `missing-icons.md`.

### Phase 4: Storybook

- [ ] Add `Renderer/Pixi ECS` story section.
- [ ] Default, wall density, and hero+food stories.
