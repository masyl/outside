import { Application, Container, Texture, Sprite, Assets, Graphics } from 'pixi.js';
import { GameObject, WorldState, Direction } from '@outside/core';
import { DISPLAY_TILE_SIZE, createGrid, getGridDimensions } from './grid';
import {
  createBotPlaceholder,
  createObjectsLayerWithIndex,
  updateObjectsLayerWithIndex,
  updateSpriteColors,
  SpriteIndex,
} from './objects';
import { createTerrainLayer, updateTerrainLayer } from './terrain';

/**
 * Main renderer for the game
 */
export class GameRenderer {
  private app: Application;
  private gridContainer: Container;
  private terrainContainer: Container;
  private objectsContainer: Container;
  private debugOverlayContainer!: Container;
  private rootContainer: Container;
  private botTexture?: Texture;
  private botWalkTexture?: Texture;
  private terrainTexture?: Texture;
  private spriteIndex: SpriteIndex = new Map();
  private selectedBotId: string | null = null;
  private previousGroundLayerSize: number = 0;
  private currentWorld: WorldState | null = null;

  constructor(app: Application) {
    this.app = app;

    // Create root container
    this.rootContainer = new Container();
    this.app.stage.addChild(this.rootContainer);

    // Create containers for each layer (rendered in order: grid, terrain, debug, objects)
    this.gridContainer = new Container();
    this.terrainContainer = new Container();
    this.debugOverlayContainer = new Container();
    this.objectsContainer = new Container();

    // Add containers in render order: grid (bottom), terrain (middle), debug overlay, objects (top)
    this.rootContainer.addChild(this.gridContainer);
    this.rootContainer.addChild(this.terrainContainer);
    this.rootContainer.addChild(this.debugOverlayContainer);
    this.rootContainer.addChild(this.objectsContainer);
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

    // Center the viewport
    this.centerViewport(world);

    // Start animation loop for sprites
    this.startSpriteAnimationLoop();
  }

  private animationFrameId: number | null = null;

  private startSpriteAnimationLoop(): void {
    const loop = () => {
      const now = Date.now();

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
    if (this.debugOverlayContainer.children.length > 0) {
      this.updateBotDebugGrid(world, true);
    }

    // Ensure viewport is centered (in case window was resized)
    this.centerViewport(world);
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
  }

  /**
   * Update debug overlay grid for bot target positions
   */
  updateBotDebugGrid(world: WorldState, enabled: boolean): void {
    this.debugOverlayContainer.removeChildren();

    if (!enabled) {
      return;
    }

    const graphics = new Graphics();
    const VIRTUAL_PIXEL = 2; // Matches PIXEL_RATIO for crisp 1px lines

    world.objects.forEach((object) => {
      if (object.type !== 'bot' || !object.position) {
        return;
      }

      const x = object.position.x * DISPLAY_TILE_SIZE;
      const y = object.position.y * DISPLAY_TILE_SIZE;

      graphics.lineStyle(VIRTUAL_PIXEL, 0x00ff00, 1);

      // Draw dotted square with virtual pixel spacing
      const dot = VIRTUAL_PIXEL;
      const gap = VIRTUAL_PIXEL;
      const size = DISPLAY_TILE_SIZE;

      for (let i = 0; i < size; i += dot + gap) {
        // Top edge
        graphics.moveTo(x + i, y);
        graphics.lineTo(x + Math.min(i + dot, size), y);
        // Bottom edge
        graphics.moveTo(x + i, y + size);
        graphics.lineTo(x + Math.min(i + dot, size), y + size);
        // Left edge
        graphics.moveTo(x, y + i);
        graphics.lineTo(x, y + Math.min(i + dot, size));
        // Right edge
        graphics.moveTo(x + size, y + i);
        graphics.lineTo(x + size, y + Math.min(i + dot, size));
      }
    });

    this.debugOverlayContainer.addChild(graphics);
  }

  /**
   * Get sprite for a given object id
   */
  getSpriteForObject(id: string): Sprite | undefined {
    return this.spriteIndex.get(id);
  }

  /**
   * Center the viewport horizontally and vertically
   */
  private centerViewport(world: WorldState): void {
    const dimensions = getGridDimensions(world);
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    // Center the grid
    this.rootContainer.x = (screenWidth - dimensions.width) / 2;
    this.rootContainer.y = (screenHeight - dimensions.height) / 2;
  }

  /**
   * Set the bot texture (PNG sprite)
   */
  setBotTexture(texture: Texture): void {
    this.botTexture = texture;
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

    // Recenter the viewport after resize if we have a world state
    if (this.currentWorld) {
      this.centerViewport(this.currentWorld);
    }
  }

  /**
   * Ensure a sprite exists for the given object, creating a placeholder if needed.
   */
  ensureSpriteForObject(object: GameObject): Sprite | undefined {
    const VERTICAL_OFFSET = -8;
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
    sprite.x = object.position.x * DISPLAY_TILE_SIZE;
    sprite.y = object.position.y * DISPLAY_TILE_SIZE + VERTICAL_OFFSET;
    this.objectsContainer.addChild(sprite);
    this.spriteIndex.set(object.id, sprite);

    return sprite;
  }
}
