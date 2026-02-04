---
Title: Framerate cap at 60 for CPU load
Category: Ideas
Status: draft
---

# Framerate cap at 60 for CPU load

## Motivation

Running the game or Storybook at an uncapped frame rate can use more CPU than necessary and cause unnecessary heat or battery drain. Capping the framerate at 60 FPS is a common way to reduce load while keeping the experience smooth.

## Solution

**Investigate** whether capping the framerate at 60 reduces CPU load in our setup (e.g. game loop or render loop), and **if beneficial**, add an option or default cap at 60 FPS. The cap applies to how often the client renders and/or runs the game loop; the simulation core remains driven by discrete tics, not by frame count.

## Inclusions

- **Option or default** to cap frame rate at 60 FPS (e.g. in the game loop, requestAnimationFrame throttling, or render loop).
- A **simple way to measure or observe** CPU impact (e.g. note in docs, or optional FPS/CPU display) so we can confirm the cap helps.
- Documentation or config so the cap can be turned off for development or high-refresh displays if needed.

## Exclusions

- No change to simulation tic rate or to how many tics run per second; the simulator stays tic-based and is driven by the client when the client decides to step.
- No mandatory cap for all environments; the pitch is "investigate and add if beneficial."
- No game logic that depends on frame rate.

## Pre-requisites

- A game loop or render loop (e.g. in client or Storybook) that can be throttled or capped.

## Open Questions

- Should the cap be default on for production and off for dev, or configurable only?
- Do we need to support displays with refresh rate above 60 (e.g. 120 Hz) with a higher cap option?

## Next Logical Pitches

- Adaptive quality or frame rate based on device.
- VSync or other display sync options.

## Implementation Details (use sparingly)

- Cap is implemented in the **client** game loop or render loop (e.g. throttle requestAnimationFrame, or limit updates per second). The **outside-simulator** core remains time-agnostic: it advances by tics when the client calls `runTics`. Frame rate and tic rate are independent; this pitch does not change the simulator API.
