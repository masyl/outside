# Negative Coordinate Cursor Tracking

## Motivation

The level coordinate system now centers at (0, 0) and allows entities to move into negative coordinates. The visual debug cursor currently disappears when the mouse moves into negative world space, making debugging and spatial reasoning difficult in the new coordinate system.

## Solution

Update the visual debug layer to track and render the mouse cursor and tile highlight for negative world coordinates, while still ignoring the uninitialized "no mouse yet" state.

## Inclusions

- Remove negative-coordinate guard that prevents cursor rendering.
- Replace the "invalid mouse" sentinel with an explicit unset state.
- Ensure cursor tile, snap marker, and coordinate label render for negative positions.

## Exclusions

- No changes to world bounds, level limits, or input handling outside the debug cursor.
- No redesign of cursor visuals.

## Implementation Details

Use `null` (or a dedicated flag) for "mouse not yet set", and gate rendering on that state instead of checking for negative values.

## Pre-requisites

- None.

## Open Questions

- None.

## Next Logical Pitches

- None.
