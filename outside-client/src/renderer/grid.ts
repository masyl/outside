import { Graphics, Container } from 'pixi.js';
import { WorldState } from '@outside/core';

const TILE_SIZE = 16;
const PIXEL_RATIO = 4;
const DISPLAY_TILE_SIZE = TILE_SIZE * PIXEL_RATIO; // 64px

const DARK_GREY = 0x2a2a2a;
const DARKER_GREY = 0x1a1a1a;

/**
 * Create and render the checkered grid background
 * Each tile has a 4x4 checkered pattern inside it using the same two tones
 */
export function createGrid(world: WorldState): Container {
  const container = new Container();
  const graphics = new Graphics();

  // Size of each small square in the 4x4 pattern
  const PATTERN_SIZE = DISPLAY_TILE_SIZE / 4; // 16px per square (64px / 4 = 16px)

  // Draw each tile with a 4x4 checkered pattern inside
  for (let tileY = 0; tileY < world.height; tileY++) {
    for (let tileX = 0; tileX < world.width; tileX++) {
      const tileXPos = tileX * DISPLAY_TILE_SIZE;
      const tileYPos = tileY * DISPLAY_TILE_SIZE;

      // Draw 4x4 pattern inside this tile
      for (let patternY = 0; patternY < 4; patternY++) {
        for (let patternX = 0; patternX < 4; patternX++) {
          // Alternate colors in a checkered pattern
          const isDark = (patternX + patternY) % 2 === 0;
          const color = isDark ? DARK_GREY : DARKER_GREY;
          
          const squareX = tileXPos + patternX * PATTERN_SIZE;
          const squareY = tileYPos + patternY * PATTERN_SIZE;
          
          graphics
            .rect(squareX, squareY, PATTERN_SIZE, PATTERN_SIZE)
            .fill(color);
        }
      }
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
