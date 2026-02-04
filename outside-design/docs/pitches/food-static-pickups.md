---
Title: Food in the Dungeon — Static Pickups
Category: Food
---

# Food in the Dungeon — Static Pickups

## Motivation

The dungeon has floors and walls and bots bouncing around. Adding food items gives the space a lived-in feel and a clear "thing to interact with" without committing to full survival mechanics. Bots can stumble onto food; we can later decide if they care.

## Solution

Introduce **food entities** that sit on floor tiles like props. They have a position, a visual (e.g. a small shape or sprite placeholder), and are **consumable**: when a bot overlaps a food entity, the food is removed from the world and a simple "consumed" event (or callback) fires. No hunger, no seeking—just "food exists, and something can eat it."

This keeps scope small and makes it easy to add hunger or seeking behavior in a follow-up pitch.

## Inclusions

- **Food entity**: Position on the floor (grid-aligned or sub-grid), a visual size/shape for Storybook (e.g. circle or icon placeholder), and a "Consumable" or "Food" tag.
- **Spawn food**: A way to spawn food at a given tile (e.g. `spawnFood(world, { x, y })` or similar). Demo layouts (rect, dungeon) can place a few food items in rooms.
- **Consumption**: When a bot's collision shape overlaps a food entity, the food is removed and an optional event/callback records "entity E consumed food at (x,y)". No effect on bot stats yet.
- **Rendering**: Food drawn in Storybook (e.g. distinct color or icon) so we can see where it is and when it disappears.

## Exclusions

- No hunger or "need to eat" mechanic.
- No bot behavior that seeks or prioritizes food.
- No food types or nutritional values.
- No respawn or decay.

## Pre-requisites

- Floor/grid system and dungeon-style layouts (rooms, corridors) so food has sensible spawn locations.
- Collision/overlap detection that can distinguish entity–entity (bot–bot) from entity–food (bot–food).

## Open Questions

- Should food block movement (obstacle) or be walk-through (overlap only)?
- Single "food" type or allow multiple visual variants (same behavior) in this pitch?

## Next Logical Pitches

- Hunger component: bots need to eat periodically; low hunger could change urge (e.g. seek food).
- Food types (apple, bread) with different effects or durations.
- Food respawn rules (e.g. respawn in same room after N tics).

## Implementation Details (use sparingly)

- Reuse existing Position, Size (or VisualSize) where it makes sense; add a tag/component to mark "consumable" and to identify food in the consumption system.
- Consumption can be a small system that runs after movement (or after collision): for each bot, check overlap with food entities; on overlap, remove food and emit event.
