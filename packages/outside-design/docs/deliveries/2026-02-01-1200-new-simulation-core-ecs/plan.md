# Implementation Plan: New Simulation Core in ECS

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

Implement a new headless simulation core in a dedicated package `outside-simulator` using the [bitecs](https://github.com/NateTheGreatt/bitECS) ECS library. The core exposes a fixed-tic API (one tic = fixed time unit, e.g. 50 ms, configured by parent), runs systems in order movement → collision → randomWalk, and emits collision events into a queue queried by the parent between ticks. A shared package `outside-utils` holds RNG (and other shared utilities); both `outside-core` and `outside-simulator` depend on it. A React + SVG test renderer in Storybook demonstrates and tests the simulator; no world bounds in this delivery.

## Architectural Principles

1. **Headless**: No rendering, assets, or input inside outside-simulator; only abstract simulation state and API.
2. **Tic-based, parent-controlled**: Simulator does not decide how many tics run; parent calls "run N tics" (and optionally configures tic duration, e.g. 50 ms). Movement uses fixed step per tic; shared movement utilities use the same time/step semantics.
3. **Event queue**: Systems write events (e.g. collisions) to a queue during the tick; parent drains the queue between ticks. No callbacks or subscriptions during the ECS loop (avoids mid-loop interruption).
4. **Deterministic**: Same seed + tic count ⇒ same world state and event sequence. New core need not match legacy POC behavior.
5. **Unbounded**: World bounds (horizontal/vertical limits) are out of scope; follow-up delivery will add them.
6. **Collision**: Detection + events only; no built-in response (bounce, damage). Test renderer changes entity color on collision.

## 1. Shared utilities package (outside-utils)

- [x] Create `outside-utils` package (package.json, tsconfig, build scripts).
- [x] Add RNG (move or copy from outside-core with same API: seed, next(), nextFloat()).
- [x] Add shared movement/time utilities (fixed step per tic; tic duration configurable by parent).
- [x] Update outside-core to use outside-utils for RNG and adjust exports.
- [x] Unit tests for RNG and shared utilities; maintain 80%+ coverage.

## 2. ECS core package (outside-simulator)

- [x] Create `outside-simulator` package (package.json, tsconfig, build, test, lint).
- [x] Add bitecs dependency.
- [x] Define ECS components (position, size, direction, speed).
- [x] Implement movement system (fixed step per tic using outside-utils).
- [x] Implement collision system (detect overlap, write to event queue).
- [x] Implement randomWalk system (RNG from outside-utils).
- [x] Implement world creation, spawnEntity, runTics, getWorldState, event queue API.
- [x] Add determinism tests (seed + tic count ⇒ state and events).
- [x] Add API tests for public surface; 80%+ coverage.
- [x] TSDoc on public API.

## 3. Storybook test renderer (React + SVG)

- [x] Add dependency from outside-storybook to outside-simulator.
- [x] Create React + SVG component that consumes simulator API (getWorldState, runTics, event queue).
- [x] Add Storybook story that runs the simulator and renders entities; collision feedback (e.g. color change).

## 4. Integration and docs

- [x] Verify `pnpm build` and `pnpm test` at repo root include new packages.
- [x] Update MONOREPO.md with outside-utils and outside-simulator.
- [x] Add delivery folder with pitch copy and this plan.

## Master Checklist

- [x] outside-utils: package, RNG, shared movement/time utilities, tests.
- [x] outside-core: depend on outside-utils for RNG; no direct dependency from outside-simulator to outside-core.
- [x] outside-simulator: bitecs world, components, systems (movement, collision, randomWalk), event queue API, determinism + API tests, TSDoc.
- [x] Storybook: React + SVG story for simulator with collision visual feedback.
- [x] Root build and test green; 80%+ coverage where required.

## Success Metrics

- Parent can create world, spawn entities, run N tics, read state, and drain collision events without mid-loop callbacks.
- Same seed + same runTics(N) produces identical state and event sequence (determinism tests pass).
- Storybook story runs simulator and shows collisions (e.g. color change).
- No world bounds logic in this delivery; unbounded world.
- outside-simulator has no dependency on outside-core; both use outside-utils.

## Notes

- **Exclusions (from pitch)**: Full migration of legacy game logic, network protocol changes, new game features (inventory, items), grid system, connecting this core to the current game — all out of scope.
- **Follow-ups**: World bounds in a future delivery; optional publish/subscribe over the event queue between ticks; bringing legacy game mechanics into ECS in later work.
- **Tic duration**: Parent configures (e.g. 50 ms). Shared movement utilities use "distance per tic" derived from speed and tic duration so that future integration with legacy time model is consistent.
