# Debug mode

## Motivation

Both during developement and when designing levels, maby aspects of the game state are invisible to the creator. There should be a way, within the game itself, to quickly see "behind the scene".

## Solution

Provide a debug mode that can be activated/deactivated, which instantly adds a layer of additionnal information over the game in real-time.

* Keystroke and button to activate a debug mode
* Show an info panel when the mouse hovers a tile.
* Info panel give this info: list of stacked objects by layers, grid coordinate, Walkable or not, Empty or not
* During development the debug mode is active by default
* Show/hide the panel containing the fps/steps only if in debug mode
* Show the current seed (used for randomness and procedural generation)
