# Work Summary

Successfully implemented smooth bot movement animations with pixel-based interpolation. The animation system operates independently from the 500ms command loop, allowing sprites to move smoothly between grid positions at browser FPS. The implementation required replacing motion.dev's `animate()` function (which wasn't calling progress callbacks) with a manual `requestAnimationFrame` loop using cubic ease-in-out easing.

**Key Achievements:**

- Smooth pixel-based sprite animations that interpolate between grid positions
- AnimationController that detects position changes and triggers animations
- Renderer updated to preserve sprites during state updates (no position resets)
- Manual animation loop with cubic easing for smooth movement
- Animation interruption handling (cancels previous animation when new move starts)

**Notable Challenges & Solutions:**

- **Issue**: motion.dev's `animate()` function wasn't calling the progress callback
- **Solution**: Implemented manual `requestAnimationFrame` loop with `performance.now()` timing and cubic ease-in-out easing
- **Issue**: Renderer was recreating sprites and resetting positions on each update
- **Solution**: Updated renderer to preserve existing sprites and only create/remove as needed, letting AnimationController handle positioning

## Commit Reference

- **Commit**: `402af9c`
- **GitHub**: https://github.com/masyl/outside/commit/402af9c
- **Description**: Fix smooth animations using requestAnimationFrame

---

# Smooth Animation Plan for Game Client

## Goal

Add **smooth, eased animations** for bot movement, while keeping the **500ms command/game loop** and **animation loop** separate. The simulation state advances in discrete 500ms steps; animations interpolate visuals between states at whatever FPS the browser provides.

## High-Level Approach

- **State loop (already exists)**: Every 500ms, dequeue and apply one command → updates `WorldState`.
- **Animation layer (implemented)**: Listens to state changes, detects object moves, and uses `requestAnimationFrame` to tween sprite positions between their old and new grid coordinates.
- **Renderer** remains a thin view: sprites are updated by the animation layer; state stays the single source of truth.

## Design Decisions

- **State timing**: World state is updated **at the start of the 500ms step** (as it is now). The animation layer reads both **previous** and **new** positions to drive a smooth transition.
- **Animation duration**: **500ms per move** (matches the step), with cubic ease-in-out easing
- **Visual ownership**: `GameRenderer` owns Pixi containers/sprites; `AnimationController` gets references to sprites and manipulates `sprite.x/sprite.y` in pixel space.
- **Interruption behavior**: If a new move for the same bot starts while one is in progress, we **cancel** the previous animation and start a new one from the current visual position to the new target.

## Implementation Steps

### 1. Extend Renderer to Track Sprites by ID

**Files updated:**

- `packages/outside-client/src/renderer/objects.ts`
- `packages/outside-client/src/renderer/renderer.ts`

**Changes implemented:**

- Created `SpriteIndex` type: `Map<string, Sprite>`
- Added `createObjectsLayerWithIndex()` function that returns `{ container, spriteIndex }`
- Added `updateObjectsLayerWithIndex()` that preserves existing sprites and only creates/removes as needed
- In `renderer.ts`:
  - Added `private spriteIndex: SpriteIndex = new Map()`
  - Updated `setWorld()` and `update()` to use new helpers
  - Added `getSpriteForObject(id: string): Sprite | undefined` getter

**Key implementation detail**: The renderer no longer resets sprite positions on update - it preserves existing sprites and lets AnimationController handle positioning.

### 2. Animation Controller

**File created:**

- `packages/outside-client/src/game/animationController.ts`

**Implementation:**

- Subscribes to store state changes
- Maintains `previousState: WorldState | null` for diffing
- Maintains `activeAnimations: Map<string, CancelAnimation>` to track and cancel animations
- Detects position changes by comparing previous and current state
- For each moved bot:
  - Gets sprite via `GameRenderer.getSpriteForObject(id)`
  - Cancels any existing animation for that bot
  - Starts new animation from sprite's current pixel position to target grid position

**Algorithm (on state change):**

- If `previousState` is `null`, set it and return (first state)
- For each bot `id` in `currentState.objects`:
  - If it exists in `previousState.objects` and positions differ, trigger animation
- Update `previousState` to `currentState` after processing

### 3. Animation Implementation

**File updated:**

- `packages/outside-client/src/game/animations.ts`

**Implementation:**

- **Replaced motion.dev's `animate()`** with manual `requestAnimationFrame` loop
- Uses `performance.now()` for precise timing
- Implements cubic ease-in-out easing manually: `easeInOutCubic(t)`
- Interpolates pixel positions frame-by-frame
- Calls `onUpdate` callback every frame with current pixel coordinates
- Calls `onComplete` when animation finishes

**Why manual implementation?**

- motion.dev's `animate()` function wasn't calling the progress callback
- Manual `requestAnimationFrame` gives full control and works reliably
- Cubic easing implemented directly for smooth movement

### 4. Integrate AnimationController into App Bootstrap

**File updated:**

- `packages/outside-client/src/main.ts`

**Changes:**

- Created `AnimationController` after `GameRenderer` and before `GameLoop`
- Order of initialization:
  1. Create `Store`
  2. Create `GameRenderer`
  3. Create `AnimationController` (subscribes to store)
  4. Create `CommandQueue`, `GameLoop`
  5. Feed initial commands and start game loop

**Note**: AnimationController subscribes to store independently, so no changes to GameLoop were needed.

### 5. Keep Game Loop and Animation Loop Separate

**Files involved:**

- `packages/outside-client/src/game/loop.ts`
- `packages/outside-client/src/game/animations.ts`
- `packages/outside-client/src/game/animationController.ts`

**Implementation:**

- `GameLoop` continues to run command/state loop every 500ms
- `GameLoop` uses `requestAnimationFrame` for engine-level per-frame work (minimal)
- `AnimationController` operates independently at browser FPS
- Animations react to changes in `WorldState` published by the store
- No coupling between 500ms command loop and animation loop

### 6. Debug Logging

**Added during implementation:**

- Extensive console logging in AnimationController to trace animation flow
- Logs position changes, animation starts, frame updates, and completion
- Helps verify animations are working correctly

## Technical Details

- **Animation duration**: 500ms per move (matches game loop step)
- **Easing**: Cubic ease-in-out (equivalent to CSS `cubic-bezier(0.4, 0, 0.2, 1)`)
- **Frame updates**: Every `requestAnimationFrame` cycle (typically 60fps)
- **Pixel interpolation**: Sprites can be at any pixel position between grid tiles
- **Animation cancellation**: Previous animations are cancelled when new move starts
- **Position tracking**: Uses sprite's current pixel position as animation start point

## File Structure

```
packages/outside-client/src/
├── game/
│   ├── animationController.ts (new)
│   ├── animations.ts (updated - manual requestAnimationFrame)
│   └── loop.ts (unchanged)
├── renderer/
│   ├── renderer.ts (updated - sprite index)
│   ├── objects.ts (updated - preserve sprites)
│   └── grid.ts (unchanged)
└── main.ts (updated - AnimationController initialization)
```

## Notes

- motion.dev's `animate()` function was not used - manual implementation was required
- Renderer was updated to preserve sprites during state updates
- Animation system is completely decoupled from command loop
- Sprites move smoothly in pixel space, allowing sub-grid positioning
- Debug logging can be removed in production if desired
