# Delivery Report: WFC Dungeon Generator in Storybook

## What is included

- **Dependency**: `wavefunctioncollapse` (v2.1.0) added to outside-storybook; type declarations in `outside-storybook/src/types/wavefunctioncollapse.d.ts`.
- **WFC dungeon module**: `outside-storybook/src/utils/dungeonLayoutWFC.ts` — minimal floor/wall tileset, seeded RNG, `generateDungeonWFC(width, height, seed)` returning `DungeonResult`; up to 3 retries on contradiction, then fallback to `generateDungeon`.
- **Spawn functions**: `spawnDungeonWFCThenScattered`, `spawnDungeonWFCWithFood`, `spawnDungeonWFCWithFoodAndHero` in `spawnCloud.ts`, mirroring the existing dungeon spawns but using the WFC generator.
- **Storybook stories**: FloorGridDungeonWFC, FloorGridDungeonWithFoodWFC, DungeonWithHeroWFC in Simulator.stories.tsx.

## What is missing from the original plan

- Nothing. All checklist items were completed.

## Extras

- None.

## Test coverage

- No new automated tests for the WFC module. Full repo `pnpm test` passes. Build and Storybook build pass; manual verification of the three WFC stories (and hero pathfinding on WFC dungeons) confirmed. See [testing.md](./testing.md).

## Logical next steps

- Storybook control to toggle "Rooms" vs "WFC" in a single dungeon story.
- Export dungeon template (serialize grid to JSON or command format).
- Unit tests for `generateDungeonWFC` (determinism, fallback).

## Special mentions

- **New dependency**: `wavefunctioncollapse` (MIT) in outside-storybook only; no changes to outside-client or outside-simulator.
- **API**: Same `DungeonResult` contract as `generateDungeon`; spawn pipeline unchanged.
