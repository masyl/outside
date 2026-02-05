# Commit message (for merge)

Use this when merging the feature branch into the trunk (e.g. squash and merge).

**Title**

feat(storybook): WFC dungeon generator for simulator stories

**Body**

Add an alternative dungeon generator using wave function collapse (WFC) so Storybook can display more varied, organic layouts alongside the existing room-and-corridor generator.

- Add `wavefunctioncollapse` dependency and type declarations to outside-storybook.
- Add `dungeonLayoutWFC.ts`: minimal floor/wall tileset, seeded RNG, `generateDungeonWFC()` returning same `DungeonResult`; fallback to room generator on WFC contradiction.
- Add spawn helpers: `spawnDungeonWFCThenScattered`, `spawnDungeonWFCWithFood`, `spawnDungeonWFCWithFoodAndHero`.
- Add stories: FloorGridDungeonWFC, FloorGridDungeonWithFoodWFC, DungeonWithHeroWFC.

Ref: delivery 2026-02-04-1000-wfc-dungeon-storybook

**Tags (suggested for merge commit)**

- delivery/2026-02-04-1000-wfc-dungeon-storybook
