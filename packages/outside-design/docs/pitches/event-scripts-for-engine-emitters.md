---
Title: "Event Scripts for Engine Emitters (System Scripting series: 4)"
Category: Core
Summary: Add event-script mechanics so entities and engine emitters can trigger registered scripts during simulation.
---

# Event Scripts for Engine Emitters (System Scripting series: 4)

## Motivation

Many gameplay behaviors are naturally event-driven (collision, consumption, state transitions, custom emitter signals). We need a script mechanism that reacts to these events without hardcoding all reactions in core systems.

An event-script layer lets entities and engine emitters trigger registered behavior in a modular way.

## Solution

Add an event-script mechanic (LUC/Lua) where scripts are registered to event channels or emitter types and triggered by core engine emitters and entity-level emitters during simulation.

Triggered event scripts execute through the runtime contract with deterministic processing and explicit error handling.

## Inclusions

- Event-script registry for mapping event channels/emitter identifiers to script handlers.
- Trigger API for core engine emitters and entity emitters.
- Event payload contract with typed/validated inputs.
- Deterministic event-script dispatch order inside a tic.
- Integration with existing runtime command pathways for state mutation.
- Tests for trigger correctness, dispatch ordering, and failure isolation.

## Exclusions

- No full generalized pub/sub networking layer in this pitch.
- No visual event graph editor in this phase.
- No guarantee of backward-compatible event schemas across major engine versions (unless specified later).

## Implementation Details

- Dispatch model:
  - Event emitters push trigger records into a deterministic dispatch phase.
  - Registered handlers execute in stable order.
- Safety model:
  - Script failures are isolated and reported without corrupting core loop progression.
- Naming model:
  - Confirm whether "LUC" is a distinct dialect/runtime label or intended as Lua naming in docs and APIs.

## Pre-requisites

- [Runtime Command Scripts in Lua (System Scripting series: 3)](../pitches/runtime-command-scripts-in-lua.md)

## Next Logical Pitches

- Event debugging tooling (trace timelines, handler profiling, replay).
- Schema versioning strategy for emitted events.
- In-world event emitters authoring tools for designers/modders.

## Open Questions

- Is "LUC" intended as a distinct script flavor, or should all event scripts be standardized as Lua?
- What default event channels are in phase 1 (collision, consumed, custom entity signals, etc.)?
- Should one failing handler block the rest of the handlers for the same event?

## System Scripting Series Context

This pitch completes the 4-part split by adding event-driven scripting on top of core system scripts, external hooks, and command scripts.
