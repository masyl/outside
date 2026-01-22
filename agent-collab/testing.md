# Testing

This file contains notes on the latest round of QA done by the meat sack dev working with the AI agent. Testing sessions of AI work can require extensive note taking that needs to be accessible by the agent. Notes in a file can be a more cohesive approach than endlessly pasting stuff in the chat.

## Expected AI agent behavior

- Address each bug individually, unles they are clearly related.
- Create an individual plan for each bug fix
- After doing a fix, update this file with a prefix "TO TEST:" before passing it to me for retesting.

## Current Sessions

### Bugs

- Bug: #Perf When moving the cursor in debug mode, everyting freezes. Something is probably not being debounced properly.
- Bug: After a zoom level change and a full game reload, the bots did not resize until they where moved. Where was corrupted state persisted ?


### Needed improvement

- A default ground should cover the entire level
- The worlds center should be 0,0 and the dimensions/size be in both positive and negative directions.
- The bots should be positionned according to sub-tiles for more precision.
-

### Problems of current build

- None

### Other Confirmed Problems

[ ] When resetting the game, the step count should also reset. It is the main game clock.
[ ] Openning the console in chrome messes up the rendering of the sprites and creates needless pixel doubling during animations.
[ ] Favicon is missing and causing a 404 error in the console.

### Hard to Reproduce Problems

[ ] Intermitent: Screen goes white, game keeps running even if nothing renders and this message is in the console: "WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost"

### Design or usability Problems

[ ] DESIGN: Two users can have the same bot selected. Solution: When more than one user has selected a bot, the circle should have two blue borders.

## General Review Notes

### Timeline Series

- Local/Host/Client modes should be clarified and formally documented at this point.
- The time travelling moves 1 step at a time, which is very slow. Moving second by second would be more natural.
- Should the number of "steps" per seconds be dynamic ?
- Wether clients and host are able to maintain SPS (Steps per seconds) should be tracked by detecting late steps and show this stat in the debug window
- The are various "modes" that dont have formal enough terms. Multiplayer mode, Time travel mode, Autonomy mode, etc... This should be made more formal.
- The Timeline deliveries mention "Autonomy Control" to prevent bots from moving during time travel. This is super weird because the architecture should not even allow it. Did the agent code something special for this ?
- Having the best method to keep the game steps in sync with the animation loop should be investigated at some point. This could make it difficult to have butter smooth animations.
- The timeline cursor is not initialised at the end when opening the debug mode in some situations.

### Timeline keystrokes

- The time passing counted as number of steps and as number of events is not always in sync when moving on the timeline.

### Visual Debug Layer & Grid System Refactoring

- The direction of the bots is not properly attached to the game logic loop or the state management. It seems to invert when playing time backward. It is probably calculated during the animation. The animation loop should never change state.

- The animation system is not working well enough to be kept as is. Bots become visually offsync and the whole approach is not "reversible" when time travelling.

-
