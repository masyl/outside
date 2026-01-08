import { Sprite, Container, Texture, Renderer } from 'pixi.js';
import { WorldState, GameObject } from '@outside/core';
import { DISPLAY_TILE_SIZE } from './grid';

/**
 * Create a placeholder sprite for a bot (until PNG is provided)
 */
function createBotPlaceholder(renderer?: Renderer): Sprite {
  // Use canvas fallback for simplicity and reliability
  // Create a simple colored sprite using a canvas
  const canvas = document.createElement('canvas');
  canvas.width = DISPLAY_TILE_SIZE;
  canvas.height = DISPLAY_TILE_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(0, 0, DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE);
  const texture = Texture.from(canvas);
  return new Sprite(texture);
}

/**
 * Create a sprite from a PNG texture (for when sprite is provided)
 */
function createBotSprite(texture: Texture): Sprite {
  const sprite = new Sprite(texture);
  sprite.width = DISPLAY_TILE_SIZE;
  sprite.height = DISPLAY_TILE_SIZE;
  return sprite;
}

/**
 * Render all objects in the world
 */
export function createObjectsLayer(world: WorldState, botTexture?: Texture, renderer?: Renderer): Container {
  const container = new Container();
  
  // Create sprites for each object
  world.objects.forEach((object) => {
    let sprite: Sprite;
    
    if (object.type === 'bot') {
      if (botTexture) {
        sprite = createBotSprite(botTexture);
      } else {
        sprite = createBotPlaceholder(renderer);
      }
      
      // Position sprite at object's grid position
      sprite.x = object.position.x * DISPLAY_TILE_SIZE;
      sprite.y = object.position.y * DISPLAY_TILE_SIZE;
      
      container.addChild(sprite);
    }
  });
  
  return container;
}

/**
 * Update object positions in the renderer
 */
export function updateObjectsLayer(
  container: Container,
  world: WorldState,
  botTexture?: Texture,
  renderer?: Renderer
): void {
  // Clear existing children
  container.removeChildren();
  
  // Recreate all objects
  world.objects.forEach((object) => {
    let sprite: Sprite;
    
    if (object.type === 'bot') {
      if (botTexture) {
        sprite = createBotSprite(botTexture);
      } else {
        sprite = createBotPlaceholder(renderer);
      }
      
      sprite.x = object.position.x * DISPLAY_TILE_SIZE;
      sprite.y = object.position.y * DISPLAY_TILE_SIZE;
      
      container.addChild(sprite);
    }
  });
}
