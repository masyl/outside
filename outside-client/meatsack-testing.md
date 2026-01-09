
# Meatsack Testing

This file contains notes on the latest round of QA done by the meat sack dev working with the AI agent. Testing sessions of AI work can require extensive note taking that needs to be accessible by the agent. Notes in a file can be a more cohesive approach than endlessly pasting stuff in the chat.

## Current state

### Bugs and Errors

[X] FIXED: At position 10, 0 the ground is not walkable, but I dont see any terrain drawn.
    - Fixed terrain layer update logic to always update on world state changes, not just when count changes
    - This ensures terrain is rendered correctly as it's added incrementally during command processing

### Design or usability issues

Provide a hint at the state of things, but the agent should not try to fixed these issues unless asked.

[X] FIXED: The currently selected bot has the same green color as the grass.
    - Suggestion: Change the color of the selected bot to white, but with a blue outline.
    - Fixed: Selected bot now displays as white circle with blue outline, unselected bots are light gray for visibility
[X] FIXED: One bot seam to be spawned on an empty tile. Large areas of the terrain seem to be still blank.
    - The might by terrains that are there, but not drawn properly.
    - Fixed terrain layer update logic to always update on world state changes, ensuring all terrain is rendered
[X] FIXED: The initial batch of commands used to lay down the ground layer should all occur during the same step and show up instantly before the game starts its logic loop.
    - Have the ability to run commands in an initial create level event.
    - Fixed: All terrain commands are now processed synchronously before the game loop starts, ensuring terrain appears instantly on game load
[X] FIXED: No water terrain seems to be visible. Is it the missing area of terrain ?
    - Fixed terrain layer update logic to always update on world state changes
[X] FIXED: There seem to be an invisible non-walkable area
    - Fixed terrain layer update logic to always update on world state changes
[ ] The mocked terrain objects dont form a contiguous set. They form islands with unreachable parts.
[X] FIXED: The checkered tiles should be checkered inside the title itself. Said otherwise, each tile should be a 4 x 4 checkered pattern, using the same two tones.
    - Fixed: Each tile now has a 4x4 checkered pattern (16px squares) inside it using the same two grey tones
