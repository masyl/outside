---
Title: Inspector Pointer Repatriation
Category: Interaction
Summary: Bring back the legacy inspector pointer, including subgrid and pointer visuals, plus a line-and-dot grid toggle, active only when inspector overlay is enabled.
---

# Inspector Pointer Repatriation

## Motivation

The previous inspector had a useful pointer mechanic for debugging movement, tile alignment, and interaction targets. The new inspector overlay currently lacks this workflow, which slows down validation and makes pointer-driven checks harder during rendering work.

We need parity with the previous inspector behavior, while keeping the new hybrid renderer architecture intact.

## Solution

Reintroduce the pointer system in the new inspector renderer and wire it through Storybook controls so it is only active when the inspector overlay is shown.

This includes:

- Subgrid support for precise pointer placement.
- Pointer visual elements in the inspector layer.
- Line grid + dot grid visual overlays, with control toggles.

The pointer behavior remains inspector-bound (debug/inspection use), and does not run when inspector is hidden.

## Inclusions

- Re-add inspector pointer input handling and pointer rendering.
- Re-add subgrid model used by pointer positioning.
- Re-add pointer visual elements (cursor marker/target indicator) in inspector layer.
- Re-add both:
  - line grid overlay
  - dot grid overlay
- Add Storybook controls to toggle line grid and dot grid visibility.
- Ensure pointer subsystem is enabled only when `showInspectorOverlay` is on.
- Keep pointer behavior consistent between static and dynamic Pixi ECS stories.

## Exclusions

- No gameplay logic changes tied to pointer behavior.
- No Pixi-side pointer visuals in this pitch; pointer visuals are inspector-layer only.
- No timeline/time-travel integration.
- No new command system or interaction semantics beyond restoring previous pointer behavior.

## Implementation Details (use sparingly)

- Pointer state and subgrid positioning should be read from the simulator state already used by inspector stream flow, rather than introducing a separate world source.
- Inspector overlay should own pointer event capture when visible; when hidden, pointer handlers should be detached/disabled.
- Grid overlays (line and dot) should be renderer-level visual primitives controlled by Storybook args.
- Default behavior in stories:
  - overlay off -> pointer off, grid overlays off
  - overlay on -> pointer on, grid overlays on (subject to controls)

## Pre-requisites

- Existing inspector overlay wiring in Pixi ECS stories.
- Existing shared stream controller between Pixi and inspector.
- Existing Storybook control plumbing for inspector visual toggles.

## Open Questions

- Should line grid and dot grid be independently toggled or also offer one combined preset control?
- Should subgrid resolution be fixed to existing simulator defaults, or exposed as an inspector control?
- Should pointer visuals be reduced (minimal marker) in overlay mode to avoid visual clutter over Pixi sprites?

## Next Logical Pitches

- Pointer-driven inspector actions (entity inspect/select/focus).
- Inspector tool modes (measure distance, collision probe, path preview).
- Persisted debug presets for overlay + pointer + grid configuration.
