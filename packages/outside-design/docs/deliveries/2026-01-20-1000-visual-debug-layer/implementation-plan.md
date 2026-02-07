# Visual Debug Layer Implementation Plan

## Executive Summary

This plan implements a comprehensive visual debug layer that renders between the ground (terrain) and surface (objects) layers. The layer uses vector graphics, geometric shapes, and color coding to provide enhanced game state visualization when debug mode is active.

## Technical Architecture

Based on codebase analysis, we'll leverage the existing debug infrastructure:

- **Integration Point**: Use existing `debugOverlayContainer` between terrain and objects layers
- **Toggle Mechanism**: Extend existing debug overlay visibility system
- **Rendering**: Use Pixi.js Graphics API with coordinate utilities already available
- **State Access**: Leverage Store state management for real-time data

## Phase 1: Core Infrastructure (Day 1)

### 1.1 Create VisualDebugLayer Class

**File**: `/packages/outside-client/src/renderer/visualDebugLayer.ts`

- Extend Pixi.js Container for layer management
- Implement initialization with graphics objects
- Add update methods for different visualization types
- Include color scheme constants for consistent theming

### 1.2 Integrate into GameRenderer

**File**: `/packages/outside-client/src/renderer/renderer.ts`

- Modify `updateBotDebugGrid()` to call new visual debug layer
- Add visual debug layer to debug overlay container
- Maintain backward compatibility with existing bot grid

### 1.3 Mouse Position Tracking

**Files**: `/packages/outside-client/src/main.ts`, `/packages/outside-client/src/renderer/visualDebugLayer.ts`

- Add global pointer event listener to Pixi.js app
- Convert screen coordinates to grid coordinates using existing utilities
- Track real-time mouse position for circle rendering

## Phase 2: Grid System Visualization (Day 2)

### 2.1 Dot Grid Implementation

**File**: `/packages/outside-client/src/renderer/visualDebugLayer.ts`

- Render dots at tile corners using world dimensions (20×10)
- Use `DISPLAY_TILE_SIZE = 64px` for proper spacing
- Implement as static graphics (update only on world size changes)

### 2.2 World Boundary Visualization

**File**: `/packages/outside-client/src/renderer/visualDebugLayer.ts`

- Draw rectangle around entire grid boundary
- Use contrasting color (red/orange) for visibility
- Calculate boundaries from world dimensions and tile size

## Phase 3: Interaction Elements (Day 3)

### 3.1 Mouse Position Circle

**File**: `/packages/outside-client/src/renderer/visualDebugLayer.ts`

- Render circle following continuous pixel mouse position
- Use semi-transparent fill with colored border (blue)
- Update on mouse movement events
- Handle viewport transformations correctly

### 3.2 Cursor Tile Square

**File**: `/packages/outside-client/src/renderer/visualDebugLayer.ts`

- Draw solid square around tile under cursor (snaps to grid)
- Use different color from mouse circle for distinction (yellow)
- Update in real-time with mouse movement
- Only render when cursor is within world bounds
- Provide dual visualization: continuous + grid-snapped

## Phase 4: Entity Visualization (Day 4)

### 4.1 Enhanced Bot Position Display

**File**: `/packages/outside-client/src/renderer/visualDebugLayer.ts`

- Fix existing green dotted squares that failed during testing
- Maintain both existing and enhanced bot visualizations
- Keep existing green color scheme for consistency
- Add bot type indicators or state information to enhanced version
- Scale appropriately with bot size
- Debug and resolve issues with current bot grid implementation

### 4.2 Color Coding System

**File**: `/packages/outside-client/src/renderer/visualDebugLayer.ts`

- Define consistent color palette:
  - Grid dots: Light gray (subtle)
  - World boundary: Orange (warning/limits)
  - Mouse circle: Blue (continuous position)
  - Cursor tile: Yellow (grid-snapped highlight)
  - Bot positions: Green (existing + enhanced, maintain)

## Implementation Details

### Coordinate System Integration

```typescript
// Use existing coordinate utilities
const gridX = Math.floor(pixelX / DISPLAY_TILE_SIZE);
const gridY = Math.floor(pixelY / DISPLAY_TILE_SIZE);
const pixelX = gridX * DISPLAY_TILE_SIZE + DISPLAY_TILE_SIZE / 2;
const pixelY = gridY * DISPLAY_TILE_SIZE + DISPLAY_TILE_SIZE / 2;
```

### Performance Optimizations

- Cache static elements (dot grid, world boundary)
- Only update dynamic elements on state/mouse changes
- Use efficient Pixi.js Graphics rendering
- Clear and redraw only when necessary
- Optimize for heavy usage (100+ bots):
  - Implement object pooling for graphics objects
  - Batch render operations where possible
  - Use dirty flags to avoid unnecessary redraws
  - Consider culling for off-screen debug elements

### Integration with Existing Systems

- Extend `debugOverlay.onVisibilityChange()` callback
- Maintain existing `updateBotDebugGrid()` method signature
- Use existing Store state access patterns
- Follow existing code style and TypeScript patterns

## Testing Strategy

### Unit Tests

- Test coordinate conversion accuracy
- Verify color scheme consistency
- Test boundary condition handling

### Integration Tests

- Verify debug toggle functionality
- Test layer ordering (ground → debug → surface)
- Verify performance with multiple bots

### Manual Testing

- Visual verification of all elements
- Test with different world sizes
- Verify debug mode toggle behavior
- Test viewport interactions

## Success Criteria

- [ ] All visual elements render correctly when debug mode is active
- [ ] Layer positioned correctly between ground and surface layers
- [ ] Mouse position tracking works with viewport transformations
- [ ] Bot position visualization enhanced but backward compatible
- [ ] Performance impact minimal when debug mode is off
- [ ] Color coding provides clear visual distinction

## Future Enhancements (Post-MVP)

- Additional entity types (items, obstacles)
- Path visualization for bot movements
- Configurable element visibility
- Export debug visualization for analysis
- Animation of debug elements for enhanced clarity

## Risk Mitigation

- **Performance**: Test with 100+ bots, implement object pooling and culling
- **Compatibility**: Maintain existing debug overlay behavior, fix broken bot grid
- **Usability**: Ensure debug elements don't obscure gameplay elements
- **Maintenance**: Keep code modular and well-documented
- **Complexity**: Balance dual mouse visualization (continuous + grid-snapped) without clutter
