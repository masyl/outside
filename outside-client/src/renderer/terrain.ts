import { Sprite, Container, Texture, Graphics } from 'pixi.js';
import { WorldState, TerrainObject } from '@outside/core';
import { DISPLAY_TILE_SIZE } from './grid';

/**
 * Get terrain color based on type
 */
function getTerrainColor(terrainType: string): number {
  switch (terrainType) {
    case 'grass':
      return 0x00ff00; // green
    case 'dirt':
      return 0x8b4513; // brown
    case 'water':
      return 0x0000ff; // blue
    case 'sand':
      return 0xf5deb3; // beige
    case 'hole':
      return 0x000000; // black
    default:
      return 0x808080; // grey (fallback)
  }
}

/**
 * Create a sprite for a terrain object (solid color)
 */
function createTerrainSprite(terrain: TerrainObject): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = terrain.width * DISPLAY_TILE_SIZE;
  canvas.height = terrain.height * DISPLAY_TILE_SIZE;
  const ctx = canvas.getContext('2d')!;
  
  if (!ctx) {
    console.error(`[createTerrainSprite] Failed to get 2d context for terrain ${terrain.id}`);
    // Create a fallback sprite
    const graphics = new Graphics();
    const color = getTerrainColor(terrain.type);
    graphics.rect(0, 0, terrain.width * DISPLAY_TILE_SIZE, terrain.height * DISPLAY_TILE_SIZE);
    graphics.fill(color);
    return graphics;
  }
  
  const color = getTerrainColor(terrain.type);
  // Convert number to hex string with leading zeros
  const hexColor = `#${color.toString(16).padStart(6, '0')}`;
  
  // Fill the canvas with the terrain color
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const texture = Texture.from(canvas);
  const sprite = new Sprite(texture);
  
  // Ensure sprite is visible
  sprite.visible = true;
  sprite.alpha = 1.0;
  
  return sprite;
}

/**
 * Create terrain layer by rendering terrain objects as full sprites
 * Terrains are rendered in order of creation (oldest first, newest last)
 * so that overlapping terrain correctly shows the newest (top-most) one
 */
export function createTerrainLayer(
  world: WorldState
): Container {
  const container = new Container();
  
  const terrainCount = world.groundLayer.terrainObjects.size;
  
  // Sort terrain objects by createdAt ascending (oldest first, newest last)
  // In Pixi.js, sprites added later render on top, so newest terrain will appear on top
  const sortedTerrains = Array.from(world.groundLayer.terrainObjects.values())
    .sort((a, b) => a.createdAt - b.createdAt);
  
  // Render all terrain objects
  for (const terrain of sortedTerrains) {
    const sprite = createTerrainSprite(terrain);
    sprite.x = terrain.position.x * DISPLAY_TILE_SIZE;
    sprite.y = terrain.position.y * DISPLAY_TILE_SIZE;
    
    container.addChild(sprite);
  }
  
  // Debug: Check if container has children (only warn if there's an actual issue)
  if (container.children.length === 0 && terrainCount > 0) {
    console.warn(`[createTerrainLayer] WARNING: Terrain layer has no children even though ${terrainCount} terrain objects exist!`);
  }
  
  return container;
}

/**
 * Update terrain layer when terrain changes
 * Rebuilds the entire layer (could be optimized later)
 */
export function updateTerrainLayer(
  container: Container,
  world: WorldState
): void {
  // Updating terrain layer (no logging to avoid console spam)
  
  // Clear existing terrain - destroy children properly
  container.children.forEach(child => {
    child.destroy({ children: false });
  });
  container.removeChildren();
  
  // Recreate terrain layer
  const newLayer = createTerrainLayer(world);
  
  // Add all children from new layer to existing container
  const childrenToAdd = [...newLayer.children]; // Copy array before moving
  for (const child of childrenToAdd) {
    container.addChild(child);
  }
  
  // Terrain layer updated
  
  // Clean up the temporary container (but not its children since we moved them)
  newLayer.destroy({ children: false });
}
