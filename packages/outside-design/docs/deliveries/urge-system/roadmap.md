---
title: 'Urge System Roadmap (WorldState-first + Deterministic Autonomy)'
delivery_date: '2026-01-25'
status: 'completed'
type: 'roadmap'
related_documents:
  - './pitch.md'
  - './plan.md'
---

## Urge System Roadmap

This roadmap tracks the **todos** and **success criteria** for implementing an “urge” layer for bot autonomy.

Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for implementation details.

## Workstreams

- **W1: Data model + determinism** (types, world state, replay invariants)
- **W2: Commands + reducer wiring** (parser/handlers/actions/reducer)
- **W3: Urge behaviors** (wander/wait/follow rules inside tick)
- **W4: Demo + debug visuals** (demo.md + follow link rendering)
- **W5: Tests + confidence** (determinism + behavior tests)

## Agent workflow (incremental loop)

To keep this safe and reviewable, work in small increments using this loop:

1. **Complete one todo**
2. **Write tests and pass all of them**
3. **Update `roadmap.md`**
4. **Commit**

Then repeat.

## Milestones / Todos

### Phase 0: Urge data model (no behavior change)

- [x] Define core types: `Urge`, `BotUrgeState` (follow target + parameters)
- [x] Store urge state per bot in `WorldState` (likely on `GameObject`)
- [x] Add defaults for existing bots (e.g. default to `wander`)
- [x] Add/adjust core type validation tests (`@outside/core`)

Notes:

- This phase should not change bot motion yet; only add state scaffolding.

### Phase 1: Commands + actions (set urge deterministically)

- [x] Extend `ParsedCommand` to support:
  - [x] `follow <botId> <targetId> [tightness]`
  - [x] `wander <botId>`
  - [x] `wait <botId>`
- [x] Implement command parsing rules + validation
- [x] Implement command execution in `executeCommand(...)`
- [x] Add store actions for urge updates (e.g. `SET_BOT_URGE`)
- [x] Reducer: apply urge updates to bots (set/clear follow target)

### Phase 2: Wander urge (move existing random walk under urge)

- [x] Move current random walk logic under `wander`
- [x] Ensure speed/turn envelopes remain bounded and deterministic
- [x] Ensure `wait`/`follow` do not accidentally inherit wander behavior

### Phase 3: Wait urge

- [x] Implement `wait`: stop movement (velocity \(\approx 0\))
- [x] Keep facing/orientation stable while waiting (still “looks at” target if relevant later)

### Phase 4: Follow urge (steering)

- [x] Implement follow target lookup + fallback:
  - [x] If target missing, revert to `wander`
- [x] Implement steering:
  - [x] Gradually adjust velocity toward target direction (tightness parameter)
  - [x] Distance-based speed:
    - [x] stop within 2 tiles
    - [x] speed up beyond 3 tiles
    - [x] max speed 2 tiles/sec
- [x] Determinism: no non-deterministic sources introduced (no Date.now(), no Math.random())

### Phase 5: Demo scenario (5 bots + chain)

- [x] Update `packages/outside-client/public/levels/demo.md` to spawn 5 bots
- [x] Add commands to set:
  - [x] leader = `wander`
  - [x] followers = `follow` in a daisy chain

### Phase 6: Debug visuals (follow links)

- [x] Add a debug visualization line follower → target when debug is enabled
- [x] Ensure it is cheap (off when debug overlay hidden)

### Phase 7: Test gates + cleanup

- [x] Add unit tests for:
  - [x] command parsing + handler wiring
  - [x] reducer urge updates (state changes)
  - [x] follow behavior (distance closes, stop band, speed-up band)
  - [x] fallback behavior (missing target → wander)
  - [x] determinism under replay/time travel assumptions
- [x] Smoke test locally (leader + chain visible, debug links visible)

## Success Criteria (exit gates)

### Correctness

- [x] Bots have an urge state and it survives replay/time travel deterministically.
- [x] `wander` behaves like current random walk (bounded + deterministic).
- [x] `wait` stops movement without breaking facing/sprite direction logic.
- [x] `follow` produces a stable chain:
  - [x] follower approaches target
  - [x] follower stops around the stop threshold
  - [x] follower speeds up when lagging behind
  - [x] follower recovers if the chain stretches
- [x] Demo spawns 5 bots and forms the chain via commands in `demo.md`.
- [x] Debug overlay draws follower → target links correctly when enabled.

### Performance & stability

- [x] No noticeable FPS regression from follow debug links when debug is off.
- [x] Debug link rendering is disabled when the debug overlay is hidden.

### Rollout safety

- [x] The feature is additive: existing demo still runs and timeline replay remains valid.

## Open Questions / Decisions to Track

- Tightness semantics: lerp factor vs time constant; what is the default?
- Command syntax: do we allow optional parameters now or later?
- Should `follow` share the same speed envelope as `wander`, or have a separate max speed?
