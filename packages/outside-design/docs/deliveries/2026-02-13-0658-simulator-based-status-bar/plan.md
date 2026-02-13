# Implementation Plan: Simulator-Based Status Bar

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

A second simulator instance, running at 8 ticks/sec, drives a 1-tile-high status bar rendered at the top of the viewport. The `RendererManager` gains a third `PixiEcsRenderer` for the status bar alongside the existing main and minimap renderers. Click hit-testing is extended to give the status bar top priority, followed by minimap, then world. Fullscreen toggle and hero focus are the two interaction targets in the bar.

## Architectural Principles

1. **Status bar is an independent simulation.** Its tick loop is not coupled to the main simulator's pause state; it runs continuously as long as the testPlayer is mounted.
2. **Rendering reuses the minimap pixel zoom logic.** The status bar renderer is configured with `renderMode: 'minimap'` and a tile size derived from the same zoom-level formula used by the minimap.
3. **Background transparency is layered.** The status bar container has a 50% black background; entity sprites are rendered at 100% opacity on top via a separate Graphics layer, mirroring the minimap's layered approach.
4. **Input routing is ordered.** `handlePointerDown` checks the status bar first, then minimap, then the game world. The status bar consumes the event and returns early if hit.
5. **Fullscreen is event-driven, not state polled.** The status bar simulator emits a signal (pulled by testPlayer after each tick) when the fullscreen entity is clicked; testPlayer calls the browser Fullscreen API in response.

## Phase 1: Status Bar Simulator Hook

Create `use-status-bar-stream.ts` in `packages/outside-test-player/src/`.

### Checklist

- [ ] Create `useStatusBarStream(mainStream)` hook that starts an independent world
- [ ] Tick the world at 8 ticks/sec using its own `setInterval` (not coupled to main `requestAnimationFrame` loop)
- [ ] Expose a `StatusBarStreamState` interface with:
  - `stream` — packets (same `StreamPacket` type used by main stream)
  - `syncHeroes(heroEids: number[])` — receives current hero entity IDs from main stream and mirrors sprites + positions in the status bar world
  - `notifyPointer(statusBarX: number, statusBarY: number, isHover: boolean)` — forwards pointer into status bar world
  - `getClickedEntityKind(): 'fullscreen' | 'hero' | null` — pull API: returns what was clicked this tick
- [ ] Place the fullscreen entity at the rightmost tile of the status bar world
- [ ] Place hero entities left of fullscreen, one per controllable hero, using the same sprite components
- [ ] Clear `getClickedEntityKind()` result after each read (pull once per pointer-down event)

## Phase 2: RendererManager Extension

Extend `renderer-manager.ts` to hold and manage a `statusBarRenderer`.

### Checklist

- [ ] Add `statusBarRenderer?: PixiEcsRenderer` and `statusBarHost?: Container` fields
- [ ] Add `RendererManagerStatusBarOptions` (no config needed beyond presence/absence for now)
- [ ] Add `syncStatusBarRenderer()` — creates or tears down `statusBarRenderer` and its host container, modelled on `syncMinimapRenderer()`
- [ ] Configure `statusBarRenderer` with:
  - `renderMode: 'minimap'`
  - `stageContainer: this.statusBarHost`
  - `tileSize`: same zoom formula as minimap tile size (clamp 2..16 based on main `tileSize`)
  - `backgroundEnabled: false`
  - `alpha: 1`
- [ ] Add `syncStatusBarLayout()` — positions status bar at top of canvas, full viewport width, height = `tileSize` (1 tile high), with a 50% black background Graphics underneath the entity layer; modelled on `syncMinimapRendererLayout()`
- [ ] Add `applyStatusBarStream(packet)` — calls `statusBarRenderer.applyStream(packet)`, separate from `applyStream(packet)` which feeds main + minimap
- [ ] Add `handleStatusBarClick(screenX, screenY): boolean` — returns `true` if the click lands within the status bar bounds (top strip), for use in hit-test ordering
- [ ] Call `syncStatusBarLayout()` from `onResize` alongside existing `syncMinimapRendererLayout()`

## Phase 3: TestPlayer Integration

Wire the status bar hook and renderer into `test-player.tsx`.

### Checklist

- [ ] Call `useStatusBarStream(mainStream)` and store ref to `statusBarStreamState`
- [ ] In the stream subscription effect, subscribe to status bar stream packets and forward to `rendererManagerRef.current?.applyStatusBarStream(packet)`
- [ ] In `handlePointerDown`, check `rendererManagerRef.current?.handleStatusBarClick(screenX, screenY)` first; if hit, forward pointer to `statusBarStreamState.notifyPointer(...)` and return early
- [ ] In `handlePointerMove`, when pointer is within the status bar bounds, call `statusBarStreamState.notifyPointer(...)` instead of (or in addition to) the main world pointer
- [ ] After notifying status bar of a pointer-down, pull `statusBarStreamState.getClickedEntityKind()`:
  - `'hero'` → call `stream.cycleControllerHeroActor()` or focus by index
  - `'fullscreen'` → call `requestFullscreen()` on the canvas element (toggle)
- [ ] Sync heroes: in the main stream tick callback, call `statusBarStreamState.syncHeroes(stream.getControllableHeroEids())`; add `getControllableHeroEids()` to `ScenarioStreamState` if not present

## Phase 4: Fullscreen Mode

### Checklist

- [ ] On fullscreen entity click (from Phase 3), call `canvasRef.current?.requestFullscreen()` if not fullscreen, else `document.exitFullscreen()`
- [ ] Update the fullscreen icon entity sprite in the status bar world to reflect current state (e.g. swap sprite or set a component flag)
- [ ] Listen to the browser `fullscreenchange` event and sync state back to the status bar world

## Phase 5: Main Stream — Hero List API

Small addition to `use-scenario-render-stream.ts`.

### Checklist

- [ ] Add `getControllableHeroEids(): number[]` to `ScenarioStreamState` — returns current entity IDs of heroes that can be focused (have `HeroActor` + `Commandable` or equivalent)

## Master Checklist

- [ ] `use-status-bar-stream.ts` hook with independent 8 tick/sec loop
- [ ] Status bar world: fullscreen entity + hero entities synced from main stream
- [ ] `RendererManager`: `statusBarRenderer`, `syncStatusBarRenderer()`, `syncStatusBarLayout()`, `applyStatusBarStream()`, `handleStatusBarClick()`
- [ ] 50% black background Graphics behind status bar entities
- [ ] `TestPlayer`: status bar hook wired, stream subscribed, packets applied to renderer
- [ ] Hit-test order: status bar → minimap → world
- [ ] Pointer events forwarded to status bar world on hover/click
- [ ] Hero click → focus hero in main simulation
- [ ] Fullscreen click → browser fullscreen toggle
- [ ] Fullscreen icon syncs to actual fullscreen state
- [ ] `getControllableHeroEids()` added to main stream state

## Notes

- **Out of scope**: heroless fallback (free-pan viewport) — tracked in [Heroless Viewport Control pitch](../../pitches/heroless-viewport-control.md).
- The status bar renderer uses the minimap pixel rendering path; entities need `MinimapPixel` components OR the status bar uses `renderMode: 'default'` with full sprite rendering. Given that animated sprites are required (review answer), **use `renderMode: 'default'`** for the status bar renderer so sprite sheets and animations work correctly. The zoom/tileSize still follows the minimap formula.
- `syncHeroes` in the status bar hook receives entity snapshots (sprite kind, team) not live ECS references; the status bar world is fully independent.
- The `streamController` consumer ID for the status bar stream should be `'status-bar'`.
