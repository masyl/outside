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

    // Start animation loop for sprites
    this.startSpriteAnimationLoop();
  }

  private animationFrameId: number | null = null;

  private startSpriteAnimationLoop(): void {
    const loop = () => {
      const now = Date.now();

      // Update camera viewport every frame for smooth animation
      this.updateViewportTransform();

      this.botAnimationStates.forEach((state, id) => {
        // Update frame every 125ms
        if (now - state.lastUpdate >= 125) {
          state.frame = (state.frame + 1) % 4; // 4 frames per animation
          state.lastUpdate = now;

          // Update sprite texture
          const sprite = this.spriteIndex.get(id);
          if (sprite && this.botTexture && this.botWalkTexture) {
            import('./objects').then(({ updateBotSpriteFrame }) => {
              updateBotSpriteFrame(
                sprite,
                this.botTexture!,
                this.botWalkTexture!,
                state.direction,
                state.isMoving,
                state.frame
              );
            });
          }
        }
      });

      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
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
        // Fallback to object property if not animating yet
        const animState = this.botAnimationStates.get(obj.id);
        const bot = obj as any;

        return {
          x: obj.position!.x,
          y: obj.position!.y,
          direction: animState?.direction || bot.facing,
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
      // But for now, let's just expose a method or forward the call
      // Ideally objects.ts logic handles this.

      // Since we can't easily add imports without reading file content again to find imports section,
      // let's assume we can add a method here or rely on the fact we will update objects.ts soon.

      // Let's store the state on the sprite or a map?
      // Better: objects.ts exports a function updateBotAnimation(sprite, texture, walkTexture, direction, isMoving, frame)

      // For now, let's create a placeholder or update the logic.
      // We need to track animation frame state.
      // GameRenderer will hold a map of bot animation states?
      this.botAnimationStates.set(id, { direction, isMoving, frame: 0, lastUpdate: Date.now() });
    }
  }

  private botAnimationStates: Map<
    string,
    { direction: Direction; isMoving: boolean; frame: number; lastUpdate: number }
  > = new Map();

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
