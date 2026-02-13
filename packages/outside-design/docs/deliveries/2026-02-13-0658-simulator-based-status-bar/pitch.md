---
Title: Simulator Based Status bar
Category: Rendering
---

# Simulator Based Status bar

## Motivation

We need a status bar in many gameplay situations. While a status bar could be built with typical UI tech such as React, it would be more fun and interesting to take a diegetic approach and use an instance of the simulator for this.

## Solution

We can create a status bar for the testPlayer using a separate simulator instance with its own isolated configuration and connect it to the same Renderer Manager that is running the game.

This would result in proper isolation and allow for the status bar to keep running independently of how smooth the game is running or being reset.

- The status bar would be aligned on the top right corner and span the whole width.
- It would be drawn with the same zoom logic as the minimap pixels (but not synced to it).
- The first entity to place is a "fullscreen" icon.
- Then going left, the list of heroes available for control, using their sprite.
- Clicking on heroes will focus on them.

## Inclusions

- Isolated simulator instance started by the testPlayer
- Renderer Manager ability to include another simulator stream in its rendering loop.
- Sending back mouse and click inputs to the status bar simulation when the mouse hovers.
- Placing the renderer at the top of the viewport with 50% overlay

## Implementation Details

- Slower simulation for the status bar: 8 tics per second.
- The status bar rendering should have a black 50% transparent background, but the entities should be at 100% opaque.
- Implement fullscreen mode when the fullscreen button is clicked.

## Review Questions

- Should the status bar simulator tick continuously when the main simulation is paused?
  - A: Yes. It has to show a live state related to the game runtime, such as network, perf monitoring, controllers, etc.
- What is the exact hit-testing priority between status bar clicks and world/minimap clicks?
  - A: The top most is the status bar, then the minimap, then the underlying game simulation.
- Should the fullscreen icon be a simulator entity only, or should it also support a fallback UI button?
  - A: Strictly a simulator entity. When clicked, it should emit an event, caught by the testPlayer, which then triggers the change of state.
- What should happen if no hero is available for control at runtime?
  - A: The viewport falls back to free-panning mode, controlled by the player. This is handled by the [Heroless Viewport Control](./heroless-viewport-control.md) pitch and is out of scope here.
- What is the height of the status bar?
  - A: 1 tile high.
- How are clicks on the status bar routed when the main simulation is paused?
  - A: The status bar simulator ticks independently of the main simulator. It runs continuously as long as the testPlayer is running, regardless of pause state.
- Should animated sprites (e.g. hero idle animations) be rendered in the status bar, or only static sprites?
  - A: Yes, the status bar uses all the same animation rules as the rest of the system.
