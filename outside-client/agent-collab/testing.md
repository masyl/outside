# Meatsack Testing

This file contains notes on the latest round of QA done by the meat sack dev working with the AI agent. Testing sessions of AI work can require extensive note taking that needs to be accessible by the agent. Notes in a file can be a more cohesive approach than endlessly pasting stuff in the chat.

## Current state

### Bugs and Errors

[ ] TO FIX: The step count in the debug panel does not increment on the client. The step count should be a globally available information controlled by the host.
[ ] TO FIX: The step count should not reset if the client reloads, and it should also increment when reloading a persisted game. Step is like the logical "game clock" This implies that each event occurs during a specific step.
[ ] TO FIX: The step count should always be incrementing at regular interval wether or not events occur.

### Design or usability issues

[ ] DESIGN: Two users can have the same bot selected. Solution: When more than one user has selected a bot, the circle should have two blue borders.

Provide a hint at the state of things, but the agent should not try to fixed these issues unless asked.

(No current design issues)
