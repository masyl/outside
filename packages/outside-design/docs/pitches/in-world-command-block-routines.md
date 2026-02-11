---
Title: "In-World Command Block Routines (Scripting series: 3)"
Category: Core
Summary: Model commands as registered entities placed on a grid with parameter entities, enabling chain execution, stepping, reusable routines, and translation to Lua.
---

# In-World Command Block Routines (Scripting series: 3)

## Motivation

Lua scripting unlocks power, but many gameplay sequences are easier to reason about visually in-world. A command-block model allows designers and players to build logic directly in the simulation space.

To avoid maintaining two separate behavior systems, in-world command blocks should map to the same runtime semantics used by Lua scripts.

## Solution

Introduce command-block entities where each available command is a registered command entity type. Command entities are placed in chains on a grid and reference parameter entities for typed inputs.

Chains can be stepped through directly by the simulator or translated into Lua scripts registered by `scriptId`. Both execution paths produce the same command-queue behavior.

## Inclusions

- Command registration contract for command-block-compatible commands:
  - Stable command identity
  - Parameter schema
  - Validation hints
- ECS representation for command blocks and parameter nodes.
- Grid-compatible link model for chaining command nodes and parameter nodes.
- Routine model:
  - Capture chain or sub-chain as reusable routine
  - Reapply/instantiate routine in multiple locations
- Step execution mode for command chains (debuggable, deterministic stepping).
- Chain-to-Lua translation flow that outputs Lua scripts compatible with the scripting runtime.
- Script registration integration so translated routines can run through `scriptId`/`instanceId` lifecycle.
- Tests proving semantic parity between stepped chain execution and translated Lua execution for the same routine.

## Exclusions

- No full visual editor or drag-and-drop UI in this pitch.
- No multiplayer sharing/versioning UX for routine assets.
- No advanced compiler optimizations for generated Lua in phase 1.
- No non-grid authoring mode in this phase.

## Implementation Details

- Semantic contract:
  - Command-block stepping and Lua translation both target the same command queue.
  - Same validation rules apply regardless of authoring path.
- Parameter model:
  - Parameter entities are typed and referenced by command entities instead of embedding loose untyped values.
- Routine model:
  - Routines are first-class chain descriptors, allowing replay and reuse.

## Pre-requisites

- [Lua Runtime Read API and Command Queue (Scripting series: 2)](../pitches/lua-runtime-read-api-and-command-queue.md)

## Next Logical Pitches

- Command-block editor and in-world authoring UX.
- Debug visualizations for active chains, current step pointer, and command outcomes.
- Routine asset packaging, sharing, and version compatibility tools.

## Open Questions

- What exact grid-linking model should be used (adjacency, directional edges, or explicit link components)?
- How should routine boundaries be represented (start/end markers, graph roots, or tags)?
- Should Lua translation happen eagerly at routine creation time or lazily at runtime?
- What error surface should users see when chain structure is invalid?

## Scripting Series Context

This pitch adds in-world authoring semantics on top of the runtime contract introduced in earlier pitches, while preserving one execution model.
