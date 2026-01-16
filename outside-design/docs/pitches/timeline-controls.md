# Support for PixelArt Visuals

## Motivation

To improve the development experience, prepare for level design features, the command architecture could be used to allow time travelling to rewind and fast-forward the game state.

## Solution

The command pattern allows for granual control of the game state by moving along the event history and changing the current game state accordingly.

Adding the typical controls found in video playback would offer intuitive ways to control time in the game.

## Inclusions

* New controls for:
  * Pause, Play, Rewind
  * Step Forward, Step Backward
  * GoTo End, GoTo Start
* Resume from here
* Move on the timeline without erasing the event history
* Add Global keystrokes for each commands
* Add buttons in the debug menu for Play/Pause.
* Add a Keystroke menu when pressing "?"

## Exclusions

* Nothing specific

## Implementation details

* Nothing specific

