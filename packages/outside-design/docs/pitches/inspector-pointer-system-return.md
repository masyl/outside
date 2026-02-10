---
Title: Inspector Pointer System Return
Categories:
  - Interaction
  - Inspector
  - ECS
Tags:
  - inspector
  - pointer
  - subgrid
  - debug-tools
Summary: Reintroduce the legacy pointer workflow in the new inspector, including subgrid precision, pointer visuals, and line/dot grid toggles, active only while inspector layer is enabled.
---

# Inspector Pointer System Return

## Motivation

The legacy inspector had a practical pointer workflow for debugging tile alignment, entity targeting, and movement validation. The new inspector lost this capability, which makes visual debugging slower and less precise.

We need the old pointer mechanics back in the new inspector experience, but scoped to inspector usage only.

## Solution

Reintroduce the pointer system into the new inspector layer by reusing the interaction model from **"Pointer System — In-Game Pointer and Pointable"** and constraining it to inspector mode.

This restoration includes:

- Subgrid-aware pointer positioning.
- Pointer visual elements in the inspector layer.
- Line grid and dot grid overlays.
- Storybook controls to toggle line and dot grids.

The pointer subsystem is strictly bound to the inspector layer and is only active while inspector visibility is enabled.

## Inclusions

- Restore pointer tracking in the inspector rendering pipeline.
- Restore subgrid coordinate support used by pointer placement.
- Restore pointer visuals (marker/target indicator) in inspector overlay.
- Restore both grid overlays:
  - line grid
  - dot grid
- Add controls for toggling line grid and dot grid independently.
- Enforce activation gate:
  - inspector layer off -> pointer system disabled
  - inspector layer on -> pointer system enabled
- Keep behavior parity with key visual semantics from the previous pointer delivery where applicable to inspector context.

## Exclusions

- No pointer mechanics outside inspector context.
- No gameplay interaction features added from pointer input.
- No always-on pointer behavior when inspector is hidden.
- No timeline/time-travel features.

## Implementation Details (use sparingly)

- Reuse prior pointer concepts (pointer position, target resolution style, and visual affordance rules) from the delivered pointer-system pitch, but wire execution and rendering only through inspector-owned paths.
- Drive subgrid and pointer state from the same simulator stream used by inspector overlays.
- Keep line/dot grid visibility as inspector controls and ensure they do not render when inspector layer is disabled.
- Avoid introducing a second pointer system; this is a scoped repatriation of prior behavior into the new inspector architecture.

## Pre-requisites

- Existing new inspector overlay integration.
- Storybook controls pipeline for inspector settings.
- Access to previous pointer-system behavior definitions for parity checks.

## Open Questions

- Should pointer target visuals in inspector exactly match old colors/styles, or adapt to current inspector palette while keeping behavior parity?
- Should subgrid granularity remain fixed or be exposed as an inspector control in this pitch?

## Next Logical Pitches

- Pointer-based inspector tools (measure, inspect, select).
- Saved inspector presets (pointer + grid toggles).
- Extended overlay diagnostics coupled with pointer targeting.
