---
title: 'Physics3D Core System Script Runtime Roadmap'
delivery_date: '2026-02-11'
status: 'done'
type: 'roadmap'
related_documents:
  - './pitch.md'
  - './plan.md'
---

## Physics3D Core System Script Runtime Roadmap

This roadmap tracks the **todos** and **success criteria** for migrating `physics3d` to Lua-executed core scripts with TypeScript-controlled orchestration.

Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for details.

## Workstreams

- **W1: Runtime foundation** (Fengari setup, script loading, phase-order validation)
- **W2: Phase migration** (atomic Lua phase scripts for physics3d flow)
- **W3: Integration** (run-loop routing, runtime modes, metrics)
- **W4: Tests** (fail-fast, parity, benchmark utility)
- **W5: Delivery docs** (plan/roadmap updates and benchmark baseline capture)

## Agent workflow

1. Complete one todo.
2. Add or update tests and validate (`test` + `build`).
3. Update roadmap/plan to reflect reality.
4. Commit. Then repeat.

## Milestones / Todos

### Phase 0: Runtime foundation

- [x] Add Fengari dependency and runtime bootstrap for core scripts.
- [x] Implement phase-order loading and validation.

### Phase 1: Physics3D phase migration

- [x] Split physics3d flow into atomic Lua phase files.
- [x] Provide TypeScript host API bridge for phase operations.

### Phase 2: Pipeline integration

- [x] Route physics3d through Lua runtime by default in the tic loop.
- [x] Add runtime-mode support (`lua`/`ts`) and runtime metrics.

### Phase 3: Validation

- [x] Add fail-fast runtime tests and parity tests.
- [x] Add deterministic benchmark helper and benchmark test coverage.

### Phase 4: Delivery completion

- [x] Capture and document baseline benchmark numbers in delivery docs.
  - Snapshot (2026-02-11): `ts avgMsPerTic=0.1778`, `lua avgMsPerTic=0.7983`, equal collision counts.

### Phase 5: Series foundations beyond pitch 1

- [x] Implement external hook scripting API and runtime.
- [x] Implement command script runtime and deterministic queue execution.
- [x] Implement event script runtime for engine/custom channels.
- [x] Validate end-to-end bridge flow: hook/event scripts enqueue command scripts.
- [x] Fix Storybook browser runtime crash caused by missing `process` global.
