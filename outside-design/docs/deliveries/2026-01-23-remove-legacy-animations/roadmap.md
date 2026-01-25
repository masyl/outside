---
title: 'ECS Transition Roadmap (WorldState-first + Parallel Renderer)'
delivery_date: '2026-01-23'
status: 'planning'
type: 'roadmap'
related_documents:
  - './ecs-technical-recommendstion.md'
  - './plan.md'
  - './testing.md'
---

# ECS Transition Roadmap (WorldState-first + Parallel Renderer)

This roadmap tracks the **todos** and **success criteria** for transitioning toward an ECS-style architecture **without breaking the current game**, using a **parallel renderer pipeline** and a **late swap** strategy.

## Links

- [Technical Recommendation (ECS)](./ecs-technical-recommendstion.md)
- [Delivery Plan](./plan.md)
- [Testing Notes](./testing.md)

## Goals (what “done” means)

- Keep **simulation** source-of-truth as `WorldState` + `Action` + `reducer(...)` during early adoption.
- Introduce ECS-style “systems” that **emit Actions** (to preserve determinism + timeline replay).
- Simplify rendering by moving toward a unified renderer-side model:
  - `Renderable` + `SpriteSpec` (bots + terrain)
  - one update loop (create/update/delete) and one index
- Execute migration via **parallel pipelines** and **late swap** (minimize risk).

## Non-goals (for this iteration)

- Replace the reducer/store with a full component-store ECS runtime.
- Change TimelineManager’s replay strategy (history unit remains Action-based).
- Introduce new gameplay mechanics; this is an architectural transition.

## Workstreams

- **W1: ECS-style simulation systems (Action-emitting)**
- **W2: Unified rendering pipeline (parallel, late swap)**
- **W3: Parity, debugging, and test gates**

## Agent workflow (incremental loop)

To keep this migration safe and reviewable, the agent should work in small increments using this loop:

1. **Complete one todo**
   - Pick the smallest meaningful unchecked item from “Milestones / Todos”.
   - Implement it without changing defaults/behavior unless the todo explicitly requires it.

2. **Write tests and pass all of them**
   - Add/adjust tests appropriate to the change (unit/integration as needed).
   - Run the full relevant test suite(s) and ensure everything is green before moving on.

3. **Update `roadmap.md`**
   - Mark the todo as completed (`[x]`).
   - Add short notes under the relevant phase if the implementation differed from expectations.
   - If new work is discovered, add it as a new checkbox item (keep it scoped and actionable).

4. **Commit**
   - Create a single commit for the completed todo (include tests + roadmap updates in the same commit).
   - Use a message that explains *why* the step exists (e.g. “add renderables builder for unified renderer”).

Then repeat until the next todo.

## Milestones / Todos

### Phase 0: Renderer data model (no behavior changes)

- [x] Define renderer-side types: `Renderable`, `RenderKind`, `SpriteSpec`
- [x] Implement `buildRenderables(world: WorldState): Renderable[]`
  - [x] **Terrain extraction**: renderables are per `TerrainObject` rectangle (not per-tile)
  - [x] **Ordering**: terrain `z = createdAt`, bots use a large z-base so they stay above terrain
  - [x] **Coordinate contract**: `Renderable.position` is grid space; renderer will own conversion to display space

Notes:
- Implemented in `outside-client/src/renderer/unified/renderables.ts` with unit tests in `renderables.test.ts`.
- `SpriteSpec.textureKey` uses `terrain:<type>` for terrain and `bot` for bots (resolution policy is a later todo).

### Phase 1: Unified renderer implementation (unused by default)

- [ ] Implement `UnifiedRenderer` / `UnifiedRenderSystem`
  - [ ] `displayIndex: Map<EntityId, DisplayObject>` (single index for bots + terrain)
  - [ ] Create/update/delete lifecycle
  - [ ] Z-ordering strategy (`zIndex`, sorting, container structure)
  - [ ] Asset resolution policy (`SpriteSpec.textureKey` -> texture/slice/tiling)
- [ ] Ensure **no coupling** to simulation; renderer consumes only `Renderable[]` (derived view)

### Phase 2: Parallel integration (feature-flagged)

- [ ] Add `rendererMode = "legacy" | "unified" | "dual"` to `GameRenderer`
- [ ] Mount two roots:
  - [ ] `legacyRoot` (current `terrain.ts` + `objects.ts`)
  - [ ] `unifiedRoot` (new unified pipeline)

### Phase 3: Dual mode parity (shadow-run)

- [ ] Dual mode behavior:
  - [ ] Update both pipelines every frame
  - [ ] Legacy visible; unified hidden but running
- [ ] Debug parity checks (debug-only):
  - [ ] **Counts parity**: display objects per kind (bots / terrain)
  - [ ] **Position parity**: per-entity position match within tolerance (grid->display conversion + zoom)
  - [ ] **Ordering parity**: terrain stacking and bot-over-terrain consistency
  - [ ] **Lifecycle parity**: create/remove events match (no orphan DisplayObjects)
  - [ ] **Memory / perf**: no unbounded growth in display indices

### Phase 4: Late swap (flip default, keep rollback)

- [ ] Flip default to `"unified"`
- [ ] Keep `"legacy"` and `"dual"` for quick rollback/diagnosis
- [ ] Bake period while monitoring parity metrics and player-visible regressions

### Phase 5: Remove legacy (only after stable swap)

- [ ] Remove legacy update paths (`terrain.ts`/`objects.ts` pipeline usage) after swap is stable
- [ ] Delete or deprecate legacy helpers only after:
  - [ ] unified mode has been default for a while
  - [ ] rollback is no longer needed
- [ ] Remove feature flag and dual-mode scaffolding

## Success Criteria (exit gates)

### Correctness

- [ ] **Visual parity** in dual mode for:
  - [ ] bot placement/movement
  - [ ] terrain rendering + stacking order
  - [ ] zoom behavior (no size regressions)
- [ ] **Selection/picking parity** (if applicable): unified pipeline supports the same selection/hover/debug affordances as legacy
- [ ] **No simulation changes**: replay/time-travel and reducer invariants remain correct

### Performance & Stability

- [ ] Unified pipeline does not introduce noticeable FPS drops vs legacy in normal play
- [ ] No memory leaks (DisplayObjects cleaned up; indices stable)
- [ ] Dual mode overhead is acceptable and can be disabled outside debug

### Rollout Safety

- [ ] One-line rollback available (`rendererMode = "legacy"`)
- [ ] Late swap is small and controlled (switch default mode only)
- [ ] Legacy code removal happens only after a stable bake period

## Open Questions / Decisions to Track

- **Terrain render granularity**: per-rectangle vs per-tile renderables
- **Z-order definition**: `createdAt` mapping and how bots layer above terrain
- **Asset resolution**: rules for sprite sheets, tiling sprites, and placeholder fallbacks
- **Interaction model**: unified hit-testing + selection overlays (bots and terrain)
- **Parity thresholds**: numeric tolerances for position comparisons under zoom/offsets

