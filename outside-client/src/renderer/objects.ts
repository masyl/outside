import { Sprite, Container, Texture, Renderer } from 'pixi.js';
import { WorldState, GameObject } from '@outside/core';
import { DISPLAY_TILE_SIZE } from './grid';

/**
 * Create a placeholder sprite for a bot (until PNG is provided)
 * Draws an 8px circle (32px diameter) centered in a 64px tile
 * Selected bots: white circle with blue outline
 * Unselected bots: white circle with grey border for contrast
 * @param isSelected - Whether this bot is currently selected
 */
export function createBotPlaceholder(renderer?: Renderer, isSelected: boolean = false): Sprite {
  // Use canvas fallback for simplicity and reliability
  // Create a circle sprite using a canvas
  const canvas = document.createElement('canvas');
  canvas.width = DISPLAY_TILE_SIZE;
  canvas.height = DISPLAY_TILE_SIZE;
  const ctx = canvas.getContext('2d')!;
  
  // Draw circle centered in the 64px canvas
  // Circle radius: 16px (DISPLAY_TILE_SIZE / 4), diameter: 32px
  // Center: 32px, 32px
  const centerX = DISPLAY_TILE_SIZE / 2; // 32px
  const centerY = DISPLAY_TILE_SIZE / 2; // 32px
  const radius = DISPLAY_TILE_SIZE / 4; // 16px
  
  if (isSelected) {
    // Selected bot: white circle with blue outline
    ctx.fillStyle = '#ffffff'; // White fill
    ctx.strokeStyle = '#0000ff'; // Blue outline
    ctx.lineWidth = 3; // 3px outline width
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Unselected bot: white circle with grey border for contrast
    ctx.fillStyle = '#ffffff'; // White fill
    ctx.strokeStyle = '#808080'; // Grey border
    ctx.lineWidth = 2; // 2px border width
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  
  const texture = Texture.from(canvas);
  return new Sprite(texture);
}

/**
 * Create a sprite from a PNG texture (for when sprite is provided)
 */
export function createBotSprite(texture: Texture): Sprite {
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
        // Selected bot: white with blue outline, unselected: light gray
        const isSelected = object.id === selectedBotId;
        sprite = createBotPlaceholder(renderer, isSelected);
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
          // Selected bot: white with blue outline, unselected: light gray
          const isSelected = object.id === selectedBotId;
          sprite = createBotPlaceholder(renderer, isSelected);
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
        // Only update appearance if using placeholder (not texture)
        if (!botTexture) {
          const isSelected = object.id === selectedBotId;
          
          // Remove old sprite
          container.removeChild(sprite);
          
          // Create new sprite with correct selection state
          const newSprite = createBotPlaceholder(renderer, isSelected);
          newSprite.x = sprite.x;
          newSprite.y = sprite.y;
          
          container.addChild(newSprite);
          spriteIndex.set(object.id, newSprite);
        }
      }
    }
  });
}

