import { Application, Container, Texture, Sprite, Assets, Graphics } from 'pixi.js';
import { WorldState, Direction } from '@outside/core';
import { animate } from 'motion';

import { DISPLAY_TILE_SIZE, createGrid, getGridDimensions } from './grid';
import { COORDINATE_SYSTEM, CoordinateConverter, getZoomScale } from './coordinateSystem';
import { updateBotSpriteFrame } from './objects';
import { VisualDebugLayer } from './visualDebugLayer';
import { zoomManager } from '../zoom/zoomState';
import { buildRenderables } from './unified/renderables';
import { createPixiDisplayAdapter } from './unified/pixiAdapter';
import { UnifiedRenderer } from './unified/unifiedRenderer';
// Note: keep viewport math local to avoid module-resolution flakiness in some editors.
// (We still test the equivalent pure function in `viewport.test.ts`.)
import { debugStore } from '../debug/debugStore';
import { directionFromVelocity } from '../utils/direction';
import { computeWalkFrameIndex } from '../utils/animation';

/**
 * Main renderer for the game
 */
export class GameRenderer {
  private app: Application;
  private gridContainer: Container;
  private debugOverlayContainer!: Container;
  private visualDebugLayer: VisualDebugLayer;
  private rootContainer: Container;
  private unifiedRoot: Container;
  private unifiedRenderer: UnifiedRenderer<any>;
  private botTexture?: Texture;
  private botWalkTexture?: Texture;
  private terrainTexture?: Texture;
  private selectedBotId: string | null = null;
  private currentWorld: WorldState | null = null;
  private isDebugEnabled: boolean = false;
  private lastBotPositions: Map<string, { x: number; y: number }> = new Map();
  private lastBotVelocity: Map<string, { x: number; y: number }> = new Map();
  private lastBotFacing: Map<string, Direction> = new Map();
  private lastBotIsMoving: Map<string, boolean> = new Map();
  private botWalkDistanceTiles: Map<string, number> = new Map();

  // Camera state (Grid Coordinates)
  private cameraPos = { x: 0, y: 0 };
  private lastWorldUpdateAtMs: number = performance.now();

  constructor(app: Application) {
    this.app = app;

    // Create root container
    this.rootContainer = new Container();
    this.app.stage.addChild(this.rootContainer);

    // Create containers for each layer
    this.gridContainer = new Container();
    this.debugOverlayContainer = new Container();
    this.visualDebugLayer = new VisualDebugLayer();

    // Unified renderer root (single pipeline).
    this.unifiedRoot = new Container();
    this.unifiedRoot.visible = true;
    this.unifiedRoot.sortableChildren = true;

    // Add containers in render order: grid (bottom), unified world, debug overlays (top).
    this.rootContainer.addChild(this.gridContainer);
    this.rootContainer.addChild(this.unifiedRoot);
    this.rootContainer.addChild(this.debugOverlayContainer);
    this.rootContainer.addChild(this.visualDebugLayer);

    // Renderer-agnostic unified renderer core with a Pixi adapter.
    this.unifiedRenderer = new UnifiedRenderer(
      createPixiDisplayAdapter(this.unifiedRoot, {
        getBotTexture: () => this.botTexture,
        getBotWalkTexture: () => this.botWalkTexture,
        getBotFacing: (id: string) => this.lastBotFacing.get(id) ?? 'down',
        getBotIsMoving: (id: string) => this.lastBotIsMoving.get(id) ?? false,
        getBotWalkFrameIndex: (id: string) => {
          const world = this.currentWorld;
          if (!world) return 0;
          if (!(this.lastBotIsMoving.get(id) ?? false)) return 0;
          const frames = 4;
          const cyclesPerTile = 1.5;
          const dist = this.botWalkDistanceTiles.get(id) ?? 0;
          const idx = Math.floor(dist * frames * cyclesPerTile) % frames;
          return idx < 0 ? idx + frames : idx;
        },
        getTerrainTexture: () => this.terrainTexture,
        renderer: this.app.renderer,
      })
    );

    // Unified-only renderer mode.
    debugStore.update({ rendererMode: 'unified' });

    // Listen for zoom changes and force redraw
    zoomManager.addZoomChangeListener((level, scale) => {
      console.log(`[Renderer] Zoom changed to level ${level} (${scale}x), forcing redraw`);
      this.forceCompleteRedraw();
    });

    // Keep viewport transform updated as camera springs animate.
    // Without this, cameraPos can change but the world container won't move.
    this.app.ticker.add((ticker) => {
      this.updateViewportTransform();
      this.tickBotVisualSmoothing(ticker.deltaMS / 1000);
    });
  }

  /**
   * Load sprite sheet assets
   * This should be called before the game starts to ensure sprites are ready
   */
  async loadAssets(): Promise<void> {
    try {
      // Load terrain sprite sheet
      this.terrainTexture = await Assets.load('/sprites/nature-pixels-v2/Tiles/Nature.png');
      if (this.terrainTexture) {
        this.terrainTexture.source.scaleMode = 'nearest';
      }

      // Load bot sprite sheet
      this.botTexture = await Assets.load(
        '/sprites/eris-esra-character-template-4/16x16/16x16 Idle-Sheet.png'
      );
      if (this.botTexture) {
        this.botTexture.source.scaleMode = 'nearest';
      }

      // Load walk animation sprite sheet
      this.botWalkTexture = await Assets.load(
        '/sprites/eris-esra-character-template-4/16x16/16x16 Walk-Sheet.png'
      );
      if (this.botWalkTexture) {
        this.botWalkTexture.source.scaleMode = 'nearest';
      }

      console.log('[GameRenderer] Assets loaded successfully');
    } catch (error) {
      console.error('[GameRenderer] Failed to load assets:', error);
      // Assets failed to load, but game can continue with placeholders
    }
  }

  /**
   * Check if assets are loaded
   */
  areAssetsLoaded(): boolean {
    return !!(this.botTexture && this.botWalkTexture && this.terrainTexture);
  }

  /**
   * Set the world state and initialize rendering
   */
  setWorld(world: WorldState): void {
    // Store current world state for resize handler
    this.currentWorld = world;

    // Update visual debug layer with new world state
    this.visualDebugLayer.setWorld(world);

    // Clear existing grid
    this.gridContainer.removeChildren();

    // Create new grid (checkered background, renders at bottom)
    const grid = createGrid(world);
    this.gridContainer.addChild(grid);

    // Reset derived bot state (for velocity/facing/debug rendering).
    this.lastBotPositions.clear();
    this.lastBotVelocity.clear();
    this.lastBotFacing.clear();
    this.lastBotIsMoving.clear();
    this.botWalkDistanceTiles.clear();
    for (const obj of world.objects.values()) {
      if (obj.type !== 'bot') continue;
      if (!obj.position) continue;
      this.lastBotPositions.set(obj.id, { x: obj.position.x, y: obj.position.y });
    }

    // Update camera target based on initial state
    this.updateCameraTarget(world);

    this.updateUnified(world);
  }

  /**
   * Update the renderer when world state changes
   */
  update(world: WorldState): void {
    // Store current world state for resize handler
    this.currentWorld = world;

    // Update visual debug layer with new world state
    this.visualDebugLayer.setWorld(world);

    // Derive per-bot velocity/facing from movement deltas.
    this.updateDerivedBotMotion(world);

    // Update debug grid if enabled
    if (this.isDebugEnabled) {
      this.updateBotDebugGrid(world, true);
    }

    // Update camera target to follow selected bot or return to center
    this.updateCameraTarget(world);

    this.updateUnified(world);
  }

  private updateUnified(world: WorldState): void {
    const renderables = buildRenderables(world);
    this.unifiedRenderer.render(renderables);
  }

  private tickBotVisualSmoothing(dtSec: number): void {
    // Smooth bot transitions between world snapshots (purely visual).
    // Do it here (one loop) instead of creating a Motion animation per bot per update.
    if (!this.currentWorld) return;

    // Clamp dt to avoid huge jumps after tab is backgrounded.
    const clampedDt = Math.max(0, Math.min(0.25, dtSec));
    if (clampedDt <= 0) return;

    // Exponential smoothing toward target with time constant ~80ms.
    const tau = 0.08;
    const t = 1 - Math.exp(-clampedDt / tau);

    for (const display of this.unifiedRenderer.getIndex().values()) {
      // Adapter stores targets on the container wrapper.
      const anyDisplay: any = display as any;
      const targetX = anyDisplay.__targetX;
      const targetY = anyDisplay.__targetY;
      if (typeof targetX !== 'number' || typeof targetY !== 'number') continue;

      // Only bots have __targetX/__targetY in the adapter today.
      const dx = targetX - anyDisplay.x;
      const dy = targetY - anyDisplay.y;
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        anyDisplay.x = targetX;
        anyDisplay.y = targetY;
        continue;
      }

      anyDisplay.x += dx * t;
      anyDisplay.y += dy * t;
    }
  }

  /**
   * Update selection and refresh sprite colors
   */
  updateSelection(world: WorldState, selectedBotId: string | null): void {
    if (this.selectedBotId === selectedBotId) {
      return; // No change
    }

    this.selectedBotId = selectedBotId;

    // Update camera target to follow new selection
    this.updateCameraTarget(world);

    // Ensure unified pipeline gets a chance to refresh if selection affects visuals later.
    this.updateUnified(world);
  }

  /**
   * Toggle debug overlay grid for bot target positions
   */
  updateBotDebugGrid(world: WorldState, enabled: boolean): void {
    this.isDebugEnabled = enabled;

    if (!enabled) {
      // Disable visual debug layer when debug is off
      this.visualDebugLayer.setVisible(false);
      return;
    }

    // Enable visual debug layer when debug is on
    this.visualDebugLayer.setVisible(true);

    // Ensure derived velocity/facing is up to date even if debug is toggled on mid-game.
    this.updateDerivedBotMotion(world);

    // Update visual debug layer with bot positions and velocities.
    const botPositions = Array.from(world.objects.values())
      .filter((obj) => obj.type === 'bot' && obj.position)
      .map((obj) => {
        const pos = obj.position!;
        const velocity = this.lastBotVelocity.get(obj.id) ?? { x: 0, y: 0 };

        return {
          id: obj.id,
          x: pos.x,
          y: pos.y,
          velocity,
        };
      });

    this.visualDebugLayer.updateBotPositions(botPositions);
  }

  private updateDerivedBotMotion(world: WorldState): void {
    const currentBotIds = new Set<string>();

    for (const obj of world.objects.values()) {
      if (obj.type !== 'bot') continue;
      if (!obj.position) continue;
      currentBotIds.add(obj.id);

      const pos = obj.position;
      const prev = this.lastBotPositions.get(obj.id);
      const fallbackDelta = prev ? { x: pos.x - prev.x, y: pos.y - prev.y } : { x: 0, y: 0 };
      const velocity = obj.velocity ?? fallbackDelta;

      this.lastBotVelocity.set(obj.id, velocity);

      const speed = Math.hypot(velocity.x, velocity.y);
      this.lastBotIsMoving.set(obj.id, speed > 0.0001);

      if (prev) {
        const d = Math.hypot(pos.x - prev.x, pos.y - prev.y);
        if (d > 0) {
          this.botWalkDistanceTiles.set(obj.id, (this.botWalkDistanceTiles.get(obj.id) ?? 0) + d);
        }
      }

      if (obj.facing) {
        this.lastBotFacing.set(obj.id, obj.facing);
      } else if (speed > 0.0001) {
        this.lastBotFacing.set(
          obj.id,
          directionFromVelocity(velocity, this.lastBotFacing.get(obj.id) ?? 'down')
        );
      }

      this.lastBotPositions.set(obj.id, { x: pos.x, y: pos.y });
    }

    // Prune removed bots to keep maps bounded.
    for (const id of this.lastBotPositions.keys()) {
      if (!currentBotIds.has(id)) {
        this.lastBotPositions.delete(id);
        this.lastBotVelocity.delete(id);
        this.lastBotFacing.delete(id);
        this.lastBotIsMoving.delete(id);
        this.botWalkDistanceTiles.delete(id);
      }
    }
  }

  /**
   * Toggle sub-grid visibility in visual debug layer
   */
  toggleSubGrid(): void {
    if (this.isDebugEnabled) {
      this.visualDebugLayer.toggleSubGrid();
    }
  }

  /**
   * Update mouse position for visual debug layer
   */
  updateMousePosition(gridX: number, gridY: number): void {
    this.visualDebugLayer.updateMousePosition(gridX, gridY);
  }

  /**
   * Get sprite for a given object id
   */
  getSpriteForObject(id: string): Sprite | undefined {
    // Unified pipeline: display index maps entityId -> Container (wrapping visual).
    const display: any = this.unifiedRenderer.getIndex().get(id);
    if (!display) return undefined;
    if (display instanceof Sprite) return display;
    if (display instanceof Container) {
      const child = display.children[0];
      if (child instanceof Sprite) return child;
    }
    return undefined;
  }

  /**
   * Force a complete redraw of all visual elements with current zoom
   */
  private forceCompleteRedraw(): void {
    const zoomScale = getZoomScale();

    // Recreate grid with new zoom scale
    if (this.currentWorld) {
      this.gridContainer.removeChildren();
      const grid = createGrid(this.currentWorld);
      this.gridContainer.addChild(grid);
    }

    // Unified pipeline: re-render with the new zoom scale applied by adapter.
    if (this.currentWorld) {
      this.updateUnified(this.currentWorld);
    }

    // Force visual debug layer to redraw with new zoom
    this.visualDebugLayer.forceRedraw();

    // Update viewport transform with new zoom scale
    this.updateViewportTransform();

    // Trigger immediate render
    this.app.render();
  }

  /**
   * Update the root container position based on current camera state
   * Called automatically in the render loop or on resize
   */
  private updateViewportTransform(): void {
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const zoomScale = getZoomScale();

    // Get current smoothed camera position (Grid Units)
    const camX = this.cameraPos.x;
    const camY = this.cameraPos.y;

    // Convert to display pixels relative to world origin
    const centerPos = CoordinateConverter.gridToDisplay({ x: camX, y: camY }, zoomScale);

    // Apply offset to center the view on screen
    this.rootContainer.x = screenWidth / 2 - centerPos.x;
    this.rootContainer.y = screenHeight / 2 - centerPos.y;
  }

  /**
   * Update the camera target based on selection and world state
   * Animates the camera to the new target position
   */
  private updateCameraTarget(world: WorldState): void {
    let targetX = 0;
    let targetY = 0;

    // If a bot is selected, target its center position
    if (this.selectedBotId) {
      const bot = world.objects.get(this.selectedBotId);
      if (bot && bot.position) {
        // Target center of the tile (x + 0.5, y + 0.5)
        targetX = bot.position.x + 0.5;
        targetY = bot.position.y + 0.5;
      }
    }

    // Animate to new target using spring physics for smooth following
    // Spring allows continuous retargeting without interruption
    animate(
      this.cameraPos,
      { x: targetX, y: targetY },
      { type: 'spring', stiffness: 200, damping: 25 }
    );
  }

  /**
   * Set the bot texture (PNG sprite)
   */
  setBotTexture(texture: Texture): void {
    this.botTexture = texture;
  }

  /**
   * Get the root container position for coordinate transformation
   */
  getRootContainerPosition(): { x: number; y: number } {
    return { x: this.rootContainer.x, y: this.rootContainer.y };
  }

  /**
   * Get the Pixi.js application
   */
  getApp(): Application {
    return this.app;
  }

  /**
   * Update bot visual state (direction and animation)
   */
  updateBotVelocity(id: string, velocity: { x: number; y: number }, isMoving: boolean): void {
    this.lastBotIsMoving.set(id, isMoving);
    if (velocity.x !== 0 || velocity.y !== 0) {
      this.lastBotVelocity.set(id, velocity);
    }

    const sprite = this.getSpriteForObject(id);
    if (!sprite) return;
    if (!this.botTexture || !this.botWalkTexture) return;

    // Convert velocity to an 8-way direction. Preserve last facing when velocity is zero.
    const nextFacing =
      velocity.x === 0 && velocity.y === 0 ? this.lastBotFacing.get(id) ?? 'down' : undefined;

    const direction =
      velocity.x === 0 && velocity.y === 0
        ? (nextFacing ?? 'down')
        : directionFromVelocity(velocity);

    this.lastBotFacing.set(id, direction);

    // Frame selection is still simplistic (Phase 5 cleanup). Direction + moving/idle are respected.
    updateBotSpriteFrame(sprite, this.botTexture, this.botWalkTexture, direction, isMoving, 0);
  }

  /**
   * Resize handler (call when window resizes)
   */
  resize(): void {
    // Resize the renderer, but ensure resolution stays at 1 for pixel-perfect rendering
    // This prevents PixiJS from recalculating resolution based on devicePixelRatio
    // which would make pixel art look blurry when console opens/closes
    this.app.renderer.resize(window.innerWidth, window.innerHeight);

    // Force resolution to stay at 1 (pixel-perfect, no devicePixelRatio scaling)
    // This is critical for pixel art rendering to remain crisp
    this.app.renderer.resolution = 1;

    // Update viewport transform with new screen dimensions
    this.updateViewportTransform();
  }

  // Note: legacy `ensureSpriteForObject` removed. The unified renderer owns sprite lifecycle.
}
