import { Application, Container, Texture, Sprite } from 'pixi.js';
import { WorldState } from '@outside/core';
import { createGrid, getGridDimensions } from './grid';
import {
  createObjectsLayerWithIndex,
  updateObjectsLayerWithIndex,
  updateSpriteColors,
  SpriteIndex,
} from './objects';

/**
 * Main renderer for the game
 */
export class GameRenderer {
  private app: Application;
  private gridContainer: Container;
  private objectsContainer: Container;
  private rootContainer: Container;
  private botTexture?: Texture;
  private spriteIndex: SpriteIndex = new Map();
  private selectedBotId: string | null = null;

  constructor(app: Application) {
    this.app = app;
    
    // Create root container
    this.rootContainer = new Container();
    this.app.stage.addChild(this.rootContainer);
    
    // Create grid container (will be initialized in setWorld)
    this.gridContainer = new Container();
    this.objectsContainer = new Container();
    
    this.rootContainer.addChild(this.gridContainer);
    this.rootContainer.addChild(this.objectsContainer);
  }

  /**
   * Set the world state and initialize rendering
   */
  setWorld(world: WorldState): void {
    // Clear existing grid
    this.gridContainer.removeChildren();
    
    // Create new grid
    const grid = createGrid(world);
    this.gridContainer.addChild(grid);
    
    // Create objects layer and sprite index
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
  }

  /**
   * Update the renderer when world state changes
   */
  update(world: WorldState): void {
    // Update objects layer and sprite index
    updateObjectsLayerWithIndex(
      this.objectsContainer,
      world,
      this.botTexture,
      this.app.renderer,
      this.spriteIndex,
      this.selectedBotId
    );
    
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
   * Resize handler (call when window resizes)
   */
  resize(): void {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
  }
}
