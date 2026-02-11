---
Title: "Runtime Command Scripts in Lua (System Scripting series: 3)"
Category: Core
Summary: Add Lua command scripts that can be registered and invoked during simulation runtime to execute reusable command routines.
---

# Runtime Command Scripts in Lua (System Scripting series: 3)

## Motivation

Hooked system scripts are useful for pipeline-level behavior, but we also need reusable script routines that can be called on demand during runtime.

Command scripts provide a focused way to define callable behavior units without requiring direct edits to core systems.

## Solution

Introduce a "command script" mechanic where Lua scripts are registered as callable runtime commands. Engine systems, tools, or scripted logic can invoke these command scripts by ID with explicit parameters.

Command scripts run in the scripting runtime contract and perform simulation changes through approved command pathways.

## Inclusions

- Command script registry keyed by command-script ID.
- Invocation API to call command scripts during runtime with typed parameters.
- Lifecycle for command scripts (load/validate/execute/error).
- Deterministic invocation ordering when multiple command scripts are queued in a tic.
- Integration with existing simulation command application boundaries.
- Tests for command-script registration, invocation behavior, and deterministic outcomes.

## Exclusions

- No event-emitter trigger system in this pitch.
- No in-world command-block/grid authoring model in this pitch.
- No visual command-script editor in this phase.
- No broad script marketplace/distribution tooling.

## Implementation Details

- Invocation model:
  - Command scripts are called explicitly by ID.
  - Parameters are validated before execution.
- Runtime model:
  - Command scripts share the runtime constraints established in previous pitches.
- Determinism model:
  - Command-script execution order is stable and reproducible.

## Pre-requisites

- [External System Script Hooks (System Scripting series: 2)](../pitches/external-system-script-hooks.md)

## Next Logical Pitches

- [Event Scripts for Engine Emitters (System Scripting series: 4)](../pitches/event-scripts-for-engine-emitters.md)
- In-world command-block command-script authoring and routine translation tools.

## Open Questions

- Should command scripts be sync-only in phase 1, or can they yield/defer?
- What parameter type system is required for robust validation?
- Should command scripts be allowed to call other command scripts recursively?

## System Scripting Series Context

This pitch introduces callable runtime scripting units that sit between low-level system hooks and event-driven scripts.
