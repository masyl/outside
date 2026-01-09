# Testing

This file contains notes on the latest round of QA done by the meat sack dev working with the AI agent. Testing sessions of AI work can require extensive note taking that needs to be accessible by the agent. Notes in a file can be a more cohesive approach than endlessly pasting stuff in the chat.

## Expected AI agent behavior

- Address each bug individually, unles they are clearly related.
- Create an individual plan for each bug fix
- After doing a fix, update this file with a prefix "TO TEST:" before passing it to me for retesting.

## Current state

### Needed improvement

[x] Add the status of the peer-to-peer to the debug panel
[ ] Show both counts: Ground objects and Surface objects. (related to bug below)

### Confirmed Problems

[ ] TO FIX: Host console logs has a warning:
    signaling.ts:147 [Signaling] Unknown message type: host-registered
[ ] Host has logs regarding missing sprite:
    animationController.ts:88 [AnimationController] Sprite not found for object bob
[ ] TO FIX: When resetting the game, the step count should also reset. It is the main game clock.
[ ] TO FIX: The object count is not accurate, it should include the terrain objects.

### Suspected Problems

[ ] After a game reset from the host, clients turn all white, but not completelly crashed. And it sometimes flashes white and the level renders again... in a loop.

### Design or usability Problems

[ ] DESIGN: Two users can have the same bot selected. Solution: When more than one user has selected a bot, the circle should have two blue borders.
