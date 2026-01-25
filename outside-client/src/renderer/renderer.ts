import { Application, Container, Texture, Sprite, Assets, Graphics } from 'pixi.js';
import { GameObject, WorldState, Direction } from '@outside/core';
import { animate } from 'motion';

import { DISPLAY_TILE_SIZE, createGrid, getGridDimensions } from './grid';
import { COORDINATE_SYSTEM, CoordinateConverter, getZoomScale } from './coordinateSystem';
import {
  createBotPlaceholder,
  createObjectsLayerWithIndex,
  updateObjectsLayerWithIndex,
  updateSpriteColors,
  SpriteIndex,
} from './objects';
import { createTerrainLayer, updateTerrainLayer } from './terrain';
import { VisualDebugLayer } from './visualDebugLayer';
import { zoomManager } from '../zoom/zoomState';
import { buildRenderables } from './unified/renderables';
import { createPixiDisplayAdapter } from './unified/pixiAdapter';
import { UnifiedRenderer } from './unified/unifiedRenderer';
import { computeParitySummary } from './unified/parity';

/**
 * Main renderer for the game
 */
export class GameRenderer {
  private app: Application;
  private gridContainer: Container;
  private terrainContainer: Container;
  private objectsContainer: Container;
  private debugOverlayContainer!: Container;
  private visualDebugLayer: VisualDebugLayer;
  private rootContainer: Container;
  private unifiedRoot: Container;
  private rendererMode: 'legacy' | 'unified' | 'dual' = 'legacy';
  private unifiedRenderer: UnifiedRenderer<any>;
  private lastParityLogAtMs: number = 0;
  private botTexture?: Texture;
  private botWalkTexture?: Texture;
  private terrainTexture?: Texture;
  private spriteIndex: SpriteIndex = new Map();
  private selectedBotId: string | null = null;
  private previousGroundLayerSize: number = 0;
  private currentWorld: WorldState | null = null;
  private isDebugEnabled: boolean = false;

  // Camera state (Grid Coordinates)
  private cameraPos = { x: 0, y: 0 };

  constructor(app: Application) {
    this.app = app;

    // Create root container
    this.rootContainer = new Container();
    this.app.stage.addChild(this.rootContainer);

    // Create containers for each layer (rendered in order: grid, terrain, debug, objects)
    this.gridContainer = new Container();
    this.terrainContainer = new Container();
    this.debugOverlayContainer = new Container();
    this.visualDebugLayer = new VisualDebugLayer();
    this.objectsContainer = new Container();

    // Add containers in render order: grid (bottom), terrain (middle), debug overlay, visual debug, objects (top)
    this.rootContainer.addChild(this.gridContainer);
    this.rootContainer.addChild(this.terrainContainer);
    this.rootContainer.addChild(this.debugOverlayContainer);
    this.rootContainer.addChild(this.visualDebugLayer);
    this.rootContainer.addChild(this.objectsContainer);

    // Unified renderer root (parallel pipeline). Hidden by default.
    this.unifiedRoot = new Container();
    this.unifiedRoot.visible = false;
    this.unifiedRoot.sortableChildren = true;
    this.rootContainer.addChild(this.unifiedRoot);

    // Renderer-agnostic unified renderer core with a Pixi adapter.
    this.unifiedRenderer = new UnifiedRenderer(createPixiDisplayAdapter(this.unifiedRoot));

    // Listen for zoom changes and force redraw
    zoomManager.addZoomChangeListener((level, scale) => {
      console.log(`[Renderer] Zoom changed to level ${level} (${scale}x), forcing redraw`);
      this.forceCompleteRedraw();
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

    // Create terrain layer (ground layer, renders above grid)
    this.terrainContainer.removeChildren();
    if (this.terrainTexture) {
      const terrainLayer = createTerrainLayer(world, this.terrainTexture);
      this.terrainContainer.addChild(terrainLayer);
    } else {
      // Fallback if textures not loaded yet (or failed)
      const terrainLayer = createTerrainLayer(world);
      this.terrainContainer.addChild(terrainLayer);
    }

    // Create objects layer and sprite index (surface layer, renders above terrain)
    this.objectsContainer.removeChildren();
    const { container, spriteIndex } = createObjectsLayerWithIndex(
      world,
      this.botTexture,
      this.app.renderer,
      this.selectedBotId
    );
    this.objectsContainer.addChild(container);
    this.spriteIndex = spriteIndex;

    // Update camera target based on initial state
    this.updateCameraTarget(world);

    // Optional: also update unified renderer if enabled (no visible change by default).
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

    // Always update terrain layer when world state changes
    // This ensures terrain is rendered correctly as it's added incrementally
    if (this.terrainTexture) {
      updateTerrainLayer(this.terrainContainer, world, this.terrainTexture);
    } else {
      updateTerrainLayer(this.terrainContainer, world);
    }

    // Update objects layer and sprite index
    updateObjectsLayerWithIndex(
      this.objectsContainer,
      world,
      this.botTexture,
      this.app.renderer,
      this.spriteIndex,
      this.selectedBotId
    );

    // Update debug grid if enabled
    if (this.isDebugEnabled) {
      this.updateBotDebugGrid(world, true);
    }

    // Update camera target to follow selected bot or return to center
    this.updateCameraTarget(world);

    // Optional: also update unified renderer if enabled (no visible change by default).
    this.updateUnified(world);
  }

  /**
   * Switch between legacy/unified/dual renderer modes.
   * Default is legacy. Dual mode updates both (unified hidden).
   */
  setRendererMode(mode: 'legacy' | 'unified' | 'dual'): void {
    if (this.rendererMode === mode) return;
    this.rendererMode = mode;
    this.applyRendererVisibility();
  }

  getRendererMode(): 'legacy' | 'unified' | 'dual' {
    return this.rendererMode;
  }

  private applyRendererVisibility(): void {
    if (this.rendererMode === 'legacy') {
      this.terrainContainer.visible = true;
      this.objectsContainer.visible = true;
      this.unifiedRoot.visible = false;
      return;
    }

    if (this.rendererMode === 'unified') {
      this.terrainContainer.visible = false;
      this.objectsContainer.visible = false;
      this.unifiedRoot.visible = true;
      return;
    }

    // dual
    this.terrainContainer.visible = true;
    this.objectsContainer.visible = true;
    this.unifiedRoot.visible = false; // shadow-run
  }

  private updateUnified(world: WorldState): void {
    if (this.rendererMode === 'legacy') {
      return;
    }

    const renderables = buildRenderables(world);
    this.unifiedRenderer.render(renderables);

    if (this.rendererMode === 'dual') {
      this.checkDualModeParity(renderables);
    }
  }

  private checkDualModeParity(renderables: ReturnType<typeof buildRenderables>): void {
    // Collect expected ids/counts from renderables.
    const expectedBotIds = renderables.filter((r) => r.kind === 'bot').map((r) => r.id);
    const expectedTerrainCount = renderables.filter((r) => r.kind === 'terrain').length;

    // Legacy bot positions: from spriteIndex.
    const legacyBotPositions = new Map<string, { x: number; y: number }>();
    for (const [id, sprite] of this.spriteIndex) {
      legacyBotPositions.set(id, { x: sprite.x, y: sprite.y });
    }

    // Unified bot positions: from unified renderer display index.
    const unifiedBotPositions = new Map<string, { x: number; y: number }>();
    const unifiedIndex = this.unifiedRenderer.getIndex();
    for (const id of expectedBotIds) {
      const display: any = unifiedIndex.get(id);
      if (display && typeof display.x === 'number' && typeof display.y === 'number') {
        unifiedBotPositions.set(id, { x: display.x, y: display.y });
      }
    }

    // Terrain counts:
    // - legacy: terrainContainer children are terrain sprites (updateTerrainLayer rebuilds children)
    // - unified: count from renderables (since unified display index includes bots too)
    const legacyTerrainCount = this.terrainContainer.children.length;
    const unifiedTerrainCount = expectedTerrainCount;

    const summary = computeParitySummary({
      expectedBotIds,
      expectedTerrainCount,
      legacyBotPositions,
      unifiedBotPositions,
      legacyTerrainCount,
      unifiedTerrainCount,
      tolerancePx: 0.5,
    });

    // Throttle logs to avoid spamming console while running in dual mode.
    if (!summary.ok) {
      const now = performance.now();
      if (now - this.lastParityLogAtMs > 2000) {
        this.lastParityLogAtMs = now;
        console.warn('[UnifiedRenderer][dual] parity mismatch', {
          bot: {
            expected: summary.bot.expectedCount,
            legacy: summary.bot.legacyCount,
            unified: summary.bot.unifiedCount,
            missingInLegacy: summary.bot.missingInLegacy.slice(0, 5),
            missingInUnified: summary.bot.missingInUnified.slice(0, 5),
            positionMismatches: summary.bot.positionMismatches.slice(0, 3),
          },
          terrain: summary.terrain,
        });
      }
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

    // Update sprite colors based on new selection
    if (!this.botTexture) {
      updateSpriteColors(
        this.objectsContainer,
        world,
        this.botTexture,
        this.app.renderer,
        this.spriteIndex,
        this.selectedBotId
      );
    }

    // Update camera target to follow new selection
    this.updateCameraTarget(world);
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

    // Update visual debug layer with bot positions and directions
    const botPositions = Array.from(world.objects.values())
      .filter((obj) => obj.type === 'bot' && obj.position)
      .map((obj) => {
        // Access facing direction from animation state (real-time visual direction)
        const bot = obj as any;

        return {
          x: obj.position!.x,
          y: obj.position!.y,
          direction: bot.facing || 'down',
        };
      });

    this.visualDebugLayer.updateBotPositions(botPositions);
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
    return this.spriteIndex.get(id);
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

    // Recreate terrain layer with new zoom scale
    if (this.currentWorld && this.terrainTexture) {
      this.terrainContainer.removeChildren();
      const terrainLayer = createTerrainLayer(this.currentWorld, this.terrainTexture);
      this.terrainContainer.addChild(terrainLayer);
    }

    // Update all existing bot sprites' scales and positions
    if (this.currentWorld) {
      const world = this.currentWorld; // Create local const to satisfy TypeScript
      this.spriteIndex.forEach((sprite, objectId) => {
        // Apply zoom scaling to sprite
        sprite.scale.set(zoomScale, zoomScale);

        // Update position to match new zoom scale
        const gameObject = world.objects.get(objectId);
        if (gameObject?.position) {
          const displayPos = CoordinateConverter.gridToDisplay(gameObject.position, zoomScale);
          sprite.x = displayPos.x;
          sprite.y = displayPos.y + COORDINATE_SYSTEM.VERTICAL_OFFSET;
        }
      });
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
  updateBotDirection(id: string, direction: Direction, isMoving: boolean): void {
    // This will be implemented in objects.ts or handled by updating sprite textures
    // We need to pass this state to a helper that updates the specific sprite
    const sprite = this.spriteIndex.get(id);
    if (sprite && this.botTexture && this.botWalkTexture) {
      // We need to import updateBotSpriteAnimation from objects.ts
    }
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

  /**
   * Ensure a sprite exists for the given object, creating a placeholder if needed.
   */
  ensureSpriteForObject(object: GameObject): Sprite | undefined {
    if (object.type !== 'bot') {
      return undefined;
    }

    // Don't create sprites for bots without a position
    if (!object.position) {
      return undefined;
    }

    let sprite = this.spriteIndex.get(object.id);
    if (sprite) {
      return sprite;
    }

    sprite = createBotPlaceholder(this.app.renderer, false);
    const zoomScale = getZoomScale();
    const displayPos = CoordinateConverter.gridToDisplay(
      {
        x: object.position.x,
        y: object.position.y,
      },
      zoomScale
    );
    sprite.x = displayPos.x;
    sprite.y = displayPos.y + COORDINATE_SYSTEM.VERTICAL_OFFSET;
    this.objectsContainer.addChild(sprite);
    this.spriteIndex.set(object.id, sprite);

    return sprite;
  }
}
