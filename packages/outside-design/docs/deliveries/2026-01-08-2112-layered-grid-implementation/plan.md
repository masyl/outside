# Work Summary

Successfully implemented a complete layered grid system with ground and surface layers. The ground layer contains terrain objects (grass, dirt, water, sand, holes) that can span multiple tiles, stack on top of each other, and determine walkability. The surface layer contains bots and other game objects. Terrain objects are rendered before the surface layer, and walkability is determined by the most recently created terrain at each position. Additionally, improved visual feedback with bot sprites changed to circles, selected bot styling (white with blue outline), and a 4x4 checkered pattern inside each grid tile.

**Key Achievements:**

- Complete two-layer grid system: ground layer (terrain) and surface layer (bots/objects)
- Terrain system with 5 types: grass, dirt, water, sand, holes
- Terrain objects can span multiple tiles and stack (top-most determines walkability)
- Walkability system: water and holes are not walkable; grass, dirt, and sand are walkable
- Terrain rendering with color-coded terrain types
- Initial terrain loading: all terrain commands processed synchronously before game loop starts
- Bot visual improvements: circles instead of squares, selected bot has white fill with blue outline, unselected bots have grey border
- Grid visual improvement: each tile has 4x4 checkered pattern inside
- Comprehensive debug logging for terrain creation, walkability checks, and movement

**Implementation Details:**

- Ground layer uses position indexing for efficient terrain lookups
- Terrain objects stored with creation timestamps for stacking order
- Walkability checks integrated into movement and placement validation
- Terrain layer updates on every world state change to ensure correct rendering
- Mock command feeder separates terrain commands (processed immediately) from bot commands (processed by game loop)

## Commit Reference

- **Commit**: `6f789d4`
- **GitHub**: https://github.com/masyl/outside/commit/6f789d4
- **Description**: feat(client): Implement layered grid system with terrain and visual improvements

---

# Layered Grid Implementation Plan

## Overview

Implement a two-layer grid system: **surface layer** (existing bots/objects) and **ground layer** (new terrain system). Terrain objects can span multiple tiles, stack on top of each other, and determine walkability. The ground layer renders first, followed by the surface layer.

## Architecture

### Layer Separation

- **Ground Layer**: Contains terrain objects that determine walkability. Multiple terrain objects can occupy the same tiles (stacking). Top-most (last created) determines walkability.
- **Surface Layer**: Contains bots and other game objects (existing system). Rendered on top of ground layer.

### Data Structure

Terrain objects are stored separately from the surface grid. Each terrain object:

- Has a position (x, y), width, height
- Occupies a rectangular area
- Has a type (grass, dirt, water, sand, hole)
- Has walkability (water, hole = not walkable; grass, dirt, sand = walkable)
- Has a creation timestamp for stacking order

For walkability lookups, we query all terrain objects that cover a position and use the most recently created one, which is deemed to be the topmost.

## Implementation

### 1. Core Types (`packages/outside-core/src/types.ts`)

**Added terrain types:**

- `TerrainType`: 'grass' | 'dirt' | 'water' | 'sand' | 'hole'
- `TerrainObject`: Interface with id, type, position, width, height, createdAt timestamp
- `GroundLayer`: Interface with terrainObjects Map and terrainObjectsByPosition Map for efficient lookups

**Updated WorldState:**

- Added `groundLayer: GroundLayer` field to store terrain separately from surface layer

### 2. Core World Utilities (`packages/outside-core/src/world.ts`)

**Added terrain utilities:**

- `createGroundLayer()`: Initialize empty ground layer
- `getTerrainObjectsAtPosition()`: Return all terrain objects covering a position
- `getTopMostTerrainAtPosition()`: Return most recently created terrain at position (for walkability)
- `isWalkable()`: Check if position is walkable (has terrain AND top-most is walkable)
- `isTerrainTypeWalkable()`: Check if terrain type is walkable
- `addTerrainObject()`: Add terrain object and update position index
- `removeTerrainObject()`: Remove terrain object and update position index
- `doesTerrainCoverPosition()`: Check if terrain object covers a given position

**Updated `createWorldState()`:**

- Initialize `groundLayer` with empty terrain objects map

### 3. Command Parser (`packages/outside-client/src/commands/parser.ts`)

**Added terrain command parsing:**

- Format: `"create terrain <type> <id> <x> <y> <width> <height>"`
- Example: `"create terrain grass grass1 0 0 6 6"`
- Validates terrain type and numeric parameters

### 4. Store Actions (`packages/outside-client/src/store/actions.ts`)

**Added terrain action:**

- `CREATE_TERRAIN` action type with payload: id, terrainType, x, y, width, height
- `createTerrain()` action creator

### 5. Reducer (`packages/outside-client/src/store/reducers.ts`)

**Added CREATE_TERRAIN case:**

- Validates terrain bounds and dimensions
- Creates TerrainObject with current timestamp
- Adds to groundLayer using world utilities
- Updates position index for efficient lookups

**Updated MOVE_OBJECT case:**

- Added walkability check using `isWalkable()` before allowing movement
- Combined check: occupied by surface object OR not walkable

**Updated PLACE_OBJECT case:**

- Added walkability check before allowing placement
- Ensures bots can only be placed on walkable terrain

### 6. Terrain Renderer (`packages/outside-client/src/renderer/terrain.ts`)

**New file for terrain rendering:**

**Functions:**

- `createTerrainLayer()`: Create container with all terrain sprites
- `createTerrainSprite()`: Create sprite for single terrain object (solid color based on type)
- `updateTerrainLayer()`: Update terrain layer when terrain changes

**Terrain colors:**

- grass: green (0x00ff00)
- dirt: brown (0x8b4513)
- water: blue (0x0000ff)
- sand: beige (0xf5deb3)
- hole: black (0x000000)

**Rendering approach:**

- Terrains rendered in order of creation (oldest first, newest last)
- Pixi.js z-ordering ensures newest terrain appears on top
- Each terrain object rendered as full sprite covering its width/height

### 7. Renderer Integration (`packages/outside-client/src/renderer/renderer.ts`)

**Updated GameRenderer:**

- Added `terrainContainer` to render ground layer
- Added `previousGroundLayerSize` to track terrain changes
- Updated `setWorld()` to create terrain layer before surface layer
- Updated `update()` to always update terrain layer on world state changes

**Render order (z-index):**

1. Grid background (checkered pattern) - bottom
2. Terrain layer (ground layer) - middle
3. Surface layer (bots/objects) - top

### 8. Bot Sprite Update (`packages/outside-client/src/renderer/objects.ts`)

**Updated `createBotPlaceholder()`:**

- Changed from 16px square to 32px circle (diameter) centered in 64px tile
- Selected bot: white circle (#ffffff) with blue outline (#0000ff, 3px width)
- Unselected bots: white circle (#ffffff) with grey border (#808080, 2px width)
- Improved visibility and contrast on all terrain types

### 9. Command Handler (`packages/outside-client/src/commands/handlers.ts`)

**Added terrain command handling:**

- Handles `create terrain` commands by dispatching CREATE_TERRAIN action

### 10. Mock Command Feeder (`packages/outside-client/src/mock/commandFeeder.ts`)

**Updated to support initial terrain loading:**

- `getInitialTerrainCommands()`: Returns array of terrain commands to be processed immediately
- `feedBotCommands()`: Enqueues bot creation/placement commands for game loop
- Terrain commands separated from bot commands for synchronous processing

### 11. Grid Background Update (`packages/outside-client/src/renderer/grid.ts`)

**Updated checkered pattern:**

- Changed from grid-wide alternating tiles to 4x4 pattern inside each tile
- Each tile (64px) contains 16 small squares (16px each) in 4x4 pattern
- Uses same two colors (DARK_GREY and DARKER_GREY) for pattern
- More detailed visual texture while maintaining checkered aesthetic

### 12. Initial Terrain Loading (`packages/outside-client/src/main.ts`)

**Added synchronous terrain processing:**

- Process all terrain commands immediately before game loop starts
- Call `renderer.setWorld()` after terrain is loaded to render terrain instantly
- Bot commands still processed by game loop at 125ms intervals
- Ensures terrain appears instantly on game load

## Testing and Bug Fixes

During implementation, several issues were identified and fixed:

1. **Terrain not rendering**: Fixed terrain layer update logic to always update on world state changes, not just when count changes
2. **Missing water terrain**: Fixed by ensuring terrain layer updates correctly
3. **Invisible non-walkable areas**: Fixed by proper terrain rendering
4. **Selected bot color conflict**: Changed from green to white with blue outline to avoid conflict with grass
5. **Initial terrain loading**: Implemented synchronous processing so terrain appears instantly
6. **Bot visibility**: Added grey border to unselected bots for better contrast

## Files Created/Modified

### New Files

- `packages/outside-client/src/renderer/terrain.ts` - Terrain rendering functions
- `packages/outside-client/meatsack-testing.md` - Testing notes and bug tracking

### Modified Files

- `packages/outside-core/src/types.ts` - Added terrain types and GroundLayer
- `packages/outside-core/src/world.ts` - Added terrain utilities and walkability checks
- `packages/outside-client/src/commands/parser.ts` - Add terrain command parsing
- `packages/outside-client/src/commands/handlers.ts` - Handle terrain commands
- `packages/outside-client/src/store/actions.ts` - Add CREATE_TERRAIN action
- `packages/outside-client/src/store/reducers.ts` - Handle terrain creation and walkability checks
- `packages/outside-client/src/renderer/renderer.ts` - Integrate terrain layer
- `packages/outside-client/src/renderer/objects.ts` - Update bot sprite to circle with selection styling
- `packages/outside-client/src/renderer/grid.ts` - Update to 4x4 checkered pattern per tile
- `packages/outside-client/src/mock/commandFeeder.ts` - Separate terrain and bot commands
- `packages/outside-client/src/main.ts` - Process terrain commands synchronously
- `packages/outside-client/src/debug/overlay.ts` - Version tracking (0.1.8)

## Architecture Notes

### Terrain Stacking

Terrain objects can overlap and stack. The system tracks all terrain objects at each position using a position index (`terrainObjectsByPosition`). When determining walkability or rendering, the most recently created terrain (highest `createdAt` timestamp) is used as the "top-most" terrain.

### Walkability System

Walkability is determined by:

1. Position must be valid (within world bounds)
2. Position must have terrain (no terrain = not walkable)
3. Top-most terrain at position must be walkable (grass, dirt, sand = walkable; water, hole = not walkable)

This ensures bots can only move to and be placed on walkable terrain.

### Rendering Performance

Terrain layer is rebuilt on every world state change to ensure correctness. This could be optimized later by tracking which terrain objects changed and only updating those sprites, but for the current scale (20x10 grid), full rebuild is acceptable.

### Initial Loading

All terrain commands are processed synchronously before the game loop starts, ensuring terrain appears instantly when the game loads. This provides a better user experience and allows the game to start with a complete visual state.

## Future Enhancements

Potential improvements for future iterations:

- Optimize terrain rendering to only update changed terrain objects
- Add terrain editing capabilities
- Support for terrain animations (e.g., water movement)
- Terrain effects (e.g., damage over time in certain terrain)
- More terrain types
- Terrain transitions/blending at edges
- Terrain-based movement costs (e.g., sand is slower)
