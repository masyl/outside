# Component Schema Runtime - Architecture Intent and Rationale

## Purpose

This document explains the intent behind the runtime component-schema migration and the rationale for the main design choices.

The implementation plan tracks tasks. This document explains why those tasks exist and what outcomes they are expected to produce.

## Problem Statement

Outside is moving toward bootstrapping/self-hosting behavior where more of the simulation definition is data-driven and portable.

The current hard-coded TypeScript component definitions limit that goal because:

- component shape and availability are tied to compiled code,
- dynamic authoring in running worlds is constrained,
- schema evolution is difficult to align with an asset-driven runtime model.

## Design Intent

The migration optimizes for:

1. **Self-hosting direction**: component schemas can be persisted and loaded as assets.
2. **Deterministic runtime behavior**: systems should run with stable schema assumptions per tic.
3. **Runtime editability**: additive schema changes can be applied without full rebuilds.
4. **Operational clarity**: clear boundaries between simulation logic and persistence I/O.
5. **Incremental migration safety**: existing simulator code keeps working during transition.

## Core Choices and Why

## 1. Asset Store as source of truth

### Choice

Treat component schemas, prefab schemas, string catalogs, and world snapshots as asset-store records addressed by scoped slugs.

### Why

- Aligns with the "recursive ECS" and bootstrapping direction.
- Makes schema content portable across runtime hosts.
- Enables preloading core assets and later user/room-scoped overrides.

### Expected outcome

Schema definitions become data that can be versioned, copied, and loaded independently from TypeScript module structure.

## 2. Snapshot-based runtime registry instead of process-global singleton

### Choice

At world boot: load snapshot -> validate -> project to schema entities -> compile registry -> run with that registry.

### Why

- Prevents global mutable schema state leaking across worlds.
- Makes replay/debug easier by pinning behavior to a snapshot hash.
- Supports multiple worlds with different schema sets.

### Expected outcome

Each world executes against an explicit schema snapshot, improving predictability and isolation.

## 3. Freeze registry for the tic; apply changes between tics only

### Choice

No direct store reads/writes during a tic. Mutations are queued and applied at safe boundaries.

### Why

- Avoids nondeterministic mid-tic schema/view changes.
- Prevents latency and async persistence from affecting simulation step timing.
- Keeps core system behavior coherent within each tic.

### Expected outcome

Systems can assume stable schema semantics during execution, while still supporting runtime updates.

## 4. Schema-as-entity projection

### Choice

Represent schema definitions in a metadata lane as ECS entities, then compile runtime refs from that representation.

### Why

- Aligns the data model with the long-term goal of in-world tooling.
- Unifies introspection paths for inspector/editor/debug.
- Avoids maintaining parallel conceptual models ("assets" vs "runtime objects").

### Expected outcome

Future editor capabilities can be built on top of an already ECS-native schema representation.

## 5. String IDs + catalog lookup

### Choice

Store IDs in ECS fields and resolve user-facing text from catalogs.

### Why

- Avoids large mutable text payloads in hot simulation paths.
- Supports localization/versioning later.
- Keeps stream payloads and runtime memory profiles more predictable.

### Expected outcome

Metadata remains flexible for UI/editor use without bloating core simulation state.

## 6. Persistence policy for phase 1

### Choice

World snapshots are attempted every 5 seconds and on browser lifecycle events (`visibilitychange` hidden, `pagehide`, `beforeunload`).

### Why

- Meets immediate goal: recover state across page refreshes.
- Avoids per-tic persistence overhead.
- Treats `beforeunload` as best-effort only.

### Expected outcome

Practical recovery behavior with low steady-state runtime cost.

## Alternatives Considered

## A. Keep process-global component registry

Rejected because it couples worlds and makes deterministic snapshot reasoning weaker.

## B. Allow direct store access inside systems

Rejected because it introduces timing variability and side effects inside tic execution.

## C. Persist world every tic

Rejected for phase 1 due to unnecessary write frequency and no requirement for event-by-event replay.

## Risks and Mitigations

- **Risk**: boundary apply causes stutter when schema updates are large.  
  **Mitigation**: batch updates, compile candidate registry off critical path, atomic swap.

- **Risk**: scope precedence creates confusion.  
  **Mitigation**: explicit precedence rules and deterministic tests.

- **Risk**: adapter behavior diverges across memory/local/cloud backends.  
  **Mitigation**: adapter conformance test suite.

## Validation Signals

Success should be observable through:

- deterministic replay for same seed + schema snapshot hash,
- no store I/O during tic execution,
- additive updates applied only at boundaries,
- page refresh recovery from latest snapshot,
- legacy system code still functioning via compatibility bridge.

## Open Questions

- Final scope-precedence order for schema resolution.
- Conflict policy when same slug appears in multiple scopes with incompatible payloads.
- Whether world snapshots stay interval-only or gain optional manual checkpoint APIs in phase 1.

## Change Expectations

This rationale is intentionally changeable. As runtime constraints or product goals evolve, this document should be updated to capture new intent and tradeoffs.
