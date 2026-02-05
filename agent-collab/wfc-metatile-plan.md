# Plan: Improved WFC Dungeon (MetaTiles)

## Decisions (from user)

- **Default demo size**: 5×5 MetaTiles (80×80 tiles). Width and height in MetaTiles exposed as Storybook controls.
- **Empty vs Wall**: EmptyTile and WallTile are distinct; never conflate. Empty = void (no entity). Wall = wall entity. Floor = floor entity.
- **No pre-generation**: The set of possible MetaTiles is too large to save or pre-generate. Generate each MetaTile randomly on demand when building the dungeon.

## Target contract

- **DungeonResult** (existing): `grid: boolean[][]` (floor), `roomCells: {x,y}[]`. Extended with optional **`wallGrid?: boolean[][]`**: when present, spawn wall only where `wallGrid[x][y]` is true (and not floor); where `!grid[x][y] && !wallGrid[x][y]` = Empty, spawn nothing.
- Metatile spawn path: for each cell, if `grid[x][y]` spawn floor; else if `wallGrid[x][y]` spawn wall; else skip (Empty).

## Tile types (in generator)

- **Empty** — void; player cannot go; no entity placed.
- **Wall** — wall entity; blocks movement.
- **Floor** — walkable; floor entity.

## Layers (from pitch)

1. **Exits**: Wall → 2–12 Floor → Empty. (Sequence of tile types.)
2. **Gaps**: 2–8 Empty tiles.
3. **Sides**: length 16; sequence of Gaps and Exits; starts with Gap; alternates Gap/Exit; total length 16.
4. **Frames**: 4 Sides (Top, Bottom, Left, Right); total Exits across all four ≤ 8.
5. **Interiors**: 14×14; Empty/Wall/Floor; Floor only next to Floor or Wall; every Floor ≥ 2 Floor neighbors; every Wall ≥ 2 Wall neighbors.
6. **MetaTile**: 16×16 = frame (sides) + interior (14×14 center).

## Placement

- Random: for each (mx, my) in metatile grid, generate one MetaTile on the fly (seeded RNG). No compatibility check between adjacent metatiles (random independent generation).

## Implementation order

1. Types + seeded RNG + Exits + Gaps + Sides.
2. Frames (4 Sides, total exits ≤ 8).
3. Interiors (14×14, constraint satisfaction).
4. MetaTile assembly; random placement; flatten to grid + wallGrid; DungeonResult.
5. generateDungeonMetaTiles(metaW, metaH, seed) → DungeonResult (tile size = metaW*16, metaH*16).
6. Extend DungeonResult with optional wallGrid; spawn path for metatile that uses wallGrid; Storybook story with controls (metaWidth, metaHeight, default 5×5).
