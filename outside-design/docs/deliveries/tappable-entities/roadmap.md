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

- [ ] Confirm canonical naming: “tap”/“tappable” (not “click”)
- [ ] Confirm tap payload is **tile coordinates** only (no subtile)
- [ ] Define “tappable” rules:
  - [ ] bots are tappable
  - [ ] terrain tiles are tappable (walkable only)

### Phase 1: Pixi events (no scratch input)

- [ ] Capture taps using Pixi federated events (`pointertap`/`pointerup`) on stage (or fullscreen hitArea)
- [ ] Capture hover using Pixi events (`pointermove`)
- [ ] Set cursor to hand when hovering a tappable target
- [ ] Log tap with relevant details (clientId, tile, resolved target if any)

### Phase 2: Client→Host signaling

- [ ] Reuse existing input command type `CLICK_TILE` with `{x,y}` payload
- [ ] Ensure client mode sends tap events to host only (host emits commands)

### Phase 3: Host tap routing

- [ ] On host, resolve tap at tile:
  - [ ] bot at tile → handle bot tap
  - [ ] else if walkable terrain at tile → handle terrain tap
- [ ] Enqueue deterministic command sequence (no nondeterministic state)
- [ ] Log reactions with specific messages

### Phase 4: followTheLeader demo system

- [ ] Bot tap toggles urge:
  - [ ] follow → wander
  - [ ] wander → wait
  - [ ] wait → wander
- [ ] Walkable terrain tap spawns a new bot following the nearest bot
- [ ] Ensure behavior works in host + client mode

### Phase 5: Tests

- [ ] Unit test tile conversion helper (screen → world → tile)
- [ ] Unit test host routing logic:
  - [ ] bot tile tap
  - [ ] walkable terrain tile tap
  - [ ] non-walkable tile tap (no-op)
- [ ] Determinism test: given same world + same tap input, host enqueues same commands

## Success Criteria (exit gates)

### Correctness

- [ ] Taps are captured via Pixi event system (not custom DOM listeners)
- [ ] Cursor changes on hover for tappable targets
- [ ] Client mode can tap and host receives the signal
- [ ] Host routes taps into deterministic commands (timeline-friendly)
- [ ] Demo rules (followTheLeader) match the pitch

### Stability

- [ ] No regressions to existing movement/urge behavior
- [ ] No noticeable performance issues from hover/tap logic
