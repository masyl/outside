# Plan: Smooth Camera Follow for Selected Entity

## Requirements

1. Change the POV (point of view) to follow the entity that is currently selected.
2. The movement between positions should be animated/smooth.
3. Use the included Motion lib.
4. To make a smooth transition when moving from one POV to another, decouple the actual target POV and the screen offset that is being animated.
5. Don't stop or interrupt the animation between target location changes. Just update the current animation.
6. When swapping the selected Bots, also animate a smooth change.

## Implementation Details

### GameRenderer Updates

- **Camera State**: Introduce `cameraPos` object to track the current animated camera position (Grid Coordinates).
- **Motion Integration**: Use `animate()` from `motion` library to smoothly transition `cameraPos` to the target.
- **Target Calculation**:
  - If a bot is selected: Target = Bot's center position (`x + 0.5`, `y + 0.5`).
  - If no bot is selected: Target = `(0, 0)`.
- **Viewport Transformation**:
  - Implement `updateViewportTransform()` to calculate the `rootContainer` position based on `cameraPos`.
  - Run this transformation in the animation loop (60fps) to ensure smoothness.
  - Center the view: `Offset = ScreenCenter - CameraDisplayPos`.
- **Event Handling**:
  - Call `updateCameraTarget()` on `setWorld`, `update` (world state change), and `updateSelection`.
  - Ensure `resize` handler updates the transform.

### Technical Approach

- **Decoupling**: The `cameraPos` is independent of the bot's logic position. It "chases" the target using spring physics.
- **Spring Physics**: Use `stiffness: 200`, `damping: 25` for a responsive yet smooth follow behavior.
- **Continuous Updates**: By updating the viewport in `startSpriteAnimationLoop`, we ensure the camera movement is frame-perfect even if the game loop ticks at a lower rate (125ms).
