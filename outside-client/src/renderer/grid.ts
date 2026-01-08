import { Graphics, Container } from 'pixi.js';
import { WorldState } from '@outside/core';

const TILE_SIZE = 16;
const PIXEL_RATIO = 4;
const DISPLAY_TILE_SIZE = TILE_SIZE * PIXEL_RATIO; // 64px

const DARK_GREY = 0x2a2a2a;
const DARKER_GREY = 0x1a1a1a;

/**
 * Create and render the checkered grid background
 */
export function createGrid(world: WorldState): Container {
  const container = new Container();
  const graphics = new Graphics();

  // Draw checkered pattern using beginPath/rect/fill pattern
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const isDark = (x + y) % 2 === 0;
      const color = isDark ? DARK_GREY : DARKER_GREY;
      
      const xPos = x * DISPLAY_TILE_SIZE;
      const yPos = y * DISPLAY_TILE_SIZE;
      
      graphics
        .rect(xPos, yPos, DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE)
        .fill(color);
    }
  }

  container.addChild(graphics);
  return container;
}

/**
 * Get the total grid dimensions in pixels
 */
export function getGridDimensions(world: WorldState): { width: number; height: number } {
  return {
    width: world.width * DISPLAY_TILE_SIZE,
    height: world.height * DISPLAY_TILE_SIZE,
  };
}

export { DISPLAY_TILE_SIZE, TILE_SIZE, PIXEL_RATIO };
