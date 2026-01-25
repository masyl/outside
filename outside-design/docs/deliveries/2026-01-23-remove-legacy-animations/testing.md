# Testing Notes

## Current Bugs

- [x] The cardinal direction vector is no longer update to reflect the direction the bots is facing after moving.
- [x] The viewport point-of-view is no longer following the currently selected bot.
- [ ] When the state of the bot is walking, it should cycle through the walk animation sprites.
- [ ] The transition between ticks should be smoothened using the Motion animation library at 60fps, but not store those values in the state (purely visual on the client)
- [ ] Limit the max FPS to 60
- [x] The velocity vector has disapeared from the debug layer
- [ ] The exact speed of the walk animation should match the speed.

## Check for later

- [ ] The bots should show all 8 directions when moving with the new movement system

## Continuous motion (random walk) checks

- [ ] Bots move continuously (no tile snapping) with subtile positions visible at low speeds
- [ ] Speed visibly oscillates between ~0.5 and ~2.0 tiles/sec
- [ ] Direction changes smoothly (about ~15°/sec on average) without jerky cardinal snapping
- [ ] Velocity debug vector shows direction AND length scales with speed
- [ ] Collision bounce: bots reflect off non-walkable tiles/terrain edges in a plausible direction
- [ ] Determinism: replay/time-travel produces the same continuous paths for a given seed
