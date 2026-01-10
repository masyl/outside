# Animated Directionnal Bots

## Motivation

Bots rendering is static and doesn't have a direction, which make them feel stiff and it's hard to create game mechanics that involve knowing where the bot faces.

## Solution

Add a direction attribute to bots that will change when they move around. The direction will also determine what sprite is drawn when rendering the bot.

Also, the bot should be animated when idling or walking.

## Implementation details

* Bot should have 8 direction
* 0 is top, but down is the default posture when placing or creating a new bot.
* The spritesheet currently used for bots already contains the required animations.
* The animations should run at a frequency of 125ms. The same rate as the main step clock speed. But both update frequency are not synched.
* The direction is part of the game state available to host and client.
* The core types for movement directions should be upgraded from 4 to 8 to reflect this change.
* Add an explicit state in the bot GameObject (e.g. state: 'idle' | 'moving').
* The bot should default back to idle after not moving for 2 steps.
* The sprite flipping logic:
  * Row 1 (Down-Right) -> Flip -> Down-Left?
  * Row 2 (Right) -> Flip -> Left?
  * Row 3 (Up-Right) -> Flip -> Up-Left?


### Animations

* Idle animation Spritesheet: "16x16 Idle-Sheet.png"
* Walking animation Spritesheet: "16x16 Walk-Sheet.png"

* The sheets have 4 columns and 5 rows
* Columns are the animation frames
* Rows are the different directions.
* Row 0=Down, 1=Down-Right, 2=Right, 3=Up-Right, 4=Up.
* Rows 1, 2 ans 3 can be flipped horizontally to make the other 3 directions.
