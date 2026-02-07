---
Title: Pause state for the game loop
Category: Core
Status: draft
---

# Pause state for the game loop

## Motivation

The game loop needs a clear **pause** state so that players can pause play and so that timeline stepping (e.g. step one tic, step one event) is well-defined. When paused, simulation should not advance and, typically, rendering either stops or shows a static frame. Without a first-class pause state, "pause" is ambiguous and may be implemented inconsistently.

## Solution

Introduce a **first-class pause state** in the game loop: when paused, the client does not advance simulation tics (and optionally does not request new frames, or shows a pause overlay). Play/resume clears the pause and resumes driving the simulator. The simulation core itself has no notion of pause; it only runs tics when the client calls it. Pause is entirely client-side.

## Inclusions

- A **pause flag or state** in the game loop (or timeline/playback controller) that the client respects.
- **Integration** with existing playback/timeline (e.g. TimelineManager, host mode): pause stops advancing time; play and step clear or bypass pause as appropriate.
- **Behavior when paused**: no calls to the simulator's run tics (or equivalent) so the world state does not change. Rendering can continue (e.g. static frame) or stop; optional pause overlay (e.g. "Paused") is in scope.
- A way to **enter and exit** pause (e.g. keyboard, UI button, or both) consistent with existing controls.

## Exclusions

- No save/load of game state in this pitch.
- No "pause simulation but run animations" unless that falls out of "render but don't run tics."
- No change to the simulator API; the simulator remains tic-based and passive.

## Pre-requisites

- Game loop or playback controller that currently drives the simulator (e.g. calls runTics per frame or per tick).
- Existing play/pause/step UI or shortcuts that can be wired to the new pause state.

## Open Questions

- When stepping (e.g. one tic), should pause be cleared automatically or stay paused until play is pressed?
- Should network/multiplayer have a separate "pause sync" or is pause local-only in this pitch?

## Next Logical Pitches

- Save state on pause and restore on resume.
- Synchronized pause in multiplayer.

## Implementation Details (use sparingly)

- **Client** owns the pause state. When paused, the client does **not** call the simulation core's `runTics` (or equivalent). The **outside-simulator** core is passive: it has no pause concept; it only advances when the client asks. So: "when paused, do not advance tics" is implemented by the client not calling the simulator. Timeline or game loop code that currently calls runTics each frame (or each N ms) should check the pause flag and skip that call when paused.
