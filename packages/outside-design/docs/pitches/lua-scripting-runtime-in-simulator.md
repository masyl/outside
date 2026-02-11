---
Title: "Physics3D Core System Script Runtime (System Scripting series: 1)"
Category: Core
Summary: Migrate physics3d from compiled TypeScript system logic to a Lua-executed core system script loaded from the simulator codebase.
DeliveryLink: /deliveries/2026-02-11-1426-physics3d-core-system-script-runtime/
---

# Physics3D Core System Script Runtime (System Scripting series: 1)

## Motivation

`physics3dSystem` is currently compiled TypeScript. That makes it harder to validate a script-driven system architecture for core simulation systems.

Before adding external scripts, command scripts, or event scripts, we should first prove the core runtime by migrating one critical system (`physics3dSystem`) to Lua while preserving determinism and behavior parity.

## Solution

Introduce a simulator-owned Lua runtime (Fengari) capable of loading and executing core "system scripts" that live in the core codebase.

Phase 1 targets only `physics3dSystem`: the simulation loop dispatches this system through the Lua runtime instead of directly executing compiled TypeScript system logic.

## Inclusions

- Install and wire Fengari inside `outside-simulator`.
- Define core system script loader for scripts shipped inside the simulator codebase.
- Add execution bridge so `physics3dSystem` is run by Lua runtime.
- Keep existing system ordering in the tic pipeline while replacing only the physics3d execution implementation.
- Provide a minimal internal API contract needed by `physics3d` script execution.
- Failure policy for this phase: if core physics Lua script fails to load or throws, stop simulation and throw an error.
- Regression and determinism tests proving parity with expected physics outcomes.

## Exclusions

- No external/user/mod-provided system scripts yet.
- No pre/post hooks around systems yet.
- No command scripts callable during runtime yet.
- No event scripts (LUC/Lua) attached to emitters/entities yet.
- No script ECS component for arbitrary entity scripts in this phase.
- No command-block authoring model in this phase.

## Implementation Details

- Scope target:
  - Convert `physics3dSystem` from compiled TypeScript execution to Lua-executed core script.
- Source of truth:
  - Core system scripts are part of the core repository and versioned with simulator code.
- Execution model:
  - Simulator boot loads core script(s), validates entrypoint(s), then calls them during `runTics`.
- Failure handling policy:
  - Fail-fast during this testing phase: stop simulation immediately and throw.
- Performance policy:
  - No explicit overhead target in this pitch.
  - Follow sequence: make it work, then make it good, then benchmark and optimize.

## Pre-requisites

- Existing `outside-simulator` ECS world and fixed-tic pipeline (already available).

## Next Logical Pitches

- [External System Script Hooks (System Scripting series: 2)](../pitches/external-system-script-hooks.md)
- [Runtime Command Scripts in Lua (System Scripting series: 3)](../pitches/runtime-command-scripts-in-lua.md)
- [Event Scripts for Engine Emitters (System Scripting series: 4)](../pitches/event-scripts-for-engine-emitters.md)

## Open Questions

- What minimal host API is required for `physics3d` parity without overexposing internals?

## System Scripting Series Context

This pitch is the first step in a 4-pitch system-scripting rollout focused on core-system migration first, then external extensibility, command scripts, and event scripts.
