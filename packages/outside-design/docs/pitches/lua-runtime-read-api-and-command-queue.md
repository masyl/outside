---
Title: "Lua Runtime Read API and Command Queue (Scripting series: 2)"
Category: Core
Summary: Expose safe read/query APIs to Lua and add command-queue mutation with deterministic pre/post hooks around systems and the global tic loop.
---

# Lua Runtime Read API and Command Queue (Scripting series: 2)

## Motivation

After runtime foundations are in place, scripts still need a meaningful and safe way to interact with simulation state. Direct ECS writes from Lua would break engine boundaries and make debugging harder.

We need a controlled interface where scripts can inspect world state and request mutations through validated commands applied at deterministic boundaries.

## Solution

Expose a rich Lua read/query API (global utilities, entities/components queries, and component getters) while enforcing command-only mutations.

Add pre/post hooks around each core ECS system and around the global tic loop. Scripts can enqueue commands during hook/script execution, and the runtime flushes commands at defined hook boundaries.

## Inclusions

- Rich Lua read/query API surface:
  - Global utilities (time/random/math/helpers defined by runtime contract)
  - ECS state queries for entities/components
  - Component/state getter accessors
- No direct ECS writes from Lua to component arrays or raw `bitecs` APIs.
- Command queue API available to Lua for state mutations.
- Command validation layer before application.
- Deterministic command processing at defined flush points.
- Pre/post execution hooks around each core ECS system in the simulator pipeline:
  - `pointer`
  - `pathFollowing`
  - `urge`
  - `pace`
  - `physics3d`
  - `consumption`
- Pre/post execution hooks around the global tic loop.
- Refactor critical runtime constants into config modules and expose them to Lua as read-only runtime values.
- Tests for hook ordering, command ordering, and deterministic command application.

## Exclusions

- No in-world command-block entities/routines in this pitch.
- No command-block grid placement or authoring UX.
- No script editor UI, REPL, or hot-reload workflow.
- No network synchronization design for scripted command streams in this phase.

## Implementation Details

- Mutation policy:
  - Lua can only enqueue commands.
  - Engine-owned runtime applies commands at deterministic boundaries.
- Hook policy:
  - Hooks are additive around existing systems and do not reorder base system execution.
- API policy:
  - Prefer explicit query/get APIs over exposing raw internal data structures.

## Pre-requisites

- [Lua Scripting Runtime Foundations (Scripting series: 1)](../pitches/lua-scripting-runtime-in-simulator.md)

## Next Logical Pitches

- [In-World Command Block Routines (Scripting series: 3)](../pitches/in-world-command-block-routines.md)
- Script debugging and observability tools (runtime traces, per-instance diagnostics).
- Hot-reload and iterative authoring workflow for Lua scripts.

## Open Questions

- What is the exact phase-1 command set (movement, spawn/despawn, component updates, pathing, etc.)?
- Should queue flush happen after every system hook or at selected boundaries for performance?
- Should command failure be fail-fast, per-command soft-fail, or configurable by environment?

## Scripting Series Context

This pitch provides the safe execution contract: scripts can read state and request changes through commands, with deterministic processing boundaries.
