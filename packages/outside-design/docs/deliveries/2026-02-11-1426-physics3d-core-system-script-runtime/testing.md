# Testing Report: Physics3D Core System Script Runtime (System Scripting series)

## Automated tests

- **Simulator package**: `pnpm --filter @outside/simulator test`
  - Result: **17 files, 66 tests passing**.
  - Includes coverage for:
    - Lua physics3d core runtime parity/fail-fast/benchmark utilities.
    - External system hook scripts (ordering, registry APIs, failure policies).
    - Command scripts (registration, deterministic queue order, failure policies).
    - Event scripts (engine/custom event dispatch, command queue bridge, failure policies).
- **Simulator build**: `pnpm --filter @outside/simulator build`
  - Result: passing (`vite build` + DTS generation).
- **Storybook static build**: `pnpm --filter outside-storybook build-storybook`
  - Result: passing after `process` browser shim for Fengari imports.

## Not tested

- No browser E2E execution was run against live Storybook dev mode in this wrapup step (only static Storybook build).
- No dedicated performance regression gate was added (benchmark is comparative and informational).
- No network/multiplayer integration tests for script systems were added.

## Runtime warnings and notes

- Vite/Storybook still report Fengari-related browser externalization warnings (`fs`, `os`, `path`, `child_process`, `crypto`), but builds complete and simulator tests pass.
- Baseline benchmark snapshot remains:
  - TS: `avgMsPerTic=0.1778`
  - Lua: `avgMsPerTic=0.7983`
  - Equal collision event counts in benchmark scenario.

## Recommendations

- Add a lightweight Storybook smoke test that loads key scripting stories under `storybook dev`.
- Define expected failure-policy defaults and telemetry for production (currently configurable with fail-fast/continue behavior).
- Add follow-up performance measurement docs once hook/command/event scripts are used in larger scenarios.
