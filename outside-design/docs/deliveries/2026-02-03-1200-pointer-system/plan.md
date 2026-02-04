# Implementation Plan: Pointer System — In-Game Pointer and Pointable

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

Pointer state (current tile, optional entity under pointer) and viewport state (which entity the viewport follows) are **simulation/ECS concepts** implemented in outside-simulator. The simulator exposes APIs to set and read pointer tile, resolve "what is at (x,y)", and get/set the viewport follow target. Any renderer (Storybook first) **reads** this state from the simulation and **writes** input (pointer move, click actions) into the simulation; it does not own pointer or viewport state. Storybook then draws the pointer visual and positions the camera from simulation state.

## Architectural Principles

1. **Pointer and viewport state live in the simulation (ECS)** — Not in the renderer. A Pointer entity (or world-level state) holds current tile (x, y). A View entity holds IsViewportFocus (ref to followed entity). Both are created and updated in the simulator.
2. **Resolution "what is at (x,y)" is a simulation API** — The simulator exposes a function that, given tile (x, y), returns empty | floor | wall | bot and optional eid, by querying PointerTarget and existing components. Renderers call this; they do not duplicate resolution logic.
3. **Renderers are consumers** — They call setPointerTile(world, x, y) on pointer move; they call resolveEntityAt(world, x, y) (or read pointer state that includes resolved entity) for visuals; they call setViewportFollowTarget(world, eid) on click-bot; they read getViewportFollowTarget(world) to position the camera. No pointer or viewport state stored in React/renderer.
4. **PointerTarget is a single tag** — On FloorTile, Obstacle (wall), and bot prefabs. Wall visual = same as floor (100% opacity) per pitch.
5. **Tile-only** — Floor grid resolution (integer tile); no sub-tile.

---

## 1. Simulator: PointerTarget and viewport (ECS)

### Checklist

- [ ] Add **PointerTarget** tag component; register in components index and codegen.
- [ ] Add **IsViewportFocus** component (ref to entity, same pattern as FollowTarget); add **View** tag. Register and codegen.
- [ ] Add PointerTarget to spawnFloorTile, spawnWall, and bot prefab.
- [ ] **View entity**: in world-defaults, add **addViewEntity(world)** that creates one entity with View + IsViewportFocus (target eid 0 = none). Call from createWorld. Export addViewEntity.

### Notes

- IsViewportFocus.eid[viewEid] = followed entity id; 0 means no follow. View entity is the single "camera/view" entity in the world.

---

## 2. Simulator: Pointer state (ECS)

### Checklist

- [ ] **Pointer entity or world-level pointer state**: store current tile (x, y) in the simulation. Option A: a dedicated Pointer entity with a Position-like component for tile (e.g. PointerTile with x, y). Option B: world.pointerTile = { x, y } on SimulatorWorld. Pitch says "lives in the simulation"; ECS-native is a Pointer entity with tile (x, y). Prefer **Pointer entity** with component(s) for tile (e.g. PointerTileX, PointerTileY or single struct).
- [ ] At world creation, create the Pointer entity (in world-defaults or createWorld) with initial state **hidden** (e.g. tile set to NaN or a sentinel so renderers do not draw until first pointer move).
- [ ] **API setPointerTile(world, x, y)**: update the Pointer entity’s tile to (x, y). Export from simulator.
- [ ] **API getPointerTile(world)**: return { x, y } from the Pointer entity; when pointer is cleared/hidden, return a value renderers can detect (e.g. NaN) so they do not draw. Export from simulator.
- [ ] **API clearPointerTile(world)**: clear the pointer location so it is hidden (e.g. when mouse leaves viewport or app loses focus). Export from simulator.

### Notes

- If using world-level state (world.pointerTile), extend SimulatorWorld type and set/get in the API. Either approach is valid; plan assumes one Pointer entity for consistency with View entity. When cleared, pointer is "hidden" and its location is empty; getPointerTile returns NaN (or similar) so renderers know not to draw.

---

## 3. Simulator: Resolve "what is at (x, y)" (ECS)

### Checklist

- [ ] **API resolveEntityAt(world, x, y)** (or similar name): returns { kind: 'empty' | 'floor' | 'wall' | 'bot', eid?: number }. Logic: query bots (Position, ObstacleSize, PointerTarget)—if any bot’s center distance to (x+0.5, y+0.5) < radius, return that bot (bot takes precedence). Else query FloorTile + PointerTarget at Position (x, y); if found, return floor or wall depending on Obstacle (wall if has Obstacle). Else return empty. Implement in simulator (e.g. pointer.ts or world-query.ts). Export from simulator.

### Notes

- Resolution uses only simulation data (PointerTarget, FloorTile, Walkable, Obstacle, Position, ObstacleSize). Single tag; kind is derived from existing components.

---

## 4. Simulator: Viewport follow API

### Checklist

- [ ] **API getViewportFollowTarget(world)**: return the eid stored in IsViewportFocus for the View entity (or 0 if none). Export from simulator.
- [ ] **API setViewportFollowTarget(world, eid)**: set IsViewportFocus.eid[viewEid] = eid for the View entity. Export from simulator.
- [ ] Export removeEntity (and addComponent, removeComponent, setComponent as needed) so renderers can perform click actions (spawn floor, toggle wall, remove tile) via simulation.

---

## 5. Storybook: Read simulation state and write input

### Checklist

- [ ] **Pointer**: On pointer move in viewport, compute tile (x, y) from viewBox/screen coords (using view center from getViewportFollowTarget for transform). Call **setPointerTile(world, x, y)**. When the mouse leaves the renderer (viewport or app loses focus), call **clearPointerTile(world)** so the pointer is hidden and its location emptied. Do not store pointer tile in React state; read current tile from **getPointerTile(world)** for rendering (and resolveEntityAt for visual style).
- [ ] **Viewport center**: Each render, read **getViewportFollowTarget(world)** and that entity’s Position. Use as viewCenter for toX/toY transform so the camera centers on the followed entity. When no follow target (0), viewCenter = (0, 0).
- [ ] **Pointer visual**: From getPointerTile(world) and resolveEntityAt(world, x, y), draw the pointer box only when the pointer is **visible** (location is finite, i.e. not cleared): default 50% dotted white; floor/wall 100% dotted white; bot solid green. When pointer is hidden (cleared), do not draw the pointer. Cursor = hand when pointer visible and kind !== 'empty', else default.
- [ ] **Demo clicks**: On click, get tile from pointer, call resolveEntityAt(world, x, y). Dispatch: empty → spawnFloorTile(world, x, y, true); floor → removeComponent(Walkable), addComponent(Obstacle); wall → removeEntity(world, eid); bot → setViewportFollowTarget(world, eid). All mutations in the simulation; then invalidate/force re-render so Storybook reads updated state.

### Notes

- Storybook must not hold pointer tile or follow target in local state; it must read from the world every time (or after invalidate). This keeps the simulation as the single source of truth.

---

## 6. Storybook: Viewport and pointer event wiring

### Checklist

- [ ] SimulatorViewport (or equivalent): pointer move/down/leave events that convert client coords to viewBox, then to world tile using current viewCenter (from getViewportFollowTarget + Position). Call setPointerTile on move; on **pointer leave** (mouse leaves viewport or app loses focus), call clearPointerTile and invalidate so the pointer is hidden and its location emptied; dispatch click handler on down.
- [ ] Ensure viewCenter is derived from simulation (getViewportFollowTarget → entity Position) so that when follow target moves (e.g. bot walking), the view updates on the next frame from simulation state.

---

## Master Checklist

- [ ] Simulator: PointerTarget, View + IsViewportFocus, View entity, Pointer entity (or world pointer state), setPointerTile, getPointerTile, clearPointerTile, resolveEntityAt, getViewportFollowTarget, setViewportFollowTarget; prefabs add PointerTarget; pointer initial state hidden.
- [ ] Storybook: no local pointer/viewport state; read from simulation; setPointerTile on move; on pointer leave call clearPointerTile (pointer hidden, location emptied); pointer visual only when pointer visible (finite tile); cursor from getPointerTile + resolveEntityAt; viewport center from getViewportFollowTarget; demo clicks mutate simulation then invalidate.
- [ ] Storybook: viewport and pointer events wired (move, leave, down); viewCenter from simulation.

---

## Notes

- **Dependencies**: Floor/grid, spawnFloorTile, spawnWall, removeEntity, bot prefab (floor-grid-system, food delivery).
- **Open questions locked**: Wall = same as floor (100% opacity). Single tag (PointerTarget). Viewport follow = View entity + IsViewportFocus; renderer centers on that entity.
- **Follow-ups**: NPC pointers, tooltips, outside-client integration (same simulation APIs).
