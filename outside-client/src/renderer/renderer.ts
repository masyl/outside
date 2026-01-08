import { Application, Container, Texture } from 'pixi.js';
import { WorldState } from '@outside/core';
import { createGrid, getGridDimensions } from './grid';
import { createObjectsLayer, updateObjectsLayer } from './objects';

/**
 * Main renderer for the game
 */
export class GameRenderer {
  private app: Application;
  private gridContainer: Container;
  private objectsContainer: Container;
  private rootContainer: Container;
  private botTexture?: Texture;

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
    
    // Create objects layer
    this.objectsContainer.removeChildren();
    const objectsLayer = createObjectsLayer(world, this.botTexture, this.app.renderer);
    this.objectsContainer.addChild(objectsLayer);
    
    // Center the viewport
    this.centerViewport(world);
  }

  /**
   * Update the renderer when world state changes
   */
  update(world: WorldState): void {
    // Update objects layer
    updateObjectsLayer(this.objectsContainer, world, this.botTexture, this.app.renderer);
    
    // Ensure viewport is centered (in case window was resized)
    this.centerViewport(world);
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
