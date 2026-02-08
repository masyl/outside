---
Title: Inspector Renderer Package and Pixi Overlay
Category: Rendering
Summary: Extract React inspector renderer into its own package and overlay it on Pixi stories using a shared stream input.
---

# Inspector Renderer Package and Pixi Overlay

## Motivation

The React inspector renderer is currently embedded in Storybook code paths. This creates duplicated rendering logic and prevents a reliable side-by-side comparison with the Pixi renderer. We need one reusable inspector renderer package that can consume the same render stream as Pixi and be overlaid for debugging.

## Solution

Create `@outside/inspector-renderer` as a dedicated package for the React/SVG inspector renderer. Update Storybook to orchestrate one simulator stream source (`snapshot` + `delta`) and feed both renderers with the same packets. Add a Storybook control to overlay the inspector renderer over Pixi renderer for visual diffing.

## Inclusions

- New package `@outside/inspector-renderer` under `packages/outside-inspector-renderer`.
- Public API for stream ingestion and frame building:
  - `createInspectorRenderWorld`
  - `applyInspectorStream`
  - `buildInspectorFrame`
  - `InspectorRenderer`
  - `InspectorOverlay`
- Storybook shared stream adapter used by Pixi stories.
- Overlay controls in Pixi story groups:
  - `showInspectorOverlay`
  - `inspectorOpacity`
- Keep `Simulator/ECS Core` stories functional by switching to the extracted package.

## Exclusions

- Changes to simulator core semantics.
- Timeline/time-travel features.
- New gameplay interactions in inspector overlay.
- Changes to production game renderer integration.

## Pre-requisites

- Existing render stream support in `@outside/simulator`.
- Existing Pixi renderer package in `@outside/renderer`.
- Storybook + Playwright setup already available.

## Open Questions

- None for this iteration.

## Next Logical Pitches

- Inspector/Pixi automated visual diff tooling.
- Inspector interaction layer (entity picking and metadata panes).
- Shared renderer diagnostics package for both Pixi and inspector.
