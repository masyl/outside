# Implementation Plan: WFC Dungeon Generator in Storybook

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

Add a wave function collapse (WFC) dungeon generator to outside-storybook that returns the existing `DungeonResult` contract. Wire it into new spawn functions and Storybook stories so we can use WFC-generated layouts alongside the current room-and-corridor generator. Use the `wavefunctioncollapse` npm package (SimpleTiledModel) with a minimal floor/wall tileset and fallback to the current generator on WFC failure.

## Architectural Principles

1. **Same contract** — WFC module returns `DungeonResult` (grid + roomCells) so spawn code is unchanged.
2. **Deterministic** — Seeded RNG so the same seed yields the same layout in Storybook.
3. **Graceful fallback** — On WFC contradiction, retry then fall back to `generateDungeon` so stories always get a valid layout.
4. **Storybook-only** — No changes to outside-client or outside-simulator; dependency lives in outside-storybook.

---

## 1. Dependency and types

### Checklist

- [x] Add `wavefunctioncollapse` to [packages/outside-storybook/package.json](packages/outside-storybook/package.json) dependencies.
- [x] Create `packages/outside-storybook/src/types/wavefunctioncollapse.d.ts` declaring SimpleTiledModel constructor, `generate([rng])`, `isGenerationComplete()`, and `observed` (flat array of tile indices) for reading the result.

---

## 2. WFC dungeon module

### Checklist

- [x] Create [packages/outside-storybook/src/utils/dungeonLayoutWFC.ts](packages/outside-storybook/src/utils/dungeonLayoutWFC.ts).
- [x] Define minimal tileset data for SimpleTiledModel: two tiles (e.g. "floor", "wall") with symmetry "X" or "I"; use 1×1 or minimum tile size; adjacency rules so floor and wall can sit next to each other (floor-floor, floor-wall, wall-floor, wall-wall).
- [x] Implement seeded RNG function (e.g. same pattern as `seeded` in dungeonLayout.ts) and pass it to `model.generate(rng)`.
- [x] After successful generate, read `model.observed` (index = x + y * width) and map tile indices to boolean grid (floor → true, wall → false). Build `roomCells` as all floor cells (or largest connected components if preferred).
- [x] Export `generateDungeonWFC(width, height, seed): DungeonResult`; import `DungeonResult` from dungeonLayout.ts.
- [x] On generate() failure: retry up to a small number (e.g. 3); if all fail, call `generateDungeon(width, height, seed)` and return its result.

---

## 3. Spawn and Storybook wiring

### Checklist

- [x] In [packages/outside-storybook/src/components/simulator/spawnCloud.ts](packages/outside-storybook/src/components/simulator/spawnCloud.ts): import `generateDungeonWFC` from the WFC module.
- [x] Add `spawnDungeonWFCThenScattered(world, seed, entityCount)` using `generateDungeonWFC(80, 50, seed)` and the same floor/wall/entity loop as `spawnDungeonThenScattered`.
- [x] Add `spawnDungeonWFCWithFood` and `spawnDungeonWFCWithFoodAndHero` by analogy with existing dungeon+food and dungeon+hero (call WFC generator, same layout and entity counts).
- [x] In outside-storybook stories: add WFC-based dungeon stories (**FloorGridDungeonWFC**, **FloorGridDungeonWithFoodWFC**, **DungeonWithHeroWFC**) using the new WFC spawn functions.

---

## Master Checklist

- [x] Dependency and type declarations in outside-storybook.
- [x] dungeonLayoutWFC.ts with tileset, generateDungeonWFC, fallback.
- [x] spawnDungeonWFCThenScattered, spawnDungeonWFCWithFood, spawnDungeonWFCWithFoodAndHero.
- [x] Three new Storybook stories for WFC dungeon layouts.

---

## Notes

- **wavefunctioncollapse** API: SimpleTiledModel expects `data` with `tiles` (name, symmetry, bitmap or weight), `neighbors` (left/right tile name pairs; constrains which tiles can be adjacent on any of 4 sides). After `generate()`, `model.observed` is a flat array of tile indices (0..T-1). See library README and simple-tiled-model.js.
- **Tile size**: Library default tilesize is 16; we can use 1×1 pixel bitmaps (floor=green, wall=gray) or the minimum the library allows so we don't need real assets.
- **roomCells**: Using all floor cells is simplest; avoids connected-components logic and still spreads spawns across the map.
- **Wrapup**: Completed 2026-02-04. No deviations from the plan; all checklist items delivered.
