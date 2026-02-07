# Delivery Report: Urge system (Follow, Wander, Wait)

## Overview

This delivery adds a deterministic, Timeline-replayable “urge” layer for bot autonomy:

- `wander` (existing deterministic random walk)
- `wait` (stop moving, keep facing stable)
- `follow` (steering + distance-based speed toward a target bot)

It also updates the demo to spawn a leader + daisy-chain followers and draws follower→target links in the visual debug layer.

## Delivered features

### 1) Urge state in simulation (`WorldState`)

- Added `Urge` / `BotUrgeState` to `@outside/core` and stored it per bot (`GameObject.urge`).
- Default behavior for newly created bots is `wander`.

### 2) Commands to control urges

Commands are parsed and executed deterministically through parser → command handler → action → reducer:

- `wander <botId>`
- `wait <botId>`
- `follow <botId> <targetId> [tightness]`

### 3) Deterministic urge behavior in `SIM_TICK`

- `wander`: uses the existing deterministic random walk motion.
- `wait`: forces velocity to 0 while keeping facing stable.
- `follow`:
  - Steers velocity toward the target.
  - Distance-based speed:
    - stop within 2 tiles
    - speed up beyond 3 tiles
    - max speed 2 tiles/sec
  - If the target is missing/unplaced, bot falls back to `wander`.

### 4) Demo scenario (leader + chain)

Updated `packages/outside-client/public/levels/demo.md` to spawn 5 bots and configure:

- leader: `wander`
- followers: `follow` in a daisy chain

### 5) Debug visualization (follow links)

When the debug overlay is enabled, the visual debug layer draws a line from follower → target for bots in `follow` urge.

## Testing

Automated:

- `pnpm test` ✅
- `pnpm build` ✅
- `pnpm test:coverage` ✅

Unit tests were added/updated for:

- command parsing
- reducer urge updates
- follow behavior + fallback
- determinism assumptions (replay/time-travel friendliness)

## Notes / follow-ups

- Pitch template sections (`Pre-requisites`, `Open Questions`) still contain `TBD` and should be refined before broadening the system.
- Future extensions suggested in the pitch: pathfinding/obstacle avoidance, in-game visibility of urges, and richer debug info.
