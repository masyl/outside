---
Title: Food in the Dungeon — Whimsy and Effects
Category: Food
---

# Food in the Dungeon — Whimsy and Effects

## Motivation

Food that just fills hunger is fine; food that *does something weird* is more fun. This pitch leans into game feel: mushrooms that make you wobble or speed up, cheese that attracts rats (or bots) from afar, and maybe food that rots so the dungeon feels a bit alive.

## Solution

Add **food with personality**: different types not only restore satiety but apply **temporary effects** (speed boost, wander-more, slow-down, etc.). Optionally, some food **rots** over time (visual change, then disappears or becomes "gross" and less desirable). We can also add **smell** or **attraction**: certain food types subtly pull hungry bots from a longer range (steering influence), so the dungeon has "something tasty in that room" without full pathfinding.

## Inclusions

- **Food types with effects**: At least 2–3 types, e.g.:
  - **Mushroom**: Restores a bit of hunger; for N tics after eating, bot's max speed increases (or wander angle delta increases — "wobbly").
  - **Bread**: Standard satiety, no effect.
  - **Cheese** (or equivalent): Strong satiety; for N tics, "attraction" radius for other bots increases (other hungry bots seek this bot? or just a strong smell-zone that pulls seekers).
- **Effect system**: Temporary effect component or buffer on the bot (effect type + ticks remaining). Movement/urge systems read it (e.g. double max speed when "mushroom" effect active).
- **Optional rot**: Food entity has a "freshness" or "tic spawned"; after M tics, visual changes (e.g. darker) and satiety halves, or it disappears. Demo in Storybook with slow tic rate so we can watch rot.
- **Optional attraction**: One food type has "smell range" — hungry bots within range get a gentle steering nudge toward that food in addition to normal seek. No pathfinding, just influence direction.

## Exclusions

- No full "AI" for bots (no complex decision trees); effects are simple numeric tweaks (speed, radius, etc.).
- No new art pipeline; visuals are placeholders (color, size, or simple shape per type).

## Pre-requisites

- Food as consumable entities with types and satiety.
- Hunger and seek-food behavior (so bots actually eat and we can see effects).
- Urge and movement systems that can read a "current effect" or similar.

## Open Questions

- Rot: visual only, or does rotten food have negative effect (e.g. slow bot)?
- "Attraction": one bot eating cheese attracts others — is that "other bots seek this bot" or "other bots seek the tile where cheese was"? (Simpler: smell zone around food entity; when eaten, zone goes away.)

## Next Logical Pitches

- More effect types (invisibility, freeze, etc.).
- Crafting or combining food.
- Food as level design (place cheese to lure bots through a trap).

## Implementation Details (use sparingly)

- Effects as a small key-value or list on the bot: `{ type: 'mushroom', ticsLeft: 30 }`. Each tic, decrement; systems check "if has effect X, apply modifier."
- Attraction: in seek-food, instead of "nearest food in range," add a second pass: "food with smell in range" adds a weighted direction toward that food; combine with nearest-food vector.
- Rot: food component `spawnedAtTic`; when `world.tic - spawnedAtTic > ROT_TICS`, set "rotten" flag; rendering and satiety read it.
