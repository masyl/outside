---
Title: Pixel Platter Resource Pack
Category: Rendering
Summary: Convert Pixel Platter food icons into a reusable resource-pack package and wire simulator + Pixi food variants to it.
---

# Pixel Platter Resource Pack

## Motivation

Food currently renders as a single fallback icon. We need a proper content pipeline for themed food variants so simulation data can express variant identity and the renderer can map those identities to consistent pixel-art assets.

## Solution

Create a dedicated `@outside/resource-packs` package containing a normalized Pixel Platter spritesheet, a machine-readable manifest, and license metadata. Extend the food prefab API to set variant sprite keys and update Pixi food rendering to resolve textures by variant key with deterministic fallback.

## Inclusions

- New package `@outside/resource-packs` under `packages/resourcePacks`.
- Pixel Platter pack conversion outputs:
  - atlas PNG (16x16 tiles with 2px outer padding)
  - pack JSON metadata + frame map
  - standalone `license.md` with creator credit details.
- Simulator `spawnFood` variant support and variant helper spawners.
- Pixi food texture mapping from sprite key to atlas frame.
- Storybook stories to validate all food variants and expose pack metadata.

## Exclusions

- Bot/hero/tile art migration.
- Simulation behavior changes beyond food visual key assignment.
- Timeline/time-travel/debug tooling changes.

## Pre-requisites

- Existing simulator render stream (`DefaultSpriteKey` / `VariantSpriteKey`).
- Existing Pixi renderer package and storybook integration.

## Open Questions

- Should additional non-food packs share the same manifest schema now or later?

## Next Logical Pitches

- Runtime pack switching (theme selector).
- Multi-pack manifest registry and validation tooling.
- Artist import CLI for automated pack ingestion from arbitrary asset folders.
