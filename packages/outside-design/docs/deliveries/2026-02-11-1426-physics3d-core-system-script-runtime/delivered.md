# Delivery Report: Physics3D Lua Runtime and Scripting Foundations

## Summary

This delivery completed the pitch-1 goal (running `physics3d` through Lua core system scripts) and additionally implemented the first foundational runtime layers for pitch 2/3/4: external system hooks, queued command scripts, and event scripts. TypeScript remains the orchestration/control boundary, while Lua executes atomic logic units.

## Included (original pitch 1 scope)

- Fengari runtime integrated into `@outside/simulator`.
- `physics3d` split into atomic Lua phase scripts and executed through a TypeScript host bridge.
- Runtime-mode support (`lua` / `ts`) with metrics and parity instrumentation.
- Fail-fast behavior for core script failures.
- Parity tests and benchmark utility for TS-vs-Lua comparisons.

## Expanded scope delivered (beyond pitch 1)

- External system script hooks:
  - Pre/post hooks around tic and each core system.
  - Deterministic ordering (priority + registration order).
  - Failure policies (`fail-fast`, `continue`) with error drain APIs.
- Command script runtime:
  - Register scripts by ID.
  - Queue command invocations deterministically during runtime.
  - Host-mediated state changes (no direct world writes from Lua).
- Event script runtime:
  - Register handlers by channel.
  - Dispatch engine events (`collision`, `consumed`) and custom emitted events.
  - Bridge to command scripts (event handlers can queue commands).
- Storybook compatibility:
  - Browser `process` shim in Storybook Vite config to prevent Fengari crash (`process is not defined`).

## Missing from original plan

- Nothing from the plan’s pitch-1 checklist remains open.

## Extras

- Additional API and behavior tests for hook registry operations (`list`, `unregister`, `clear`).
- Integration path validated:
  - Hook script -> queue command script -> host command application.
  - Event script -> queue command script -> host command application.

## Test coverage impact

- Simulator tests currently pass at **66 tests / 17 files**.
- New suites added:
  - `external-system-script-hooks.test.ts`
  - `command-scripts.test.ts`
  - `event-scripts.test.ts`
- Storybook static build passes with Fengari compatibility shim.

## Architectural notes

- Runtime control and failure boundaries stay in TypeScript.
- Lua layers are decomposed (phase scripts, hook handlers, command handlers, event handlers) rather than one monolithic script.
- This provides deterministic instrumentation points and keeps failure containment explicit.

## Next logical steps

1. Add payload/query surface for non-numeric command/event args where needed.
2. Design and implement the in-world command-block/grid authoring model.
3. Add profiling docs and larger-scenario benchmarks for script-heavy worlds.
