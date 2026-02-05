---
Title: "WFC Dungeon Generator in Storybook"
DeliveryDate: 2026-02-04
Summary: Alternative dungeon generator using wave function collapse for more varied Storybook layouts.
Status: DONE
Branch: feature/wfc-dungeon-storybook
Commit: da7055b
---

# WFC Dungeon Generator in Storybook

Completion: 2026-02-04  
Branch: feature/wfc-dungeon-storybook  
Tag: delivery/2026-02-04-1000-wfc-dungeon-storybook

Integrate a WFC-based dungeon generator into Storybook as an alternative to the room-and-corridor generator, returning the same DungeonResult contract and wiring new spawn functions and stories.

## Summary

- **wavefunctioncollapse** dependency and type declarations in outside-storybook.
- **dungeonLayoutWFC.ts**: `generateDungeonWFC(width, height, seed)` with fallback to room generator; same `DungeonResult` contract.
- **Spawn helpers**: spawnDungeonWFCThenScattered, spawnDungeonWFCWithFood, spawnDungeonWFCWithFoodAndHero.
- **Stories**: FloorGridDungeonWFC, FloorGridDungeonWithFoodWFC, DungeonWithHeroWFC.

## Documents

- [Pitch](./pitch.md)
- [Implementation Plan](./plan.md)
- [Roadmap](./roadmap.md)
- [Delivery Report](./delivered.md)
- [Testing Report](./testing.md)
- [Commit Preparation](./commit.md)
