# Cursor Tracking in Negative Coordinates

## Overview

Enable visual debug cursor tracking across negative world coordinates after the coordinate system change to a (0, 0) center.

## Plan

### 1. Audit current cursor tracking

- Confirm the cursor is tracked via `GameRenderer.updateMousePosition()` and rendered in `visualDebugLayer.ts`.
- Identify the negative coordinate guard in `renderMouseVisualizations()`.

### 2. Update cursor state handling

- Change `mousePos` from `WorldPosition` to `WorldPosition | null`.
- Initialize `mousePos` to `null` instead of `{ x: -1, y: -1 }`.
- In `updateMousePosition()`, set `mousePos` to the incoming world position.
- In `renderMouseVisualizations()`, replace the negative guard with `if (!mousePos) return;`.

### 3. Render with negative positions

- Ensure `CoordinateConverter.worldToDisplay`, `getGridPosition`, and `gridToDisplay` are used unchanged (they already support negatives).
- Verify the tile highlight and coordinate label render correctly for negative values.

### 4. Verification

- Run the client and enable the visual debug layer.
- Move the cursor to negative world coordinates (left/up of origin).
- Confirm the blue mouse circle, yellow tile outline, and coordinate label render in negative space.

## Files

- `outside-client/src/renderer/visualDebugLayer.ts`
- Optional: `outside-client/src/renderer/coordinateSystem.test.ts` for negative-coordinate conversion checks.

## Status

- Completed the cursor guard update and state change to allow negative coordinates.
- No deviations from the plan.
