---
Title: Pixel Lands Dungeons Tile Pack
Category: Rendering
Summary: Add Pixel Lands dungeon floor and wall tiles as a resource pack and render them with weighted base/variant selection in Pixi.
---

# Pixel Lands Dungeons Tile Pack

## Motivation

The current Pixi renderer colors floor and wall tiles with solid fills. We want a first tile-art integration path using a dedicated resource pack, while keeping simulation data unchanged and handling visual variation entirely in renderer logic.

## Solution

Add a new `@outside/resource-packs` tile pack from `agent-collab/Pixel Lands Dungeons Demo`, export floor/wall tile frames, and load those textures in Pixi. During tile rendering, pick base textures 75% of the time and variant textures 25% of the time using deterministic per-tile selection so visuals stay stable across frames.

## Inclusions

- New Pixel Lands dungeon tile pack metadata + atlas + license in `@outside/resource-packs`.
- Renderer integration for floor/wall texture lookup from the new pack.
- Deterministic renderer-side weighted tile selection:
  - base tile: 75%
  - variant tiles: 25%
- Tests for pack metadata and tile-selection behavior.

## Exclusions

- Simulation-side tile variant data changes.
- Additional tile families not listed for this delivery.
- Runtime UI controls for tile-theme switching.

## Pre-requisites

- Existing `@outside/resource-packs` package structure and pack-build scripts.
- Existing Pixi renderer floor/wall render path in `@outside/renderer`.

## Open Questions

- Should future tile packs support configurable weighting per story or runtime profile?

## Next Logical Pitches

- Multi-theme dungeon tile switching at runtime.
- Expanded Pixel Lands coverage for additional wall/floor/object tiles.
- Weighted variant profiles by biome/room type.
