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
- What is the exact hit-testing priority between status bar clicks and world/minimap clicks?
- Should the fullscreen icon be a simulator entity only, or should it also support a fallback UI button?
- What should happen if no hero is available for control at runtime?
