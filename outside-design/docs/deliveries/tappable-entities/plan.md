# Tappable Entities and Events — Implementation Plan (Draft)

## Goal

Introduce a basic “tap” interaction primitive so bots and terrain can be tapped/clicked (mouse + touch), and wire those interactions into deterministic, timeline-replayable outcomes by emitting **existing simulation Actions/Commands** (not by replaying raw tap events).

## Constraints

- **Determinism**: raw “tap” is UI/input; the simulation only changes via explicit Actions/Commands.
- **Client mode included**: clients can tap; host performs world lookups + emits simulation commands.
- **No new networking protocol**: reuse existing input plumbing (notably `CLICK_TILE`).
- **Use Pixi’s built-in interaction/events**: rely on Pixi’s event system rather than custom window listeners.
  - Pixi v8 uses the federated event system (`eventMode`, `pointer*` events). `PIXI.InteractionManager` exists as a legacy module, but the recommended approach in v8 is the event system.

## Phase 0: Decide the tap payload (tile-based)

- Standardize on **tile coordinates** (`x`, `y`) as the canonical tap payload.
- In host, interpret the tap by:
  - checking if a bot exists at tile
  - otherwise checking if terrain at tile is walkable

## Phase 1: Client input → send tap to host

- Implement pointer/touch handling using Pixi’s event system (no custom DOM listeners):
  - Use `pointertap` / `pointerup` from the Pixi stage (or a full-screen hitArea) to capture taps.
  - computes tapped tile coordinate from screen pointer location
  - sends `CLICK_TILE` input command with `{x, y}`
- Cursor hover:
  - Use `pointermove` via Pixi events to update hover state.
  - Change cursor to pointer/hand when hovered tile is tappable (bot present OR walkable terrain).

## Phase 2: Host tap routing (input → game commands)

- Extend host handling of `CLICK_TILE` (already present) to:
  - look up the tapped tile in the host’s authoritative `WorldState`
  - enqueue a deterministic command sequence (see Phase 3)

## Phase 3: followTheLeader demo behavior (system)

Implement the demo “followTheLeader” reaction rules by emitting deterministic commands/actions:

- If tapped tile contains a bot:
  - bot in `follow` → set to `wander`
  - bot in `wander` → set to `wait`
  - bot in `wait` → set to `wander`
- Else if tapped tile is walkable terrain:
  - spawn a new bot and set it to follow the nearest bot

Notes:

- Prefer to express these as existing commands:
  - `wander <botId>`
  - `wait <botId>`
  - `follow <botId> <targetId> [tightness]`
  - plus `create bot <id>` + `place <id> <x> <y>`

## Phase 4: Logging

- Log tap events with relevant details (clientId, tile, resolved entity if any).
- Log each followTheLeader reaction with specific messages (toggle/follow/spawn).

## Phase 5: Tests

- Unit tests for:
  - tile coordinate conversion helper (screen → world → tile)
  - host tap routing logic (bot tap vs walkable tile)
  - deterministic behavior: tap routing emits the same commands given the same world state

## Deliverables

- Tapping/clicking works on desktop + touch
- Cursor changes on hover for tappable targets
- Demo tap interactions perform the described urge toggles/spawns
