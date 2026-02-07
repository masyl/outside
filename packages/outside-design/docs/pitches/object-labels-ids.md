---
Title: Labels or IDs when creating objects via commands
Category: Ideas
Status: draft
---

# Labels or IDs when creating objects via commands

## Motivation

When creating entities via commands (e.g. spawn a bot, spawn a floor tile), users and scripts need a way to refer to them later: for debugging, for scripting ("move the bot named X"), or for the blocky UI to target "command blocks" by name. Without optional labels or stable IDs, entities are only addressable by internal entity ID, which is opaque and may change across runs.

## Solution

Add **optional label or ID** when creating entities through spawn helpers (e.g. spawnBot, spawnFloorTile). Expose this in the debug overlay or world state API so that scripts and UI can resolve "entity named X" or "entity with label Y." The pitch does not prescribe a full naming or persistence system; it only adds the optional field and visibility.

## Inclusions

- **Optional label or ID** parameter on spawn APIs (e.g. `spawnBot(world, { ..., label: 'leader' })` or `id: 'bot-1'`).
- **Visibility** of the label/ID in at least one of: debug overlay, world state dump, or observer API.
- Uniqueness is not required in this pitch (duplicate labels allowed); enforcement can be a follow-on.
- Support for entities created in **outside-simulator** (and any client-side spawn that mirrors them).

## Exclusions

- No full naming system (e.g. global namespace, reserved names).
- No persistence of labels across save/load in this pitch.
- No UI for editing labels after creation (can be follow-on).

## Pre-requisites

- Existing spawn helpers (e.g. spawnBot, spawnFloorTile) in outside-simulator or client.
- Debug overlay or world observer that can be extended to show the new field.

## Open Questions

- Label vs ID: human-readable string vs stable opaque ID, or both?
- Should the blocky UI or timeline commands accept labels to target entities?

## Next Logical Pitches

- Enforce unique labels or namespaces.
- Persist labels in save/load.
- UI to rename or assign labels after spawn.

## Implementation Details (use sparingly)

- In **outside-simulator**, add an optional component or field (e.g. **Label** or **DebugId**) on entities. Include it in spawn helpers (e.g. spawnBot, spawnFloorTile) as an optional argument. Expose it in any debug or observer API that returns entity state (e.g. world state for debugging, or a simple `getEntityByLabel(world, label)` if needed). The ECS pattern (bitecs) can store the label as a string component or a number mapping to a string table; exact representation can be decided at plan time.
