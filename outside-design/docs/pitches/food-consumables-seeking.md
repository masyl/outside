---
Title: Food in the Dungeon — Consumables and Seeking
Category: Food
---

# Food in the Dungeon — Consumables and Seeking

## Motivation

Static pickups are a start, but we want bots to *care* about food: to get hungry and to seek the nearest apple or bread. This pitch adds food types, simple "nutrition" or "satiety", and a new urge: **seek food**.

## Solution

Introduce **typed food items** (e.g. Apple, Bread, Mushroom) that sit on the floor and can be consumed. Bots get an optional **Hunger** component: when hunger is above a threshold, their urge can switch to "seek food". Seeking means steering toward the nearest visible (or known) food entity within a range. On overlap, the bot consumes the food, hunger drops, and the food entity is removed. Different food types can restore different amounts of satiety (or have different effects in a later pitch).

## Inclusions

- **Food entities**: As in the static-pickup pitch (position, visual, consumable), plus **food type** (e.g. enum or tag: Apple, Bread, Mushroom). Each type has a "satiety" value (how much hunger it restores).
- **Hunger component**: Optional on bots. Value decreases over time (e.g. per tic or per N tics). When hunger crosses a "low" threshold, the bot's effective urge becomes "seek food" unless overridden.
- **Seek-food behavior**: New urge (or sub-urge) that chooses the nearest food entity within a max range and steers the bot toward it. Uses existing movement and collision; no pathfinding.
- **Consumption**: On bot–food overlap, remove food, reduce bot's hunger by the food's satiety, clamp hunger to max. Emit event for debugging/UI.
- **Demo**: Storybook layout with a few bots and scattered food; at least one bot has hunger so we can watch it seek and eat.

## Exclusions

- No pathfinding or navmesh; seeking is line-of-movement only (bot may bounce off walls while heading toward food).
- No "rot" or decay of food on the floor.
- No multiplayer or ownership (any bot can eat any food).

## Pre-requisites

- Food as consumable entities (static pickups pitch, or equivalent).
- Urge system that supports switching urge (e.g. wander → seek food when hungry).
- Collision/overlap detection for bot–food.

## Open Questions

- How does "nearest food" work with walls? Distance-as-crow-flies vs. "reachable" (simplified)?
- Should hunger be visible in Storybook (e.g. bar or color tint on bot)?

## Next Logical Pitches

- Food with temporary effects (mushroom = speed boost, etc.).
- Respawn rules: food respawns in room after delay.
- Multiple needs (thirst, rest) and priority between urges.

## Implementation Details (use sparingly)

- Hunger can be a number 0–100; "low" threshold e.g. 25. Food types have satiety 10–40. Hunger drain ~0.5 per tic (tunable).
- Seek-food: each tic, query food entities in range (e.g. 10 tiles), pick nearest by Euclidean distance, set a temporary "target position" or influence direction toward it; movement system and collision handle the rest.
