---
Title: Blocky / Scratch-style UI for command blocks or entities
Category: Ideas
Status: draft
---

# Blocky / Scratch-style UI for command blocks or entities

## Motivation

Users and designers need a visual, block-based way to add or edit events and commands for entities, without writing code. A Scratch- or mblock-style interface makes it easier to compose behaviors and to experiment with command blocks or entity logic.

## Solution

Introduce a **blocky UI** where users compose command blocks (e.g. drag-and-drop or click-to-add) that map to existing simulation or timeline commands. Blocks represent actions or events; wiring them together produces a sequence or graph that the game or simulator can execute. This pitch scopes the UI and its mapping to the current command/event API, not a full scripting language.

## Inclusions

- A **block palette** of available command or event types (e.g. move, wait, follow, spawn).
- **Drag-and-drop or click-to-add** to place blocks and connect them (e.g. sequence or simple branching).
- **Mapping** from blocks to the existing command/event API (e.g. timeline commands, simulator spawn/urge).
- A way to **target entities** (e.g. by selection or by label/ID) when blocks refer to "command blocks" or entities.
- Visual style inspired by block-based editors (blocky, Scratch-like); exact layout and styling are flexible.

## Exclusions

- No full scripting or text-based language.
- No custom block definition or user-created blocks in this pitch.
- No persistence of block programs (can be a follow-on).

## Pre-requisites

- Existing command or event API (e.g. timeline, simulator run/spawn) that blocks can map onto.
- Optional: entity labels or IDs if blocks target specific entities.

## Open Questions

- Should blocks map to timeline commands, simulator API, or both?
- Is the primary use case "command blocks" in the world (in-world objects that run a sequence) or an editor overlay for designing behaviors?

## Next Logical Pitches

- Persist and load block programs.
- Custom block definitions or templates.
- In-world "command block" entities that execute a block sequence.

## Implementation Details (use sparingly)

- Blocks can emit commands or events that the client sends to the simulation core or timeline. If the simulator exposes an event queue or the timeline has a command API, the block UI can target that. No change to the ECS core is required unless we add "command block" entities that store and run a sequence.
