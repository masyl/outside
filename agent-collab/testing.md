# Testing

This file contains notes on the latest round of QA done by the meat sack dev working with the AI agent. Testing sessions of AI work can require extensive note taking that needs to be accessible by the agent. Notes in a file can be a more cohesive approach than endlessly pasting stuff in the chat.

## Expected AI agent behavior

- Address each bug individually, unles they are clearly related.
- Create an individual plan for each bug fix
- After doing a fix, update this file with a prefix "TO TEST:" before passing it to me for retesting.

## Global Observations

- [ ] The design documentation does not render the checkboxes in markdown.
- [ ] The title of the browser window should not mention "Client". It should instead say "Go play Outside"

## Current Sessions

### Bugs

- [ ] Bug: The minecraft pixel font was lost during the transition to React components on both panels
- [ ] Bug: Both the keystroke and the debug panels should render using the same mechanic or base component. Akin to rendering terminal text ?

### Problems of current build

- None

### Other Confirmed Problems

[ ] When resetting the game, the step count should also reset. It is the main game clock.
[ ] Openning the console in chrome messes up the rendering of the sprites and creates needless pixel doubling during animations.
[ ] Favicon is missing and causing a 404 error in the console.

### Design or usability Problems

[ ] DESIGN: Two users can have the same bot selected. Solution: When more than one user has selected a bot, the circle should have two blue borders.

## General Review Notes

### Timeline Series

- [ ] Bug: Local/Host/Client modes should be clarified and formally documented at this point.
- [ ] Bug: The time travelling moves 1 step at a time, which is very slow. Moving second by second would be more natural.
- [ ] Bug: Should the number of "steps" per seconds be dynamic ?
- [ ] Bug: Wether clients and host are able to maintain SPS (Steps per seconds) should be tracked by detecting late steps and show this stat in the debug window
- [ ] Bug: The are various "modes" that dont have formal enough terms. Multiplayer mode, Time travel mode, Autonomy mode, etc... This should be made more formal.
- [ ] Bug: The Timeline deliveries mention "Autonomy Control" to prevent bots from moving during time travel. This is super weird because the architecture should not even allow it. Did the agent code something special for this ?
- [ ] Bug: Having the best method to keep the game steps in sync with the animation loop should be investigated at some point. This could make it difficult to have butter smooth animations.
- [ ] Bug: The timeline cursor is not initialised at the end when opening the debug mode in some situations.

### Timeline keystrokes

- [ ] Bug: The time passing counted as number of steps and as number of events is not always in sync when moving on the timeline.
