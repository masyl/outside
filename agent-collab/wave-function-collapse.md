# Improved Wave Function Collapse Dungeon Generator

## Motivation

The generated dungeon looks like a randomly scattered jumble of walls and floor.

To make a WFC generated level fun and interesting, we need a better approach with higher level tiling than just single floor tiles.

# Solution


In order to improve the generation, we must define a better set of clear constraints and rules.

The concept proposed it one using MetaTiles (tiles made of tiles) that are made of other tiles. The generation of these metatiles have rules to make their content interesting an feel more like a dungeon with varied rooms, corridors, hallways and such.

The generation is also structured in multiple successive layers of complexity where one generated set is used by the next one.

## Metatiles generation rules

### MetaTiles

- MetaTiles are grids of 16 x 16 composed of single game tiles
- MetaTiles generation process is composed of Tiles, Gaps, Exits, Sides, Frames and Interiors.
- Each of those 6 components have their own successive generation rules.

### Set of Exits

An *Exit* represents a possible passage between to MetaTiles where the player can move through.

They are composed of 2 types of tiles: *WallTile* and *FloorTile*

**The constraints are:**

1. The sequence must start with a WallTile
2. The tile following a WallTile can only be a FloorTile.
3. No less than 2 and no more than 12 FloorTiles can be added to the sequence.
4. The last tile of the sequence must be a WallTile.

### Set of Gaps

Gaps are used as the spaces between Exits when generating *Sides*.

Composed only of EmptyTiles, they endup being the empty space of the generated dungeon when players cant go.

**The constraints are:**

- At least 2 EmptyTile
- At most 8 EmptyTile

### Set of Sides

Sides are composed of a sequence of Gaps and Exits.

Sides can be mirrored to generate a valid set faster.

**The constraints are:**

1. The first part of the sequence is always a Gap
2. A Gap can be followed by an Exit or by Nothing
3. A Gap is always followed by an Exit or the last part of the sequence.
4. An Exit is always followed by a Gap.
5. The total length of the Gaps and Exits sequence must be exactly 16 tiles.

### Frames Set

Frames are composed of 4 Sides, one for each *Direction* of a Metatile: Top, Bottom, Left and Right. The frame is used as the matching boundary between MetaTiles and for the generation contraints for the Interiors.

Frames can be rotated 4 times, or flipped on both axis to generate a valid set faster.

**The constraints are:**

- Each direction side can be any type of Side
- The total number of Exits for all 4 Sides cannot be more than 8

### Generating Interiors

Interiors are an almost infinite set or possibilities that is constrained by the Frame of the MetaTile.

Since the Frame occupies the tiles from each sides of the MetaTile, the interior is 14 x 14. The generation rules are then applied tile by tile, while taking into considerations the tiles of the Frame that have already been set. 

Each generated Interior can then match with any MetaTile according to the frame it has.

Interiors can be rotated and mirrored on both axis to generate a valid set faster.

**The constraints are:**

- A grid space can contain EmptyTiles, WallTiles, FloorTiles
- A FloorTile can only be next to other FloorTiles or WallTiles
- A FloorTile must be next to 2 other FloorTiles
- A WallTile must be next to 2 other WallTile
