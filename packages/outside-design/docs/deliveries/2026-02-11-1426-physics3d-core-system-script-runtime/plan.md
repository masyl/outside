# Implementation Plan: Physics3D Core System Script Runtime (System Scripting series: 1)

## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Runtime**: `packages/outside-simulator/src/systems/physics3d-core-script-runtime.ts`
- **Core scripts**: `packages/outside-simulator/src/core-system-scripts/physics3d/`
- **Pipeline integration**: `packages/outside-simulator/src/run.ts`
- **Physics helpers / phases**: `packages/outside-simulator/src/systems/physics3d.ts`
- **World/runtime config**: `packages/outside-simulator/src/world.ts`, `packages/outside-simulator/src/configure.ts`
- **Tests**:
  - `packages/outside-simulator/src/lua-physics3d-runtime.test.ts`
  - `packages/outside-simulator/src/physics3d-runtime-parity.test.ts`
  - `packages/outside-simulator/src/physics3d-runtime-benchmark.test.ts`

## Overview

Run `physics3d` through Lua core scripts (Fengari) while keeping TypeScript in control of the execution loop, instrumentation, and failure handling. Keep behavior parity by extracting atomic phase scripts and using a TypeScript host bridge for ECS/physics operations. Retain a `ts` runtime mode only for parity validation and benchmark comparison.

## Architectural Principles

1. **TypeScript controls orchestration**: Lua runs phase logic; TypeScript controls phase sequencing, error boundaries, and world integration.
2. **Fail fast in this phase**: if core script load or execution fails, stop simulation and throw.
3. **Atomic phase scripts**: decompose `physics3d` into small Lua phase scripts instead of one monolithic script.
4. **Parity first, optimization second**: validate behavior equivalence before pursuing performance tuning.
5. **Deterministic runtime shape**: one runtime state per world; stable phase order and explicit host API surface.

## 1. Runtime Foundation (Fengari + loader)

### Checklist

- [x] Install `fengari` in `@outside/simulator`.
- [x] Add runtime loader capable of executing simulator-owned Lua sources.
- [x] Add script source imports for core phase-order and phase files.
- [x] Validate phase-order contract and reject invalid/missing phases.

## 2. Physics3D Lua Phase Migration

### Checklist

- [x] Define phase order in Lua (`phase-order.lua`).
- [x] Split core behavior into atomic Lua phases:
  - [x] `ensure_state`
  - [x] `apply_contact_tuning`
  - [x] `clear_dynamic_collided`
  - [x] `rebuild_bodies`
  - [x] `apply_desired_velocity`
  - [x] `step_world`
  - [x] `emit_dynamic_collision_events`
  - [x] `sync_back_to_ecs`
- [x] Expose minimal TypeScript host bridge methods needed by each phase.

## 3. Pipeline Integration and Runtime Modes

### Checklist

- [x] Route `physics3d` execution through Lua runtime in `run.ts`.
- [x] Add `physics3dRuntimeMode` (`lua`/`ts`) on world creation/configuration.
- [x] Keep `ts` mode available for parity and benchmark comparisons.
- [x] Record runtime metrics per tic and per phase.

## 4. Testing and Validation

### Checklist

- [x] Add fail-fast runtime tests for Lua script failures.
- [x] Add parity tests comparing Lua vs TypeScript outcomes on collision scenarios.
- [x] Add deterministic benchmark harness for mode-to-mode timing/collision comparison.
- [x] Run package validation (`pnpm --filter @outside/simulator test` and `build`).

## 5. Remaining Work in Pitch 1

### Checklist

- [x] Capture and document baseline benchmark results (TS vs Lua) for this delivery.

### Baseline Benchmark Snapshot (2026-02-11)

- Command:
  - `pnpm --filter @outside/simulator test -- src/physics3d-runtime-benchmark.report.test.ts --disableConsoleIntercept --reporter=verbose`
- Benchmark options:
  - `rounds=8`, `ticsPerRound=220`, `botCount=40`, `worldRadius=8`, `seed=42`
- Results:
  - `ts`: `totalMs=313`, `avgMsPerTic=0.1778`, `collisionEvents=27360`
  - `lua`: `totalMs=1405`, `avgMsPerTic=0.7983`, `collisionEvents=27360`

## Master Checklist

- [x] Physics3D runs via Lua core scripts in default runtime mode.
- [x] Core logic split into atomic phase scripts (not monolithic).
- [x] Fail-fast behavior implemented for core script failures.
- [x] Parity and regression tests added and passing.
- [x] Baseline benchmark results captured in delivery documentation.

## 6. Post-Pitch Expansion (Series Foundations)

### Checklist

- [x] Add external pre/post hook runtime around tic and core systems.
- [x] Add hook-script registration, deterministic ordering, and failure policies.
- [x] Add command-script registry + queued deterministic runtime execution.
- [x] Allow hook scripts to enqueue command scripts.
- [x] Add event-script registry for engine and custom channels.
- [x] Dispatch engine events (`collision`, `consumed`) into event handlers.
- [x] Allow event scripts to enqueue command scripts.
- [x] Add Storybook browser compatibility shim for Fengari (`process` globals).

## Notes

- Vite build currently emits browser externalization warnings from `fengari` dependencies (`fs`, `os`, `child_process`, etc.) but build and tests pass.
- Delivery scope exceeded original pitch 1 and includes foundational implementations aligned with pitch 2/3/4.
