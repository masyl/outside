# Testing

This file contains notes on the latest round of QA done by the meat sack dev working with the AI agent. Testing sessions of AI work can require extensive note taking that needs to be accessible by the agent. Notes in a file can be a more cohesive approach than endlessly pasting stuff in the chat.

## Expected AI agent behavior

- Address each bug individually, unles they are clearly related.
- Create an individual plan for each bug fix
- After doing a fix, update this file with a prefix "TO TEST:" before passing it to me for retesting.

## Current state

### Needed improvement

- None yet

### Problems of current build

- None

### Other Confirmed Problems

[ ] Host console logs has a warning:
    signaling.ts:147 [Signaling] Unknown message type: host-registered
[ ] Host has logs regarding missing sprite:
    animationController.ts:88 [AnimationController] Sprite not found for object bob
[ ] When resetting the game, the step count should also reset. It is the main game clock.

### Hard to Reproduce Problems

[ ] Intermitent: Screen goes white, game keeps running even if nothing renders and this message is in the console: "WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost"

### Design or usability Problems

[ ] DESIGN: Two users can have the same bot selected. Solution: When more than one user has selected a bot, the circle should have two blue borders.
