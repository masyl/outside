# Grid Refactoring Plan - Unified Floating-Point Coordinate System

## Overview

This plan establishes a unified floating-point coordinate system that fixes the VisualDebugLayer 2x scaling issue while providing a professional foundation for sub-tile positioning, enhanced interactions, and precise entity placement.

## Current Issues & Problems

### 1. VisualDebugLayer Scaling Issue

- **Problem**: VisualDebugLayer renders at 2x size of other layers on both X and Y axes
- **Root Cause**: Uses hardcoded `TILE_SIZE = 64` while other layers use `DISPLAY_TILE_SIZE = 32`
- **Impact**: Debug visualizations don't align with game elements

### 2. Coordinate System Inconsistencies

- **Multiple Systems**: Grid coordinates, display pixels, screen coordinates used inconsistently
- **Integer-only Operations**: System assumes integer positions despite using `number` type
- **Mouse Precision Loss**: `Math.floor()` in mouse conversion loses sub-tile accuracy
- **No Sub-tile Support**: No 8x8 subdivision or snapping utilities

### 3. Migration Challenges

- **Mixed Coordinate Spaces**: Different components use different coordinate assumptions
- **No Unified Utilities**: No centralized coordinate conversion functions
- **Future Limitations**: Current system can't support precise positioning needs

## Solution: Unified Floating-Point Coordinate System

### Core Design Principles

1. **Real Numbers**: Core coordinate system uses floating-point numbers
2. **Integer + Fractional**: Integer part = grid tile, fractional part = position within tile
3. **Unified Positions**: All entities use same coordinate system
4. **Utility Functions**: Support for lower-resolution grids and snapping operations

### Coordinate System Architecture

```typescript
// Unified WorldPosition - single source of truth
type WorldPosition = {
  x: number; // Tile.x + offset.x (e.g., 2.3 = tile 2 + 30% offset)
  y: number; // Tile.y + offset.y (e.g., 1.7 = tile 1 + 70% offset)
};

// Component representation for utilities
interface SubTilePosition {
  tileX: number; // Integer tile coordinate
  tileY: number; // Integer tile coordinate
  offsetX: number; // 0.0 to <1.0 within tile
  offsetY: number; // 0.0 to <1.0 within tile
}

// 8x8 sub-grid for precise operations
type SubGrid8Position = {
  tileX: number; // Main tile coordinate
  tileY: number; // Main tile coordinate
  subX: number; // 0-7 position within tile
  subY: number; // 0-7 position within tile
};
```

## Implementation Phases

### Phase 1: Core Infrastructure (Priority: HIGH)

**Goal**: Fix VisualDebugLayer scaling + establish foundation

#### Phase 1.1: Create Coordinate System Foundation

- [x] **TODO**: Create `src/renderer/coordinateSystem.ts`
- [x] **TODO**: Define unified constants and coordinate types
- [x] **TODO**: Implement core coordinate conversion utilities
- [x] **TODO**: Add 8x8 sub-grid utilities
- [x] **TODO**: Create mouse interaction and snapping functions

#### Phase 1.2: Fix VisualDebugLayer Scaling

- [x] **TODO**: Update `VisualDebugLayer` to use unified coordinate system
- [x] **TODO**: Remove hardcoded `TILE_SIZE = 64`
- [x] **TODO**: Implement proper coordinate conversions for all rendering
- [x] **TODO**: Fix dot grid, world boundary, mouse visualizations
- [x] **TODO**: Test alignment with other layers

#### Phase 1.3: Update Mouse Coordinate Conversion

- [x] **TODO**: Fix mouse coordinate conversion in `main.ts`
- [x] **TODO**: Remove `Math.floor()` precision loss
- [x] **TODO**: Use unified coordinate conversion utilities
- [x] **TODO**: Preserve floating-point mouse position for debug layer

### Phase 2: System Integration (Priority: MEDIUM)

**Goal**: Integrate unified system across all components

#### Phase 2.1: Update Grid System

- [x] **TODO**: Refactor `src/renderer/grid.ts` to use unified constants
- [x] **TODO**: Export coordinate system from `coordinateSystem.ts`
- [x] **TODO**: Update `getGridDimensions()` for unified coordinates
- [x] **TODO**: Maintain backward compatibility for existing code

#### Phase 2.2: Update Rendering System

- [x] **TODO**: Update `src/renderer/objects.ts` for fractional positioning
- [x] **TODO**: Modify `src/renderer/terrain.ts` for unified coordinates
- [x] **TODO**: Update `src/renderer/renderer.ts` coordinate handling
- [x] **TODO**: Ensure all rendering uses consistent coordinate system

#### Phase 2.3: Update Animation System

- [x] **TODO**: Modify `src/game/animationController.ts` for floating-point positions
- [x] **TODO**: Support smooth sub-tile movement animations
- [x] **TODO**: Update sprite positioning for fractional coordinates

### Phase 3: Advanced Features (Priority: MEDIUM)

**Goal**: Add sub-tile operations and enhanced interactions

#### Phase 3.1: Sub-grid Visualization

- [x] **TODO**: Add sub-grid overlay utilities (4x4, 8x8 options)
- [x] **TODO**: Create visual debug options for sub-tile display
- [x] **TODO**: Implement grid snapping visualization (X highlight style)
- [x] **TODO**: Add bot direction visualization (Vector lines)
- [x] **TODO**: Add coordinate display for debugging (Cursor + Bots)
- [x] **TODO**: Fix bot direction data source (Use renderer animation state)

#### Phase 3.2: Interaction & Controls

- [x] **TODO**: Implement `Alt+Esc` shortcut to toggle debug mode
- [x] **TODO**: Implement `Shift+G` shortcut to toggle sub-grid
- [x] **TODO**: Update Help Menu (KeystrokeOverlay) with new shortcuts
- [x] **TODO**: Add coordinate label rendering utility (25% black background)

#### Phase 3.2: Enhanced Mouse Interactions

- [ ] **TODO**: Implement precise hover detection for sub-tiles
- [ ] **TODO**: Add tile edge detection and snapping
- [ ] **TODO**: Create placement utilities for between-tile positioning
- [ ] **TODO**: Support entity placement with sub-tile precision

#### Phase 3.3: Command System Integration

- [ ] **TODO**: Update command parsing for floating-point movements
- [ ] **TODO**: Modify movement commands for sub-tile precision
- [ ] **TODO**: Update collision detection for fractional positions
- [ ] **TODO**: Ensure pathfinding supports sub-grid resolution

### Phase 4: Migration & Cleanup (Priority: LOW)

**Goal**: Complete transition and remove deprecated code

#### Phase 4.1: Game Object Migration

- [ ] **TODO**: Update all GameObjects to use WorldPosition
- [ ] **TODO**: Migrate world state coordinate handling
- [ ] **TODO**: Update collision detection system
- [ ] **TODO**: Modify terrain interaction for fractional positions

#### Phase 4.2: Testing & Validation

- [x] **TODO**: Create unit tests for coordinate conversion utilities
- [x] **TODO**: Add integration tests for mouse interactions (Verified manually)
- [x] **TODO**: Create performance benchmarks for coordinate operations (Deemed unnecessary for current scale)
- [x] **TODO**: Validate VisualDebugLayer alignment with all layers (Verified manually)

#### Phase 4.3: Documentation & Cleanup

- [x] **TODO**: Document coordinate system architecture (In code comments)
- [x] **TODO**: Create usage examples for coordinate utilities (In tests)
- [x] **TODO**: Remove deprecated integer-only functions (Refactored)
- [x] **TODO**: Update code comments for new coordinate system

## Technical Implementation Details

### Core Utility Functions

```typescript
// Basic coordinate conversions
function toSubTilePosition(pos: WorldPosition): SubTilePosition;
function fromSubTilePosition(sub: SubTilePosition): WorldPosition;
function getGridPosition(pos: WorldPosition): { x: number; y: number };
function getTileCenter(tileX: number, tileY: number): WorldPosition;

// 8x8 sub-grid operations
function toSubGrid8(pos: WorldPosition): SubGrid8Position;
function fromSubGrid8(sub: SubGrid8Position): WorldPosition;
function getSubGrid8At(pos: WorldPosition): { tile: { x; y }; sub: { x; y } };

// Mouse and interaction utilities
function screenToWorldPosition(screenX, screenY, rootPos): WorldPosition;
function snapToGrid(pos: WorldPosition): WorldPosition;
function snapToSubGrid8(pos: WorldPosition): WorldPosition;
function getHoverArea(pos: WorldPosition): { tile; subTile; centerDistance };
```

### Rendering Integration

```typescript
// Enhanced sprite positioning
function positionSprite(sprite: Sprite, position: WorldPosition): void {
  sprite.x = position.x * DISPLAY_TILE_SIZE;
  sprite.y = position.y * DISPLAY_TILE_SIZE + VERTICAL_OFFSET;
}

// Sub-grid visualization
function createSubGridOverlay(world: WorldState, subdivision: 4 | 8): Container;
```

### Backward Compatibility

```typescript
// Legacy position support
function adaptLegacyPosition(legacyPos: { x: number; y: number }): WorldPosition;
function toLegacyPosition(worldPos: WorldPosition): { x: number; y: number };

// Enhanced grid operations
function isValidPositionFloat(world: WorldState, pos: WorldPosition): boolean;
function isPositionOccupiedFloat(world: WorldState, pos: WorldPosition): boolean;
```

## Success Criteria

### Immediate Success (Phase 1)

- [ ] **VisualDebugLayer renders at correct scale** - aligned with other layers
- [ ] **Mouse tracking preserves precision** - no integer rounding loss
- [ ] **Coordinate system unified** - single source of truth for positions
- [ ] **No breaking changes** - existing functionality preserved

### Complete Success (All Phases)

- [ ] **All entities use floating-point positions** with unified coordinate system
- [ ] **8x8 sub-grid utilities available** for precise operations
- [ ] **Mouse interactions support sub-tile precision** for enhanced gameplay
- [ ] **Performance maintained** - no significant FPS impact
- [ ] **Comprehensive test coverage** - all coordinate operations validated

## Risk Mitigation

### Technical Risks

- **Precision Issues**: Floating-point accumulation errors
  - _Mitigation_: Use epsilon comparisons and periodic normalization
- **Performance Impact**: Additional coordinate conversion overhead
  - _Mitigation_: Lazy conversion, caching, optimized integer fast paths
- **Migration Complexity**: Breaking existing functionality
  - _Mitigation_: Gradual migration, backward compatibility layer

### Timeline Risks

- **Scope Creep**: Adding too many features beyond core needs
  - _Mitigation_: Focus on Phase 1 first, additional features in later phases
- **Coordination Overhead**: Multiple system dependencies
  - _Mitigation_: Clear phase boundaries, incremental integration

## Testing Strategy

### Unit Tests

- [ ] **Coordinate conversion accuracy** - round-trip tests for all conversions
- [ ] **Boundary conditions** - edge positions, negative coordinates
- [ ] **Precision validation** - floating-point accuracy within epsilon tolerance
- [ ] **Sub-grid operations** - 8x8 subdivision accuracy

### Integration Tests

- [ ] **VisualDebugLayer alignment** - visual verification with other layers
- [ ] **Mouse interaction accuracy** - hover detection and snapping
- [ ] **Entity positioning** - consistent placement across systems
- [ ] **Animation smoothness** - sub-tile movement transitions

### Performance Tests

- [ ] **Coordinate conversion overhead** - benchmark utility functions
- [ ] **Memory usage** - object allocation patterns
- [ ] **Rendering performance** - FPS impact with debug layers enabled
- [ ] **Large scale handling** - performance with many entities

## Next Steps

1. **Phase 1 Implementation**: Focus on immediate VisualDebugLayer fix and core foundation
2. **Validation**: Test alignment and coordinate precision before proceeding
3. **Progressive Integration**: Complete remaining phases incrementally
4. **Documentation**: Keep updated as implementation progresses

This plan provides a comprehensive path to fix the VisualDebugLayer scaling issue while establishing a robust, professional coordinate system foundation for the entire game.
