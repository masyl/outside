# Timeline Storybook Integration Plan

## Part 1: Storybook Integration

### Current State Analysis

The Timeline component (`outside-client/src/components/Timeline.tsx`) is a Pixi-React component that:

- Uses `useApplication` hook to access the Pixi Application instance
- Renders using `<container>` and `<graphics>` JSX elements (extended via `pixi-setup.ts`)
- Requires a `TimelineManager` instance as a prop
- Currently uses direct window event listeners for drag handling (lines 100-106)

Storybook setup (`outside-storybook/`) already has:

- `PixiContainerWrapper` for creating Pixi Application instances
- `StoreWrapper` for creating Store instances
- Path aliases configured for `@outside/core` and `@outside/client`
- React + Storybook 10.2.0-beta.0 with Vite

### Implementation Steps

#### 1. Create Mock TimelineManager for Storybook

**File**: `outside-storybook/src/components/wrappers/TimelineManagerWrapper.tsx`

Create a mock TimelineManager that:

- Implements the same interface as the real `TimelineManager`
- Uses in-memory state for events (similar to `MockEventLogger` in `manager.test.ts`)
- Provides controllable state for Storybook controls
- Supports all TimelineManager methods: `getState()`, `getPlaybackState()`, `goToStep()`, `onStateChange()`, `onPositionChange()`

Key implementation details:

- Store events in an array (mimicking EventLogger)
- Track current step and playback state
- Fire callbacks when state/position changes
- Support Storybook controls for `currentStep`, `totalSteps`, and `playbackState`

#### 2. Create Timeline Storybook Wrapper

**File**: `outside-storybook/src/components/wrappers/TimelineStoryWrapper.tsx`

Create a wrapper component that:

- Uses `PixiContainerWrapper` to provide Pixi Application context
- Creates a mock TimelineManager instance
- Wraps the Timeline component with proper Pixi-React Application context
- Handles Storybook-specific props (width, height, initial state)

Implementation pattern:

```tsx
<PixiContainerWrapper width={800} height={600}>
  {(app) => (
    <Application.Provider value={app}>
      <Timeline timelineManager={mockTimelineManager} />
    </Application.Provider>
  )}
</PixiContainerWrapper>
```

**Note**: Need to verify if `Application.Provider` exists in `@pixi/react` or if we need to use a different pattern. Alternative: Use the `useApplication` hook pattern by ensuring the Timeline is rendered within a proper Application context.

#### 3. Create Storybook Story

**File**: `outside-storybook/src/stories/Timeline.stories.tsx`

Create Storybook stories with:

- Default story showing timeline with sample data
- Controls for:
  - `currentStep` (0 to totalSteps-1)
  - `totalSteps` (number of timeline events)
  - `playbackState` (PLAYING, PAUSED, TRAVELING)
  - Canvas dimensions
- Multiple variants:
  - Empty timeline (0 steps)
  - Small timeline (5 steps)
  - Medium timeline (20 steps)
  - Large timeline (100 steps)
  - Full width/height canvas

#### 4. Setup Pixi-React in Storybook

**File**: `outside-storybook/src/main.tsx` (or create if needed)

Ensure `setupPixiReact()` is called to extend React with Pixi components:

- Import and call `setupPixiReact()` from `@outside/client/src/pixi-setup`
- This enables `<container>`, `<graphics>`, etc. in JSX

**Alternative**: If Storybook has a preview setup file, add it there.

#### 5. Verify Dependencies

Ensure `outside-storybook/package.json` includes:

- `@pixi/react` (check if already included via `@outside/client` workspace dependency)
- All necessary Pixi.js types

### Files to Create/Modify

1. **New**: `outside-storybook/src/components/wrappers/TimelineManagerWrapper.tsx`

   - Mock TimelineManager implementation

2. **New**: `outside-storybook/src/components/wrappers/TimelineStoryWrapper.tsx`

   - Wrapper combining PixiContainerWrapper + Timeline

3. **New**: `outside-storybook/src/stories/Timeline.stories.tsx`

   - Storybook stories with controls

4. **Modify**: `outside-storybook/src/main.tsx` (or create if needed)

   - Call `setupPixiReact()` on initialization

5. **Verify**: `outside-storybook/.storybook/main.ts`

   - Ensure proper configuration for React + Vite

## Part 2: PixiUI Slider Recommendation

### Current Implementation Issues

The Timeline component currently uses:

- Direct Pixi pointer events (`onpointerdown`, `onpointermove`, `onpointerup`)
- Window-level event listener for `pointerup` to catch releases outside component (lines 100-106)
- Manual calculation of target step from global coordinates
- Manual drag state management

**Problems**:

- Window event listeners can leak if component unmounts during drag
- Manual coordinate calculations are error-prone
- No built-in drag handling abstraction
- Potential issues with multiple pointer devices

### PixiUI Slider Solution

Based on [PixiUI Slider documentation](https://pixijs.io/ui/Slider.html), the `Slider` component provides:

- Built-in drag handling with proper event management
- `onChange` callback (fires when drag ends)
- `onUpdate` callback (fires during drag)
- Automatic value clamping and step handling
- Proper cleanup of event listeners

### Recommended Refactoring Approach

#### Option A: Replace Graphics with Slider (Recommended)

1. **Create Slider Visual Components**:

   - Use Graphics to create track (background bar)
   - Use Graphics to create fill (progress indicator)
   - Use Graphics to create handle (marker)

2. **Integrate PixiUI Slider**:
   ```typescript
   import { Slider } from '@pixi/ui';
   
   const slider = new Slider({
     bg: trackGraphics,      // Background track
     fill: fillGraphics,      // Progress fill
     slider: handleGraphics,  // Draggable handle
     min: 0,
     max: totalSteps - 1,
     value: currentStep,
   });
   
   slider.onUpdate.connect((value) => {
     timelineManager.goToStep(Math.floor(value));
   });
   ```

3. **Benefits**:

   - Automatic drag handling (no window listeners needed)
   - Proper event cleanup
   - Built-in value clamping
   - Better touch/multi-pointer support

#### Option B: Hybrid Approach

Keep Graphics for rendering but use Slider's event handling:

- Create invisible Slider overlay
- Use Slider's drag events to update timeline
- Keep custom Graphics rendering for visuals

### Implementation Considerations

1. **Slider Integration with Pixi-React**:

   - PixiUI components are not React components
   - Need to use `useEffect` to create/manage Slider instance
   - Attach Slider to a Container ref

2. **Coordinate System**:

   - Slider works in local coordinates
   - Timeline uses screen-relative positioning
   - May need to adjust Slider bounds to match Timeline layout

3. **Visual Customization**:

   - Slider expects Graphics/Sprite for track/fill/handle
   - Can reuse existing Graphics drawing logic
   - Need to convert Graphics to Slider-compatible format

4. **State Synchronization**:

   - Slider value should sync with TimelineManager state
   - Handle external step changes (keyboard navigation)
   - Prevent feedback loops between Slider and TimelineManager

### Recommended Next Steps

1. **Research Phase**:

   - Review PixiUI Slider examples in [official documentation](https://pixijs.io/ui/)
   - Check if Slider can be used with Pixi-React patterns
   - Verify coordinate system compatibility

2. **Prototype**:

   - Create a minimal Timeline variant using Slider
   - Test drag behavior and event handling
   - Compare with current implementation

3. **Migration**:

   - Gradually replace window listeners with Slider
   - Maintain visual consistency
   - Ensure all edge cases are handled

### Documentation References

- [PixiUI Slider API](https://pixijs.io/ui/Slider.html)
- [PixiUI SliderBase](https://pixijs.io/ui/SliderBase.html)
- [Pixi-React Documentation](https://pixijs.io/pixi-react/) (verify latest patterns)
- Current Timeline implementation: `outside-client/src/components/Timeline.tsx`

## Technical Notes

### Pixi-React Application Context

The Timeline uses `useApplication()` hook which requires:

- Component to be rendered within `<Application>` from `@pixi/react`
- Or Application instance provided via context

For Storybook, we need to ensure Timeline is rendered within proper Application context. The `PixiContainerWrapper` creates an Application but doesn't provide React context. We may need to:

- Create Application using `@pixi/react`'s `<Application>` component
- Or manually provide Application via context (if supported)
- Or refactor Timeline to accept Application as prop (less ideal)

### Testing the Storybook Story

After implementation:

1. Run `pnpm --filter outside-storybook storybook`
2. Navigate to Timeline story
3. Test drag interactions
4. Verify controls update timeline state
5. Test different canvas sizes

### Context7 Documentation

While Context7 is configured in `opencode.jsonc`, for this task:

- Reference official PixiUI documentation (https://pixijs.io/ui/)
- Reference Pixi-React patterns from existing codebase
- Use web search for latest PixiUI v2.3.2 API if needed
