---
Title: "External System Script Hooks (System Scripting series: 2)"
Category: Core
Summary: Add pre/post execution hooks so the simulator can load and run external system scripts from mods or users.
---

# External System Script Hooks (System Scripting series: 2)

## Motivation

After validating Lua execution with a core system script, the next step is extensibility. Mods and users need controlled insertion points to run system logic without modifying core code.

Hook points around core systems are required so external scripts can observe and influence simulation flow in deterministic, auditable boundaries.

## Solution

Add pre/post execution hooks around each core ECS system and around the global tic loop, then allow loading external "system scripts" into these hook phases.

External scripts are discovered and registered through a controlled loader, then executed in configured hook slots with deterministic ordering.

## Inclusions

- Pre/post hook points around core systems:
  - `pointer`
  - `pathFollowing`
  - `urge`
  - `pace`
  - `physics3d`
  - `consumption`
- Pre/post hook points around global tic loop.
- External system-script loader for mod/user-provided scripts.
- Script registration model for hook phase + ordering metadata.
- Deterministic execution order across multiple external scripts.
- Runtime error containment policy for failing external scripts.
- Tests covering hook order, registration order, and failure isolation behavior.

## Exclusions

- No command-script invocation model in this pitch.
- No event-script trigger/emit model in this pitch.
- No full command-block/grid routine authoring in this pitch.
- No network sync protocol for external scripts in this phase.

## Implementation Details

- Hook contract:
  - External scripts run only at explicit pre/post boundaries.
  - Base core system order is unchanged.
- Loader contract:
  - Scripts are explicit registrations, not implicit filesystem execution.
- Determinism contract:
  - Ordering rules are stable and test-backed.

## Pre-requisites

- [Physics3D Core System Script Runtime (System Scripting series: 1)](../pitches/lua-scripting-runtime-in-simulator.md)

## Next Logical Pitches

- [Runtime Command Scripts in Lua (System Scripting series: 3)](../pitches/runtime-command-scripts-in-lua.md)
- [Event Scripts for Engine Emitters (System Scripting series: 4)](../pitches/event-scripts-for-engine-emitters.md)

## Open Questions

- How should mods/users declare script load order (priority, before/after, or both)?
- What sandbox/capability limits are required for externally supplied scripts?
- Should failing scripts be disabled for the current tic, current world, or globally?

## System Scripting Series Context

This pitch introduces external extensibility through deterministic hook boundaries after core-script runtime has been validated.
