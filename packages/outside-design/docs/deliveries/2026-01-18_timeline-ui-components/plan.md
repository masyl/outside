# Timeline UI Components Implementation Plan

## Overview

This deliverable implements a visual timeline bar component that provides users with visual feedback for timeline state and position. The timeline bar displays the current position in event history and allows interactive navigation through mouse clicks and dragging.

## User Requirements

### Core Features

- **Timeline bar component**: Thick green bar with black opaque padding
- **Position indicator**: Visual marker showing current position in history
- **Interactive navigation**: Click to jump, hold and drag for continuous positioning
- **Dynamic visibility**: Shows only when time-traveling, hides in normal PLAY mode
- **Responsive design**: Adapts to screen width changes
- **Mode-aware**: Visible in Local and Host modes, hidden in Client mode

### Visual Specifications

- **Height**: 24px green bar
- **Padding**: 8px black padding on all sides
- **Position**: 50px from bottom of screen
- **Colors**: Green bar (`#00ff00`), black padding (`0x000000`)
- **Aesthetic**: Pixelated, debug-oriented styling
- **Visual feedback**: Hand cursor on hover, brighter border when interactive

### Behavioral Requirements

- **Click interaction**: Single click jumps to position
- **Drag interaction**: Hold mouse and move for continuous positioning with throttling
- **Boundaries**: Position marker respects timeline boundaries (0 to totalSteps)
- **Debouncing**: Prevent CPU spam during drag operations
- **Edge cases**: Empty timeline shows blank world state, clicks outside bar ignored

## Technical Architecture

### Component Structure

```
TimelineBar (PIXI Container)
├── Background (PIXI Graphics) - Black padding
├── Bar (PIXI Graphics) - Green timeline bar
├── Position Marker (PIXI Graphics) - Current position indicator
└── Event Handlers - Mouse interaction logic
```

### Key Classes

#### TimelineBar (`src/ui/timelineBar.ts`)

```typescript
export class TimelineBar extends Container {
  constructor(app: Application, timelineManager: TimelineManager);

  // Core methods
  updatePosition(currentStep: number, totalSteps: number): void;
  setVisible(visible: boolean): void;
  onResize(): void;
  dispose(): void;

  // Private methods
  private createVisualElements(): void;
  private setupEventHandlers(): void;
  private handleMouseDown(event: FederatedPointerEvent): void;
  private handleMouseMove(event: FederatedPointerEvent): void;
  private handleMouseUp(): void;
  private handleMouseOver(): void;
  private handleMouseOut(): void;
  private calculateTargetStep(mouseX: number): number;
  private updateMarkerPosition(): void;
}
```

## Implementation Details

### File Structure

- **NEW**: `packages/outside-client/src/ui/timelineBar.ts` - Main timeline component
- **MODIFY**: `packages/outside-client/src/main.ts` - Integration and initialization
- **MODIFY**: `packages/outside-client/src/timeline/manager.ts` - Enhanced position callbacks

### Integration Points

#### TimelineManager Integration

- Subscribe to position changes via existing callback system
- Use `goToStep()` for navigation during user interaction
- Handle playback state changes for visibility control

#### Main.ts Integration

- Create TimelineBar instance in `initializeHostMode()`
- Add to PIXI stage at correct z-index
- Set up resize event handling
- Wire up TimelineManager callbacks

### State Management

#### Visibility Logic

```typescript
const shouldShowTimeline =
  (playbackState !== 'PLAYING' || (playbackState === 'PLAYING' && !isAtHead)) &&
  (isLocal || isHost);
```

#### Position Calculation

```typescript
const markerX = (currentStep / totalSteps) * barWidth;
const targetStep = Math.floor((mouseX / barWidth) * totalSteps);
const clampedStep = Math.max(0, Math.min(targetStep, totalSteps));
```

### Event Handling Strategy

#### Mouse Interaction

- **Mouse Down**: Start drag mode, set initial position
- **Mouse Move**: Update position with throttling (60fps cap)
- **Mouse Up**: End drag mode
- **Mouse Over/Out**: Update cursor and border brightness

#### Throttling Implementation

```typescript
private throttledUpdate = throttle((step: number) => {
  this.timelineManager.goToStep(step);
}, 16); // ~60fps
```

### Performance Considerations

- **Throttled updates**: Prevent CPU spam during drag operations
- **Efficient rendering**: Use Graphics objects instead of sprites
- **Memory management**: Proper cleanup in dispose() method
- **Event optimization**: Remove listeners when not visible

### Visual Design

#### Layout Specification

```
Screen Layout (from bottom):
┌─────────────────────────────────────────────┐
│  Black padding (8px height)                  │ ← 50px from bottom
│  ┌─────────────────────────────────────────┐ │
│  │ Green bar (24px height)                 │ │
│  │       │                                 │ │ ← Position marker (2px)
│  │                                         │ │
│  └─────────────────────────────────────────┘ │
│  Black padding (8px height)                  │
└─────────────────────────────────────────────┘
Full screen width
```

#### Color Scheme

- **Background padding**: `0x000000` (black, alpha 1.0)
- **Timeline bar**: `0x00ff00` (green, matching debug theme)
- **Position marker**: `0x000000` (black for contrast)
- **Hover border**: Slightly brighter green variant

#### Typography

- Use existing debug font stack for consistency
- Pixelated rendering to match game aesthetic

## Development Workflow

### Phase 1: Component Foundation

1. Create `TimelineBar` class with basic PIXI structure
2. Implement visual elements (background, bar, marker)
3. Add basic positioning and visibility methods
4. Test static rendering with mock data

### Phase 2: Timeline Integration

1. Integrate with TimelineManager position callbacks
2. Implement automatic visibility based on playback state
3. Add resize handling for responsive behavior
4. Test with real timeline data and state changes

### Phase 3: Interactivity

1. Implement mouse event handlers
2. Add click-to-position functionality
3. Implement drag-to-scroll with throttling
4. Add visual feedback (hover states, cursor changes)

### Phase 4: Polish & Testing

1. Refine visual styling and alignment
2. Test edge cases (empty timeline, boundary conditions)
3. Performance optimization
4. Integration testing with full timeline system

## Testing Strategy

### Unit Tests

- Position calculation accuracy
- Boundary handling (0, totalSteps limits)
- Visibility state transitions
- Event handler attachment/detachment

### Integration Tests

- TimelineManager callback integration
- Playback state synchronization
- Window resize responsiveness
- Mode-specific behavior (Local/Host/Client)

### User Experience Tests

- Click-to-position accuracy
- Drag responsiveness and smoothness
- Visual feedback effectiveness
- Performance under continuous interaction

## Dependencies & Prerequisites

### Completed Dependencies

- ✅ Timeline Engine Core (provides navigation)
- ✅ Playback Controls & Game Loop Integration (provides state)
- ✅ DebugOverlay (provides styling patterns)
- ✅ TimelineManager (provides data and callbacks)

### Technical Requirements

- PIXI.js v8.7.3 for rendering
- @pixi/ui v2.3.2 for UI components
- TypeScript for type safety
- Event throttling utility

## Success Criteria

### Functional Requirements

- [ ] Timeline bar renders correctly in all modes
- [ ] Position marker accurately reflects timeline position
- [ ] Click-to-position navigation works accurately
- [ ] Drag-to-scroll responds smoothly with throttling
- [ ] Visibility automatically shows/hides based on state
- [ ] Responsive to window resize events
- [ ] Respects timeline boundaries

### Quality Requirements

- [ ] No performance impact on game loop
- [ ] Memory leaks prevented (proper cleanup)
- [ ] Consistent with existing debug aesthetic
- [ ] Accessible and intuitive interaction model
- [ ] Robust edge case handling

### Integration Requirements

- [ ] Seamless TimelineManager integration
- [ ] Correct playback state synchronization
- [ ] Mode-specific visibility (Local/Host vs Client)
- [ ] No conflicts with existing UI components

## Timeline Series Context

This deliverable provides the visual interface for timeline features, making timeline state visible and interactive. It establishes the visual language (green timeline bar) that will be the foundation for future timeline enhancements and client synchronization.

The timeline bar serves as the primary debugging interface for developers working with timeline features, providing immediate visual feedback and intuitive navigation capabilities for time-travel debugging workflows.

## Next Steps

After this deliverable, the timeline system will progress to:

- **Timeline Keystrokes Integration**: Enhanced keyboard controls
- **Timeline Network Synchronization**: Client-side timeline bars

This UI component will be the foundation that users interact with when debugging timeline-related features and will serve as the template for future timeline visualizations.
