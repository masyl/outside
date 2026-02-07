---
Title: WFC Dungeon Generator in Storybook
Category: Tooling / Storybook
---

# WFC Dungeon Generator in Storybook

## Motivation

The Storybook simulator uses a room-and-corridor dungeon generator to create floor layouts for dungeon demos. Layouts are predictable (rectangular rooms, L-shaped corridors). A wave function collapse (WFC) generator would produce more varied, organic-looking dungeons and give the team a reusable utility for better dungeon templates when testing and demoing.

## Solution

Integrate a WFC-based dungeon generator into outside-storybook as an **alternative** to the current generator. The generator returns the same contract the simulator already uses: a 2D grid (floor vs wall) and a list of spawnable cells. New Storybook stories will use the WFC generator so we can compare room-and-corridor vs WFC layouts side by side. No change to the game client or simulator core—only Storybook tooling and a new optional code path for dungeon spawns.

## Inclusions

- **WFC dependency**: Add a TypeScript-usable WFC library (e.g. `wavefunctioncollapse` or a TS port) to outside-storybook, with types as needed.
- **WFC dungeon module**: A new utility that defines a minimal dungeon tileset (floor, wall) and adjacency rules, runs WFC with a seeded RNG, and returns the existing `DungeonResult` type (grid + roomCells) so existing spawn code can stay unchanged.
- **Fallback on failure**: If WFC contradicts, retry a few times or fall back to the current room-and-corridor generator for that seed so stories always get a valid layout.
- **New spawn functions**: e.g. `spawnDungeonWFCThenScattered`, `spawnDungeonWFCWithFood`, `spawnDungeonWFCWithFoodAndHero` that call the WFC generator instead of `generateDungeon`.
- **New Storybook stories**: At least one story that uses the WFC dungeon (e.g. FloorGridDungeonWFC); optionally matching variants for dungeon+food and dungeon+hero so we can compare both generators.

## Exclusions

- No change to the game client or level format.
- No export/import of dungeon templates (e.g. save/load JSON) in this pitch.
- No UI control in Storybook to switch generator type in a single story (can be a follow-up).

## Implementation Details

- Reuse `DungeonResult` from `dungeonLayout.ts`: `{ grid: boolean[][], roomCells: {x,y}[] }`. The WFC module maps tile indices to floor (true) vs wall (false). For `roomCells`, use all floor cells or a simple heuristic (e.g. largest connected components) so spawns are spread across the layout.
- Spawn pipeline stays the same: iterate grid for floor tiles, `spawnWallsAroundFloor`, then place entities using roomCells.

## Missing Prerequisites

- None. Current dungeon layout and spawn cloud already provide the contract and pipeline.

## Suggested follow-ups

- Storybook control to toggle "Rooms" vs "WFC" in a single dungeon story.
- Export dungeon template (serialize grid to JSON or command format) for reuse in levels.

## Open Questions

- None.
