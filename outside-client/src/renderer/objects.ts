import { Sprite, Container, Texture, Renderer } from 'pixi.js';
import { WorldState, GameObject } from '@outside/core';
import { DISPLAY_TILE_SIZE } from './grid';

/**
 * Create a placeholder sprite for a bot (until PNG is provided)
 * @param color - Color in hex format (e.g., '#00ff00' for green, '#ffffff' for white)
 */
function createBotPlaceholder(renderer?: Renderer, color: string = '#00ff00'): Sprite {
  // Use canvas fallback for simplicity and reliability
  // Create a simple colored sprite using a canvas
  const canvas = document.createElement('canvas');
  canvas.width = DISPLAY_TILE_SIZE;
  canvas.height = DISPLAY_TILE_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
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

export type SpriteIndex = Map<string, Sprite>;

/**
 * Render all objects in the world and build a sprite index by object id
 */
export function createObjectsLayerWithIndex(
  world: WorldState,
  botTexture: Texture | undefined,
  renderer: Renderer | undefined,
  selectedBotId: string | null = null
): { container: Container; spriteIndex: SpriteIndex } {
  const container = new Container();
  const spriteIndex: SpriteIndex = new Map();

  // Create sprites for each object
  world.objects.forEach((object) => {
    let sprite: Sprite;

    if (object.type === 'bot') {
      if (botTexture) {
        sprite = createBotSprite(botTexture);
      } else {
        // Use green for selected bot, white for others
        const color = object.id === selectedBotId ? '#00ff00' : '#ffffff';
        sprite = createBotPlaceholder(renderer, color);
      }

      // Position sprite at object's grid position
      sprite.x = object.position.x * DISPLAY_TILE_SIZE;
      sprite.y = object.position.y * DISPLAY_TILE_SIZE;

      container.addChild(sprite);
      spriteIndex.set(object.id, sprite);
    }
  });

  return { container, spriteIndex };
}

/**
 * Update object positions in the renderer and keep sprite index in sync
 * Does NOT set sprite positions - that's handled by AnimationController
 * Only creates new sprites for new objects and removes sprites for deleted objects
 */
export function updateObjectsLayerWithIndex(
  container: Container,
  world: WorldState,
  botTexture: Texture | undefined,
  renderer: Renderer | undefined,
  spriteIndex: SpriteIndex,
  selectedBotId: string | null = null
): void {
  // Track which objects exist in the new state
  const currentObjectIds = new Set<string>();

  // Create or update sprites for existing objects
  world.objects.forEach((object) => {
    currentObjectIds.add(object.id);

    if (object.type === 'bot') {
      let sprite = spriteIndex.get(object.id);

      // Create sprite if it doesn't exist
      if (!sprite) {
        if (botTexture) {
          sprite = createBotSprite(botTexture);
        } else {
          // Use green for selected bot, white for others
          const color = object.id === selectedBotId ? '#00ff00' : '#ffffff';
          sprite = createBotPlaceholder(renderer, color);
        }

        // Only set initial position when creating - AnimationController handles updates
        sprite.x = object.position.x * DISPLAY_TILE_SIZE;
        sprite.y = object.position.y * DISPLAY_TILE_SIZE;

        container.addChild(sprite);
        spriteIndex.set(object.id, sprite);
      }
      // If sprite exists, DO NOT update its position here
      // AnimationController will handle position updates via animations
    }
  });

  // Remove sprites for objects that no longer exist
  spriteIndex.forEach((sprite, id) => {
    if (!currentObjectIds.has(id)) {
      container.removeChild(sprite);
      spriteIndex.delete(id);
    }
  });
}

/**
 * Update sprite colors based on selection
 * Recreates sprites with new colors
 */
export function updateSpriteColors(
  container: Container,
  world: WorldState,
  botTexture: Texture | undefined,
  renderer: Renderer | undefined,
  spriteIndex: SpriteIndex,
  selectedBotId: string | null
): void {
  world.objects.forEach((object) => {
    if (object.type === 'bot') {
      const sprite = spriteIndex.get(object.id);
      if (sprite) {
        // Only update color if using placeholder (not texture)
        if (!botTexture) {
          const color = object.id === selectedBotId ? '#00ff00' : '#ffffff';
          
          // Remove old sprite
          container.removeChild(sprite);
          
          // Create new sprite with correct color
          const newSprite = createBotPlaceholder(renderer, color);
          newSprite.x = sprite.x;
          newSprite.y = sprite.y;
          
          container.addChild(newSprite);
          spriteIndex.set(object.id, newSprite);
        }
      }
    }
  });
}

