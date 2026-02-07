---
Title: Smooth Camera Follow for Selected Entity
DeliveryDate: 2026-01-22
Summary: Implements a smooth camera tracking system using the motion library to follow the selected bot, providing fluid viewport transitions when the bot moves or selection changes.
Status: DONE
Branch: improved-level-boundaries
Commit: 2c2ed24
---

# Smooth Camera Follow for Selected Entity

## Summary

This delivery implements a smooth camera tracking system that follows the currently selected bot. It uses the `motion` library to animate the viewport position, providing a fluid experience when the bot moves or when the selection changes.

## Changes

### Client (`outside-client`)

- **`src/renderer/renderer.ts`**:
  - Replaced static `centerViewport` logic with a dynamic `updateViewportTransform` system.
  - Added `cameraPos` state to track the visual center of the screen.
  - Integrated `motion` library's `animate` function with spring physics (`stiffness: 200`, `damping: 25`) to smoothly transition the camera to its target.
  - Updated the render loop to apply camera transformations every frame.
  - Implemented `updateCameraTarget` to determine the desired POV:
    - **Selected Bot**: Centers on the bot's tile (`x + 0.5`, `y + 0.5`).
    - **No Selection**: Centers on the world origin `(0, 0)`.

## Verification

- **Manual Verification**:
  - Select a bot: Camera smoothly pans to center the bot.
  - Move the bot: Camera follows the bot smoothly.
  - Switch selection: Camera pans directly to the new bot.
  - Deselect: Camera returns to `(0, 0)`.
  - Resize window: Viewport stays centered on the current camera position.
  - Zoom: Camera position remains consistent.
- **Automated Tests**:
  - `pnpm --filter @outside/client test` run.
  - Note: `store/persistence.test.ts` has known timeouts (unrelated to this change).
