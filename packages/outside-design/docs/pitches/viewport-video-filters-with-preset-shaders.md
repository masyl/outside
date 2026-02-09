---
Title: Viewport Video Filters with Preset Shaders
Category: Rendering
Summary: ECS-driven viewport filter system using Pixi filter presets for gameplay-triggered visual effects.
---

# Viewport Video Filters with Preset Shaders

## Motivation

The renderer currently has only limited hardcoded post-processing behavior. Gameplay scenarios need a reusable system to trigger strong visual mood changes from entity state (for example, an enemy applying a world tint while alive).

Without a dedicated system, each effect becomes a one-off renderer change and is difficult to combine, toggle, and reason about.

## Solution

Introduce a viewport-level filter system based on Pixi preset filters from `https://filters.pixijs.download/`, controlled through ECS components/toggles.

Any entity with the relevant filter components can activate a global viewport effect layer. This allows scripted or event-driven gameplay to toggle effects by changing simulation state, while the renderer remains a consumer.

## Inclusions

- ECS components/tags that declare filter activation, preset type, and optional strength/priority.
- Renderer-side filter manager that maps ECS state to Pixi filter instances.
- Global viewport effects triggered by entity state (example: mummy entity enables sepia until defeated).
- Deterministic stacking/priority rules when multiple filter sources are active.
- Safe defaults and fallback behavior when a preset is unavailable.
- Tests for filter state resolution and enable/disable behavior.

## Exclusions

- No full filter authoring UI/editor in this pitch.
- No per-entity local filter regions (viewport/global only).
- No timeline/cutscene transition system beyond basic toggles.
- No rewrite of unrelated renderer systems.

## Implementation Details (use sparingly)

- Start with a curated preset list for performance and predictability.
- Filter objects are renderer-owned; ECS only carries activation data.
- Recompute active filter stack from ECS state each tick/frame boundary.
- Keep API compatible with future scripting/event integrations.

## Pre-requisites

- Existing ECS simulator and Pixi renderer integration.
- Agreement on canonical filter component names and data contract.

## Open Questions

- Which presets are phase-1 defaults (for example: sepia, CRT, bloom, glitch)?
- Should multiple active filter sources blend, stack, or resolve by highest priority?
- Which parameters are safe to expose initially (intensity, noise, curvature, etc.)?

## Next Logical Pitches

- Designer-facing filter preset packs and balancing tools.
- Timeline/event-driven filter transitions with durations/easing.
- Per-zone or per-camera filter scopes.
