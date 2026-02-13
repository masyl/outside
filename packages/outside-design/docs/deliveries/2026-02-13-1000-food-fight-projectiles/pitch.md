---
Title: Food Fight Projectiles
Categories:
  - ECS
  - Physics
  - AI
  - Storybook
Tags:
  - projectiles
  - food
  - canon
  - factions
  - dungeon
  - hero
  - bots
Summary: Introduce a food canon mechanic where bots and the hero load food pickups into a canon, shoot them as physics projectiles, and fight in faction-based teams (cats vs dogs) inside a food-fight dungeon demo.
---

# Food Fight Projectiles

## Motivation

The simulator has rich physics, 22 food variants with sprites, and a hero with directional input — but no way to launch objects with intent. A food canon mechanic would showcase all these systems together in a fun, readable demo: bots actively using the environment (picking up food), firing it at enemies, and producing satisfying physics projectiles. It also establishes the reusable primitives (canon component, projectile lifecycle, faction AI) needed for future combat and mini-game pitches.

## Solution

Add a **food canon** component that any entity (bot or hero) can carry. A canon is inert until loaded: when its owner walks over a food pickup, that food item becomes the loaded projectile template. Firing spawns a projectile entity with the food item's physics and sprite, launches it in the shooter's aim direction, and the projectile disappears on first collision.

To demo this, we create a **Food Fight Dungeon** Storybook story: a large dungeon, one of every food variant scattered as pickups, an autonomous cast of cats and dogs fighting each other, and a hero the player can control. Cats shoot at dogs, dogs shoot at cats, and neither faction targets the hero.

## Inclusions

### Food Canon Component
- `FoodCanon` ECS component: holds a reference to the loaded food entity (or empty)
- Canon fires only when loaded; unloaded fire attempts are no-ops
- Bots and the hero share the same canon rules

### Food Pickup → Ammo Flow
- When a canon-carrying entity walks over (consumes) a food item, the food entity is **not destroyed** — it is hidden and linked to the canon via a relationship ("in canon")
- Each food variant prefab defines a **shot count** (e.g. grapes = many, burger = few)
- Each shot decrements the count; when depleted, the food entity is **teleported to a random floor tile** in the dungeon and becomes a pickup again

### Per-Food Projectile Physics
- Each food variant prefab encodes distinct physics parameters: mass, bounciness, drag, size, shot count
- At fire time, a projectile entity is spawned inheriting those parameters plus the food's sprite
- Projectile entities despawn on first collision

### Faction System
- `Faction` ECS component with values: `cat | dog | neutral`
- `HostileToFactions` ECS component: list of factions this entity will shoot at
- Cat prefab: `Faction=cat`, `HostileToFactions=[dog]`
- Dog prefab: `Faction=dog`, `HostileToFactions=[cat]`
- Default-bot hero: `Faction=neutral` — neither cats nor dogs target it

### Bot AI: Faction Shooting
- When a loaded bot detects a hostile-faction entity within detection range, it fires
- Aim: direction snaps to the target at fire time, with a **random angular error** (configurable per prefab) so shots don't always connect

### Hero Shooting
- Input: **R2 trigger** fires the hero's food canon (no-op if unloaded)
- Fire direction: hero's `TargetDirection` vector (the same vector used for movement)

### Food Fight Dungeon (Storybook Story)
- Large dungeon generated with the existing dungeon generator
- One of each food variant (22 items) spawned as floor pickups
- Population: a mix of cat-faction and dog-faction bots, all with food canons
- One hero entity for the player (default-bot skin, neutral faction)

## Exclusions

- No damage, health, or elimination system — projectile hits have no gameplay consequence in this pitch
- No bot pathfinding toward food (bots pick up food opportunistically while wandering)
- No visual feedback on hit (particles, flash) — follow-up pitch
- No networked multiplayer support for the canon mechanic
- No UI showing ammo count or loaded food type

## Implementation Details

- New **ECS components** (`FoodCanon`, `Faction`, `HostileToFactions`, `ShotCount`, `Projectile`, etc.) are defined in TypeScript — pure data, as always
- All **game logic systems** (canon loading, faction targeting, shooting, projectile lifecycle) are written **directly in Lua**, following the `physics3d-core-script-runtime.ts` pattern — born Lua, no migration needed later
- The "in canon" food relationship uses a BitECS relationship so the food entity survives but is excluded from render and physics queries
- The angular error at fire time uses the world's seeded RNG to keep simulations deterministic and replayable
- The projectile spawner reuses the same Cannon-ES impulse pattern as the soccer ball kick (`applyKickImpulseForPair`) — initial velocity applied as a direct impulse in the aim direction plus a small upward component

## Missing Prerequisites

- None. Physics, food sprites, hero input, collision events, and ECS infrastructure are all in place.

## Suggested follow ups

- Damage and elimination system (hit points, bot death, respawn)
- Visual hit feedback (squash animation, food splat particle)
- Ammo HUD showing loaded food type and remaining shots
- Bot pathfinding toward food pickups when unarmed
- Faction-neutral "free for all" mode where every bot shoots at every other bot

## Open Questions

- None.
