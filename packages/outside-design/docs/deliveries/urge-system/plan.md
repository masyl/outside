# Urge system for Follow, Wander and Wait — Implementation Plan (Draft)

## Goals

- Add a deterministic, timeline-replayable “urge” layer to bot autonomy: **wander**, **follow**, **wait**.
- Make it easier to test/observe motion by enabling a leader + follower chain scenario.
- Keep the approach consistent with the current “WorldState-first” transition: systems are state + reducer-driven (Action-based), not renderer-driven.

## Non-goals (initial)

- Pathfinding / navmesh
- Obstacle avoidance beyond existing collision + bounce
- New UI panels (debug visuals only)
- Networking/protocol changes
- Broad architectural refactors outside the autonomy/motion layer

## Current anchors (where this plugs in)

- Commands are parsed in `packages/outside-client/src/commands/parser.ts` and executed in `packages/outside-client/src/commands/handlers.ts`.
- Motion is advanced deterministically via `SIM_TICK` in `packages/outside-client/src/store/reducers.ts` (20Hz fixed-step from host loop).
- Demo level bot spawns come from `packages/outside-client/public/levels/demo.md`.

## Phase 0: Define data model (WorldState-first)

- Add new core types for urge state, e.g.:
  - `Urge = 'wander' | 'follow' | 'wait'`
  - `BotUrgeState` with optional follow target id + parameters
- Decide where urge state lives:
  - Prefer: `GameObject` gains `urge?: BotUrgeState` (keeps it per-entity, timeline-friendly)

### Tests

- Type validation tests in `@outside/core` updated/extended for the new urge shape.

## Phase 1: Commands + actions

Add new commands to drive urge state deterministically:

- `follow <botId> <targetId> [tightness]`
- `wander <botId>`
- `wait <botId>`

Wire:

- Extend `ParsedCommand` in `packages/outside-client/src/commands/parser.ts`
- Handle the new command types in `packages/outside-client/src/commands/handlers.ts`
- Add store actions (e.g. `SET_BOT_URGE`) in `packages/outside-client/src/store/actions.ts`
- Update reducer to apply urge changes to the bot entity in `packages/outside-client/src/store/reducers.ts`

### Tests

- Parser unit tests: new command variants + validation.
- Reducer unit tests: urge is applied, follow target stored/cleared as expected.

## Phase 2: Urge system behavior inside deterministic tick

Implement urge behavior as part of the deterministic simulation step:

### Wander

- Move existing “random walk” behavior under the `wander` urge.
- Respect existing speed bounds (0.5–2.0 tiles/sec) and turning momentum.

### Wait

- Stop movement (velocity \(\approx 0\)), but keep facing consistent/stable.

### Follow

- Each tick, compute vector toward target bot.
- Gradually steer follower velocity toward the target direction using a “tightness” parameter.
  - Clarify parameter semantics in implementation: use either a time constant or lerp factor (avoid “0 = instant” confusion).
- Distance-based speed:
  - Defaults from draft pitch:
    - stop distance: 2 tiles
    - speed-up threshold: 3 tiles
    - max speed: 2 tiles/sec
- Fallback: if target is missing, revert to `wander`.

### Tests

- Determinism: same seed + same timeline events -> same motion.
- Follow behavior:
  - follower closes distance to target over time
  - follower stops within stop-distance band
  - follower speeds up when beyond threshold
  - follower reverts to wander when target is removed

## Phase 3: Demo scenario wiring (5 bots + chain)

Update `packages/outside-client/public/levels/demo.md`:

- Spawn 5 bots (leader + 4 followers).
- Use the new commands to set:
  - leader: `wander`
  - followers: `follow` in a daisy chain

### Tests / verification

- Smoke test locally: bots spawn and form a chain.
- Timeline replay: time-travel still reconstructs the same chain motion.

## Phase 4: Debug visuals

Add a debug visualization line linking follower -> target:

- Preferred: extend the existing `VisualDebugLayer` overlay to render follow links when debug is enabled.
- Keep it cheap: only render when debug overlay is visible.

### Tests

- Unit test the data extraction layer (pure function that maps world -> follow links), if we factor it out.

## Phase 5: Wrapup (after implementation is done)

- Update delivery docs (`testing.md`, `delivered.md`, `commit.md`, `README.md`) per wrapup process.

## Open questions to resolve during planning review

- Exact command syntax (do we include tightness? default values?)
- Tightness semantics: lerp factor vs time constant.
- Should follow modify speed bounds compared to wander, or share the same envelope?
- How do we select the “leader” outside demo mode (if at all)?
