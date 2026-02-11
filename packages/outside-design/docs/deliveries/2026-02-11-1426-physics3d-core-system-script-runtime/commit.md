# Commit preparation: Physics3D Lua Runtime and Scripting Foundations

For use when merging with squash.

## Title

feat(simulator): deliver lua system scripting foundations and physics3d runtime migration

## Body

- Migrate physics3d execution to Lua core phase scripts through Fengari with TypeScript orchestration.
- Add runtime modes (`lua`/`ts`), parity instrumentation, and benchmark helper coverage.
- Add external system script hooks (pre/post tic + core systems) with deterministic ordering and failure policies.
- Add queued command script runtime with host-mediated state commands.
- Add event script runtime for engine (`collision`, `consumed`) and custom channels; allow handlers to enqueue command scripts.
- Add Storybook Vite process shim to prevent browser crash from Fengari (`process is not defined`).
- Add/extend tests for parity, hooks, command scripts, event scripts, and runtime behavior.

References: [pitch.md](./pitch.md), [plan.md](./plan.md), [delivered.md](./delivered.md), [testing.md](./testing.md)

## Tags

- delivery/2026-02-11-1426-physics3d-core-system-script-runtime
