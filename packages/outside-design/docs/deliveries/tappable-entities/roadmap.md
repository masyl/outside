---
title: 'Tappable Entities Roadmap (Pixi events + Host routing)'
delivery_date: '2026-01-25'
status: 'planning'
type: 'roadmap'
related_documents:
  - './pitch.md'
  - './plan.md'
---

## Tappable Entities Roadmap

This roadmap tracks the **todos** and **success criteria** for adding a basic “tap” interaction primitive:

- Tap/click on bots and terrain (mouse + touch)
- Cursor changes on hover
- Client mode support (clients send taps to host)
- Host routes taps into deterministic simulation commands (no raw tap events in timeline)

Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for details.

## Workstreams

- **W1: Tap input plumbing (Pixi events)** (pointer events, hover state, cursor)
- **W2: Client→Host signaling** (reuse `CLICK_TILE`)
- **W3: Host tap routing → commands** (tile → entity/terrain → deterministic commands)
- **W4: Demo system** (`followTheLeader` reactions)
- **W5: Tests + confidence** (unit tests for routing and determinism)

## Agent workflow (incremental loop)

1. **Complete one todo**
2. **Write tests and pass all of them**
3. **Update `roadmap.md`**
4. **Commit**

## Milestones / Todos

### Phase 0: Clarify tap contract

- [x] Confirm canonical naming: “tap”/“tappable” (not “click”)
- [x] Confirm tap payload is **tile coordinates** only (no subtile)
- [x] Define “tappable” rules:
  - [x] bots are tappable
  - [x] terrain tiles are tappable (walkable only)

### Phase 1: Pixi events (no scratch input)

- [x] Capture taps using Pixi federated events (`pointertap`/`pointerup`) on stage (or fullscreen hitArea)
- [x] Capture hover using Pixi events (`pointermove`)
- [x] Set cursor to hand when hovering a tappable target
- [x] Log tap with relevant details (clientId, tile, resolved target if any)

### Phase 2: Client→Host signaling

- [x] Reuse existing input command type `CLICK_TILE` with `{x,y}` payload
- [x] Ensure client mode sends tap events to host only (host emits commands)

### Phase 3: Host tap routing

- [x] On host, resolve tap at tile:
  - [x] bot at tile → handle bot tap
  - [x] else if walkable terrain at tile → handle terrain tap
- [x] Enqueue deterministic command sequence (no nondeterministic state)
- [x] Log reactions with specific messages

### Phase 4: followTheLeader demo system

- [x] Bot tap toggles urge:
  - [x] follow → wander
  - [x] wander → wait
  - [x] wait → wander
- [x] Walkable terrain tap spawns a new bot following the nearest bot
- [ ] Ensure behavior works in host + client mode

### Phase 5: Tests

- [x] Unit test tile conversion helper (screen → world → tile)
- [ ] Unit test host routing logic:
  - [x] bot tile tap
  - [x] walkable terrain tile tap
  - [x] non-walkable tile tap (no-op)
- [x] Determinism test: given same world + same tap input, host enqueues same commands

## Success Criteria (exit gates)

### Correctness

- [x] Taps are captured via Pixi event system (not custom DOM listeners)
- [x] Cursor changes on hover for tappable targets
- [x] Client mode can tap and host receives the signal
- [x] Host routes taps into deterministic commands (timeline-friendly)
- [ ] Demo rules (followTheLeader) match the pitch

### Stability

- [ ] No regressions to existing movement/urge behavior
- [ ] No noticeable performance issues from hover/tap logic
