# Pixel Art Visuals Implementation

Implemented pixel art visuals for the game, replacing geometric placeholders with sprite-based rendering.

## Motivation
To create an engaging pixel art aesthetic and ensure the game is properly displayed, replacing temporary geometric shapes with proper assets.

## Implementation Details

### Asset Loading
- `GameRenderer` now asynchronously loads sprite sheets during initialization:
  - Terrain: `/sprites/nature-pixels-v2/Tiles/Nature.png`
  - Bots: `/sprites/eris-esra-character-template-4/16x16/16x16 Idle-Sheet.png`

### Terrain Rendering
- Updated `createTerrainLayer` and `createTerrainSprite` in `outside-client/src/renderer/terrain.ts`.
- **Grass**: Uses tile at (1,1) (16x16 px) from the Nature sheet.
- **Water**: Uses tile at (4,1) (16x16 px) from the Nature sheet.
- **Tiling**: Uses `TilingSprite` to repeat textures for terrain objects larger than 1x1.
- **Scaling**: 16x16 tiles are scaled 4x to match the 64x64 grid size.
- **Fallback**: Other terrain types (dirt, sand, hole) continue to use solid color placeholders until assets are mapped.

### Bot Rendering
- Updated `createBotSprite` and `updateObjectsLayerWithIndex` in `outside-client/src/renderer/objects.ts`.
- **Sprite**: Uses the first frame (0,0) of the idle sheet.
- **Scaling**: Scaled 4x to match the 64x64 grid size.
- **Texture Swapping**: Implemented logic to upgrade placeholder sprites (circles) to textured sprites automatically once assets finish loading.

### Technical Notes
- Texture loading is asynchronous. The game starts with placeholders and hot-swaps to sprites when textures become available.
- `updateObjectsLayerWithIndex` detects texture mismatches to trigger the upgrade.

## Verification
- Validated that grass and water render with pixel art textures.
- Validated that bots render with the character sprite.
- Validated that the game handles the transition from loading state to rendered state without errors.
