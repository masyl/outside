---
Title: Hero and Food Consumption Regression Fix
Category: Simulation
Summary: Restore visible bot and variant food consumption behavior in the Hero and Food story without adding unrelated features.
---

# Hero and Food Consumption Regression Fix

## Motivation

In `Renderer/Pixi ECS > Hero and Food`, bots and variant bots no longer show clear food consumption behavior during normal story playback. This regresses expected demo behavior and makes validation of food interactions harder.

## Solution

Keep simulator systems unchanged and fix the story spawn setup so consumption opportunities are guaranteed early. In dungeon hero-food spawns, anchor a subset of food entities directly at spawned actor positions, then keep the remaining food distributed in room cells.

## Inclusions

- Targeted spawn adjustment for:
  - `spawnDungeonWithFoodAndHero`
  - `spawnDungeonWFCWithFoodAndHero`
- No changes to simulation system order or consumption logic.
- Regression test proving consumed events occur quickly for Hero and Food defaults.

## Exclusions

- No new gameplay mechanics.
- No renderer-only hacks for fake consumption.
- No timeline/debug tooling changes.

## Pre-requisites

- Existing simulator consumption system remains active.
- Existing Hero and Food story wiring via shared render stream.

## Open Questions

- Should anchored-food behavior remain story-only forever, or become a configurable spawn option for future demos?

## Next Logical Pitches

- Add explicit Storybook control for food placement strategy (anchored vs distributed).
- Add a tiny HUD counter for consumed-food events in demo stories.
