# Self-Hosting and Bootstrapping

## Why this matters

Outside is moving toward a bootstrapping model where more of the platform is defined and operated *inside* the simulation runtime.

In practical terms, this means reducing hard dependencies on host-side compiled definitions whenever that behavior can be represented as data, scripts, and ECS entities.

The goal is not total independence from the host runtime. The goal is to maximize portability, composability, and runtime authoring while keeping deterministic simulation behavior.

## Core intent

- Keep host responsibilities minimal and explicit.
- Move simulation-facing definitions (schemas, prefabs, scripts, metadata) into runtime-loadable assets.
- Treat ECS building blocks as first-class runtime data so worlds can evolve without compile-time coupling.

## Recursive ECS direction

The first major self-hosting candidate is ECS assets:

- Components
- Prefabs
- Systems (where appropriate)
- Supporting metadata and catalogs

These can be described in JSON/Lua and onboarded as runtime assets. When loaded, they are projected into ECS-readable runtime structures.

This enables:

- Dynamic extension of running worlds
- Better portability across hosts
- Future in-world tooling (for example, system/schema authoring UX)

## Practical boundaries (what remains host-provided)

Some capabilities are expected to stay host-owned, either temporarily or permanently:

### Physics engine

Outside should consume physics as a host capability (for example Jolt-family integrations), exposed through a narrow simulation API.

### Hardware and platform I/O

- Networking
- Audio
- Controllers and input devices
- Microphones
- GPU-accelerated rendering

These remain host services. Simulation code should target stable abstractions, not host-specific APIs.

### Terminal emulation

Terminal behavior can be integrated into experiences, but terminal implementation is likely better reused from existing standards-compliant runtimes than rebuilt as core ECS mechanics.

## Asset Store role

The Asset Store is the persistence backbone for simulation-facing assets.

It should support:

- Flat key/value-friendly structure with scoped slugs
- In-memory + persisted implementations
- Non-blocking write path
- Batch processing between tics
- Preloaded baseline core assets

It can store:

- Entities and their components
- Prefab definitions
- System/component schema source + metadata
- Source text/code payloads
- World snapshot blocks
- Other simulation-related assets

## Runtime safety rules

- Systems do not read/write the store during a tic.
- Store writes are queued and applied between tics.
- Snapshot loading/validation occurs at safe boundaries.
- Logging and caching are separate concerns, not asset-store concerns.

## World persistence (phase 1 policy)

- Attempt world snapshots every 5 seconds.
- Also attempt snapshots on browser lifecycle events:
  - `visibilitychange` (hidden)
  - `pagehide`
  - `beforeunload` (best effort)

This policy is intended to recover state between page refreshes without per-tic persistence cost.

## Expected outcomes

- More runtime-editable simulation definitions
- Better cross-host portability
- Clearer host vs simulation boundaries
- Stronger determinism through boundary-controlled persistence/mutation

## Non-goals

- Full replacement of host-provided hardware/physics capabilities
- Treating the asset store as a generic app database
- Automatic asset expiration in this phase
