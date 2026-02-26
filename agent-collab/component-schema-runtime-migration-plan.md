# Implementation Plan: Runtime-Loaded ECS Component Schemas (Asset Store Aligned)

## Summary

This plan keeps the existing component-schema migration direction (JSON canonical + Lua projection), but aligns it with bootstrapping goals by making the `Asset Store` the source of truth and treating schema definitions as domain entities that are projected into runtime ECS definitions.

The migration remains scoped: no full system/node editor in this phase, but all contracts needed for self-hosting and recursive ECS are introduced.

## Architectural Principles

1. Asset-store-first source of truth: schema, prefab, and metadata records are loaded from store snapshots, not hard-coded modules.
2. Deterministic tic loop boundaries: store I/O and schema mutation apply only between tics.
3. Recursive ECS compatibility: schema and prefab definitions are representable as entities in a metadata lane.
4. Host/runtime split is explicit: host provides ECS engine + hardware/system primitives; simulation owns data contracts and behavior composition.
5. Backward-safe migration: current TS component imports are preserved via a compatibility bridge during transition.

## Locked Decisions

- Canonical format: `JSON + Lua projection`.
- Runtime source of truth: `Asset Store records` addressed by scoped slugs.
- Live updates in phase 1: additive-only (`new schema`, `new field with default`).
- Breaking schema updates: require world/runtime reset.
- String strategy: IDs in ECS + string catalogs in asset store.
- Prefab scope: include metadata and prefab lineage tracking.
- Node editing UI: out of scope (data model only).
- Store access during tics: forbidden for systems.
- Persistence flow: batched writes, applied between tics.

## Related Files

- `/Users/mathieu/dev/outside/agent-collab/bootstrapping.md`
- `/Users/mathieu/dev/outside/agent-collab/AssetStore.md`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-simulator/src/run.ts`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-simulator/src/world.ts`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-simulator/src/components/index.ts`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-simulator/src/components/components.generated.ts`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-simulator/scripts/gen-component-types.cjs`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-simulator/src/render-schema.ts`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-simulator/src/observers.ts`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-simulator/src/prefabs/bot.ts`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-simulator/src/prefabs/food.ts`
- `/Users/mathieu/dev/outside/.tracks/simulator/packages/outside-inspector-renderer/src/frame.ts`

## Public API and Type Changes

- Add `AssetRecord<TPayload>`:
  - `slug`, `kind`, `version`, `scope`, `createdAt`, `updatedAt`, `payload`, `checksum`
- Add `AssetStoreAdapter` contract:
  - `getManyByKind(kind, scope)`
  - `getBySlug(slug)`
  - `putBatch(records)`
  - `snapshot(scope)`
- Add schema payload types:
  - `ComponentSchemaRecordPayload`
  - `PrefabSchemaRecordPayload`
  - `SystemScriptRecordPayload`
  - `StringCatalogRecordPayload`
  - `WorldSnapshotRecordPayload`
- Add schema runtime types:
  - `SchemaEntity` (metadata-lane representation)
  - `CompiledComponentRegistry`
  - `SchemaSnapshot`
- Add bootstrap APIs:
  - `loadSchemaSnapshotFromStore(scope)`
  - `projectSchemaSnapshotToEntities(snapshot)`
  - `compileRegistryFromSchemaEntities(world, schemaWorld)`
  - `projectSchemasToLuaTables(snapshot)`
- Add mutation APIs:
  - `queueSchemaMutation(mutation)`
  - `drainSchemaMutationQueueAndApply(world)`
  - `validateAdditiveMutation(mutation, snapshot)`
- Keep compatibility APIs:
  - `getComponentByName(name)` and current named exports mapped to registry-backed refs.

## 1. Asset Store Contract and Adapter

### Checklist

- [ ] Define record kinds and slug conventions (`core/...`, `user/...`, `room/...`, `group/...`).
- [ ] Define required metadata on every asset record (timestamps, checksum, version, scope).
- [ ] Implement adapter interface with in-memory backend first.
- [ ] Add backend parity contract for local disk/browser/cloud implementations.
- [ ] Enforce non-goal boundaries: not a logging system, not a cache layer, not generic KV for unrelated app state.

## 2. Boot Snapshot and Deterministic Initialization

### Checklist

- [ ] Add world boot path that loads a store snapshot before simulation start.
- [ ] Build registry only from loaded snapshot.
- [ ] Persist active snapshot hash/version in world state.
- [ ] Ensure identical seed + snapshot hash yields deterministic runtime behavior.
- [ ] Define failure behavior for missing/invalid core schema records at boot.

## 3. Schema-as-Entity Projection (Recursive ECS Alignment)

### Checklist

- [ ] Define metadata-lane entities for component schemas and prefab schemas.
- [ ] Project asset records to schema entities on boot.
- [ ] Keep projection immutable within a tic.
- [ ] Provide read APIs so inspectors/tools can introspect schema entities.
- [ ] Define relation entities for prefab composition and future graph/node linking.

## 4. Runtime Registry Compilation and TS Compatibility Bridge

### Checklist

- [ ] Compile BitECS component refs from schema entities.
- [ ] Replace hard-coded component module dependency path with compiled registry refs.
- [ ] Preserve current import surface for existing systems/tests.
- [ ] Convert current component typegen into type generation from schema records.
- [ ] Mark direct hard-coded component modules as deprecated.

## 5. Between-Tics Mutation Pipeline

### Checklist

- [ ] Introduce mutation queue for schema/prefab/store writes.
- [ ] Disallow direct store writes during tic execution.
- [ ] Apply queued writes in batch between tics.
- [ ] Rebuild or patch snapshot/registry only at safe boundary.
- [ ] Add telemetry and error drain APIs for rejected mutations.

## 6. Slug Scoping and Multi-Tenancy

### Checklist

- [ ] Formalize slug pathing and namespace resolution rules.
- [ ] Resolve schema lookup with precedence (`room` > `group` > `user` > `core` or chosen order).
- [ ] Add collision/conflict validation across scopes.
- [ ] Expose scope-aware listing APIs for editor use.
- [ ] Ensure deterministic scope resolution order.

## 7. Persistence Modes

### Checklist

- [ ] Support per-asset persistence for schemas/prefabs/scripts/catalogs.
- [ ] Support block persistence for whole-world snapshots.
- [ ] Define world snapshot production policy:
  - Autosave every 5 seconds.
  - Also attempt snapshot on `visibilitychange` (hidden), `pagehide`, and `beforeunload`.
  - Snapshot attempts occur only at safe boundaries (between tics).
- [ ] Keep world snapshot persistence off the tic-critical path.
- [ ] Include dates needed for future expiration policies without implementing expiration now.

## 8. Lua Projection Layer

### Checklist

- [ ] Project snapshot-defined schemas into Lua tables for runtime use.
- [ ] Include component/property metadata in Lua projection.
- [ ] Cache projection by snapshot hash.
- [ ] Keep Lua projection read-only from scripts.
- [ ] Expose projection host table (`__outside_schema_host`) for core/external scripts.

## 9. Metadata, Prefabs, and Lineage

### Checklist

- [ ] Add metadata fields for components and properties (label, description, icon, hints).
- [ ] Add prefab metadata with explicit composition graph.
- [ ] Record prefab lineage on spawned entities.
- [ ] Add read APIs for inspector/editor overlays.
- [ ] Keep node editing implementation explicitly out of this phase.

## 10. String Catalog Strategy

### Checklist

- [ ] Store labels/descriptions/icon keys in string catalogs by ID.
- [ ] Keep ECS component data as IDs, not long user-facing text.
- [ ] Add missing-ID fallback behavior and diagnostics.
- [ ] Add scope-aware catalog resolution.
- [ ] Keep inline text only for controlled debug-only fields.

## 11. Stream and Serialization Profiles

### Checklist

- [ ] Define render/inspector serialization profiles as schema-driven lists.
- [ ] Keep parity with current render profile behavior.
- [ ] Exclude new dynamic components unless explicitly profiled.
- [ ] Validate profile definitions against compiled registry.
- [ ] Preserve deterministic observer/snapshot ordering.

## 12. Runtime Update Policy (Phase 1)

### Checklist

- [ ] Allow additive schema updates without restart.
- [ ] Reject removals/renames/type changes in live mode.
- [ ] Return explicit "requires reset" outcomes for breaking changes.
- [ ] Add controlled reload APIs for editor/runtime tooling.
- [ ] Document exact additive-change envelope with examples.

## Master Checklist

- [ ] Schema and prefab source-of-truth moved to asset-store records.
- [ ] Schema definitions represented as entities in a metadata lane.
- [ ] Runtime registry compiled from store snapshot, not hard-coded TS modules.
- [ ] Mutation pipeline is batch/between-tics only.
- [ ] Existing systems run unchanged through compatibility bridge.
- [ ] No system/editor UI scope creep introduced.

## Test Cases and Scenarios

- [ ] Boot snapshot determinism: same seed + same snapshot hash => same outcomes.
- [ ] Asset adapter parity: in-memory/local/cloud adapters pass same contract tests.
- [ ] Slug scope precedence is deterministic and test-covered.
- [ ] Schema entity projection is stable and reversible from snapshot payloads.
- [ ] Compatibility: pointer/pace/urge/pathFollowing/consumption run unchanged via bridge refs.
- [ ] Between-tics batch write applies only after tic boundary.
- [ ] Store write attempted during tic is rejected/queued, never applied inline.
- [ ] Live additive update succeeds and becomes queryable after boundary.
- [ ] Live breaking update is rejected with reset-required signal.
- [ ] Lua projection matches active snapshot hash and metadata content.
- [ ] Prefab lineage is preserved through spawn/composition.
- [ ] Render/inspector profile behavior remains parity-safe.

## Assumptions and Defaults

- Core bootstrap bundle preloads baseline asset records for components, systems, and prefabs.
- Systems do not perform direct store operations during a tic.
- Store latency does not affect tic execution because writes are buffered.
- Hardware/system services remain host-provided and outside self-hosted ECS scope.
- Expiration/deletion policies are deferred, but timestamp fields are mandatory now.
- Phase-1 world-state persistence is interval-based (5s) plus lifecycle snapshot attempts, without requiring a `worldDirty` flag.

## Out of Scope for This Migration

- Full in-game system editor and node graph editor UX.
- Automatic asset expiration and lifecycle GC.
- Replacing host-provided physics/hardware primitives.
- Treating asset store as general-purpose application KV.

## References

- `/Users/mathieu/dev/outside/agent-collab/bootstrapping.md`
- `/Users/mathieu/dev/outside/agent-collab/AssetStore.md`
- `packages/outside-design/docs/pitches/lua-scripting-runtime-in-simulator.md`
- `.tracks/simulator/packages/outside-design/docs/deliveries/2026-02-24-1119-remaining-ecs-core-systems-to-lua-runtime/plan.md`
- `.tracks/simulator/packages/outside-design/docs/pitches/in-world-command-block-routines.md`
