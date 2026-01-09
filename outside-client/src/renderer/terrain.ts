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
  console.log(`[createTerrainSprite] Creating sprite for ${terrain.type} (${terrain.id}) at (${terrain.position.x}, ${terrain.position.y}) size ${terrain.width}x${terrain.height} with color ${hexColor} (${color})`);
  
  // Fill the canvas with the terrain color
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Debug: Verify canvas was filled
  const imageData = ctx.getImageData(0, 0, 1, 1);
  const actualColor = `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`;
  console.log(`[createTerrainSprite] Canvas filled. Actual pixel color: ${actualColor}`);
  
  const texture = Texture.from(canvas);
  const sprite = new Sprite(texture);
  
  // Ensure sprite is visible
  sprite.visible = true;
  sprite.alpha = 1.0;
  
  console.log(`[createTerrainSprite] Created sprite: width=${sprite.width}, height=${sprite.height}, visible=${sprite.visible}, alpha=${sprite.alpha}`);
  
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
  console.log(`[createTerrainLayer] Creating terrain layer with ${terrainCount} terrain objects`);
  
  // Sort terrain objects by createdAt ascending (oldest first, newest last)
  // In Pixi.js, sprites added later render on top, so newest terrain will appear on top
  const sortedTerrains = Array.from(world.groundLayer.terrainObjects.values())
    .sort((a, b) => a.createdAt - b.createdAt);
  
  // Render all terrain objects
  for (const terrain of sortedTerrains) {
    console.log(`[createTerrainLayer] Rendering terrain: ${terrain.id} (${terrain.type}) at (${terrain.position.x}, ${terrain.position.y}) size ${terrain.width}x${terrain.height}`);
    const sprite = createTerrainSprite(terrain);
    sprite.x = terrain.position.x * DISPLAY_TILE_SIZE;
    sprite.y = terrain.position.y * DISPLAY_TILE_SIZE;
    
    console.log(`[createTerrainLayer] Sprite positioned at (${sprite.x}, ${sprite.y}), size: ${sprite.width}x${sprite.height}, visible: ${sprite.visible}`);
    
    container.addChild(sprite);
  }
  
  console.log(`[createTerrainLayer] Created terrain layer with ${container.children.length} sprites`);
  
  // Debug: Check if container has children
  if (container.children.length === 0) {
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
  console.log(`[updateTerrainLayer] Updating terrain layer. Current children: ${container.children.length}`);
  
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
  
  console.log(`[updateTerrainLayer] Terrain layer updated. New children count: ${container.children.length}`);
  
  // Clean up the temporary container (but not its children since we moved them)
  newLayer.destroy({ children: false });
}
