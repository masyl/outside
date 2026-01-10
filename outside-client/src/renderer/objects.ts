import { Sprite, Container, Texture, Renderer, Rectangle } from 'pixi.js';
import { WorldState, GameObject, Direction } from '@outside/core';
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
  // If texture is a spritesheet (large image), slice the first 16x16 tile
  // Sheet: /sprites/eris-esra-character-template-4/16x16/16x16 Idle-Sheet.png
  // Default bot: (0, 0) -> x=0, y=0, w=16, h=16
  
  // Check if texture is likely the full sheet (width > 16)
  // Or just always slice the first tile for now since we know the asset
  
  // Create a new texture that references the source but with the correct frame
  const tileTexture = new Texture({
    source: texture.source,
    frame: new Rectangle(4, 4, 16, 16)
    //frame: new Rectangle(0, 0, 16, 16)
  });

  const sprite = new Sprite(tileTexture);
  
  // Scale 16x16 sprite to the needed ratio
  sprite.width = DISPLAY_TILE_SIZE;
  sprite.height = DISPLAY_TILE_SIZE;
  
  // Anchor point is top-left by default, which matches our grid system
  
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
      } else {
        // Sprite exists, check if we need to upgrade it from placeholder to texture
        if (botTexture) {
          // Check if current sprite is using the bot texture
          // We can check if the sprite's texture source matches the bot texture source
          if (sprite.texture.source !== botTexture.source) {
            // Replace placeholder with textured sprite
            const newSprite = createBotSprite(botTexture);
            
            // Preserve position
            newSprite.x = sprite.x;
            newSprite.y = sprite.y;
            
            // Swap sprites
            container.removeChild(sprite);
            container.addChild(newSprite);
            spriteIndex.set(object.id, newSprite);
          }
        }
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
 * Update a bot sprite's texture frame based on direction and animation state
 */
export function updateBotSpriteFrame(
  sprite: Sprite,
  idleTexture: Texture,
  walkTexture: Texture,
  direction: Direction,
  isMoving: boolean,
  frameIndex: number
): void {
  // Determine row based on direction
  // Row 0: Down
  // Row 1: Down-Right (Flip for Down-Left)
  // Row 2: Right (Flip for Left)
  // Row 3: Up-Right (Flip for Up-Left)
  // Row 4: Up
  
  let row = 0;
  let flipX = false;
  
  switch (direction) {
    case 'down': row = 0; break;
    case 'down-right': row = 1; break;
    case 'down-left': row = 1; flipX = true; break;
    case 'right': row = 2; break;
    case 'left': row = 2; flipX = true; break;
    case 'up-right': row = 3; break;
    case 'up-left': row = 3; flipX = true; break;
    case 'up': row = 4; break;
  }
  
  // Select texture based on state
  const sourceTexture = isMoving ? walkTexture : idleTexture;
  
  // Calculate frame position
  // 16x16 frames with 4px padding between rows/columns?
  // User mentions 4px padding between rows and columns.
  // Assuming 16px sprite + 4px gap = 20px stride
  const SPRITE_SIZE = 16;
  const PADDING = 2;
  const STRIDE = SPRITE_SIZE + PADDING * 2;
  
  const frameX = frameIndex * STRIDE + PADDING;
  const frameY = row * STRIDE + PADDING;
  
  // Update texture frame
  const newTexture = new Texture({
    source: sourceTexture.source,
    frame: new Rectangle(frameX, frameY, SPRITE_SIZE, SPRITE_SIZE)
  });
  
  sprite.texture = newTexture;
  
  // Handle flipping: anchor.x=1 + negative scale effectively flips in place for top-left origin
  if (flipX) {
    sprite.scale.x = -1 * (DISPLAY_TILE_SIZE / 16);
    // Setting anchor to 1 makes the sprite draw to the left of its x position (width * 1).
    // Combined with negative scale (which flips it horizontally), it ends up drawing from x-width to x.
    // But our grid position (sprite.x) is the top-left of the tile.
    // If we draw from x-width to x, we are drawing one tile to the left!
    // We want to draw from x to x+width, but flipped.
    // If scale.x is -1, and anchor.x is 0: draws from x to x-width (flipped). (One tile left)
    // If scale.x is -1, and anchor.x is 1: draws from x-(-width) = x+width to x. (Correct tile position!)
    
    // Wait, let's trace coordinate space:
    // Position = P.
    // Texture width = W. Scale = -1.
    // Pixel = P - (Anchor * W * Scale) + (Local * Scale) ? No.
    // Rendered X = P.x - (Anchor.x * Width)
    // If scale is -1, Width is -64.
    // Rendered X = P.x - (Anchor.x * -64) = P.x + (Anchor.x * 64).
    
    // If Anchor.x = 0: Rendered X = P.x. The sprite draws from P.x to P.x - 64 (leftwards). -> WRONG (draws tile to left)
    // If Anchor.x = 1: Rendered X = P.x + 64. The sprite draws from P.x+64 to P.x (leftwards). -> CORRECT (draws in current tile)
    
    // The user says "It make the sprite draw a full tile too much to the left".
    // This implies my logic "Anchor.x = 1" resulted in drawing to the left?
    // Or maybe I am misunderstood about how negative scale works combined with anchor.
    
    // Let's try standard approach: Center the anchor (0.5), and offset position by +32.
    // But changing position breaks animation controller logic which sets sprite.x directly.
    
    // Let's re-verify the "Draw too much to left" issue.
    // If "Too much to left", it means X is smaller than it should be.
    
    // If I used Anchor.x = 1, and Scale = -1.
    // Visual Left Edge = Position.x + (1 * 64) - 64 = Position.x?
    // Let's try Anchor.x = 0 with Scale = -1.
    // Visual Left Edge = Position.x - 64. (Definitely to the left).
    
    // Maybe PixiJS handles negative width differently?
    // If scale.x = -1, sprite width becomes negative?
    
    // What if I used `anchor.x = 1`?
    // User says "draw a full tile too much to the left".
    // That sounds like it drew at x - 64.
    
    // Let's try the inverse: `anchor.x = 0` with negative scale usually draws to left.
    // `anchor.x = 1` with negative scale usually draws to right (relative to origin).
    
    // Maybe I should set position offset on the container or pivot?
    
    // Alternative: Don't mess with anchor.
    // Use scale.x = -1.
    // And shift sprite.x by +width.
    // But sprite.x is managed by AnimationController.
    // We can't change sprite.x here permanently or it will drift or fight with AnimationController.
    
    // We can use `sprite.pivot`.
    // Pivot is in texture coordinates (pixels).
    // If we pivot around center (8,8) or (16,0)?
    
    // Let's try `sprite.anchor.x = 1` again.
    // If user says "too much to left", maybe it was actually drawing at X?
    // Wait, if the sprite is FLIPPED, the "Left" of the image is now on the right.
    
    // Let's assume my logic "Anchor.x = 1" was intended to fix the "draws to left" issue of negative scale.
    // If the user sees it "too much to left", maybe `anchor.x = 1` moved it *further* left?
    // (If -64 width * 1 anchor = -64 offset).
    
    // Let's try: Anchor.x = 0.
    // Scale.x = -1.
    // This draws from X to X-64. (One tile left).
    
    // How to draw from X to X+64 with Scale -1?
    // We need an offset of +64.
    // Anchor.x * Width = Offset.
    // If Width is -64.
    // We need +64.
    // Anchor.x * -64 = 64 => Anchor.x = -1.
    
    // Let's try setting `sprite.anchor.x = 1` implies offset is 64 if width is positive?
    // Pixi calculation: `pos - (anchor * size)`.
    // If scale is -1, size is -64.
    // `pos - (1 * -64) = pos + 64`.
    // So the origin is at pos + 64.
    // And it draws towards left (scale -1) -> from pos+64 to pos.
    // This occupies [pos, pos+64]. This IS the correct tile.
    
    // Why did user see it to the left?
    // Maybe the user meant "It makes the sprite draw a full tile too much to the *RIGHT*"?
    // Or maybe my understanding of Pixi negative scale anchor is inverted.
    
    // Let's try a different approach that is robust:
    // Set anchor to (0.5, 0.5) (Center).
    // Then sprite.x needs to be centered in the tile.
    // But sprite.x is top-left of tile.
    // We can use `sprite.x` (managed by controller) + offset?
    // We can use a child sprite!
    // Container (at x,y) -> Sprite (at 32,32, anchor 0.5).
    
    // But `createBotSprite` returns the Sprite directly which is added to `objectsContainer`.
    // Replacing Sprite with Container breaks expectations?
    // `spriteIndex` stores `Sprite`. `objectsContainer.addChild(sprite)`.
    // `AnimationController` moves `sprite.x`.
    
    // If we use `anchor.x = 0.5`, `sprite.x` must be `tileX + 32`.
    // AnimationController sets `sprite.x = pixelX`.
    // We'd need to change AnimationController to offset by 32.
    
    // Let's try fixing the anchor math.
    // If user says "too much to left", maybe it was at `x-64`.
    // This happens if `anchor.x = 0` and `scale.x = -1`.
    // But I set `anchor.x = 1`.
    
    // Maybe `DISPLAY_TILE_SIZE` is not 64?
    // It is imported from grid.ts.
    
    // Let's try `anchor.x = 0` and `pivot.x = 16` (texture width)?
    // Scale happens after pivot?
    
    // If I assume the user is correct and I was wrong:
    // "The trick ... doesn't seem to work. It make the sprite draw a full tile too much to the left"
    // This implies visually the sprite is at `x - 64`.
    // Which implies my `anchor.x = 1` logic resulted in `x - 64`.
    // This would happen if `size` was positive 64 during anchor calculation?
    // `pos - (1 * 64) = pos - 64`.
    // Pixi `width` property is `sign(scale) * texture.width`.
    
    // Let's try explicitly setting the pivot instead of anchor for flipping.
    // Pivot is in local unscaled coordinates (0..16).
    // To flip around the center of the 16px sprite: pivot.x = 8.
    // Then position needs to be center of tile?
    
    // Let's try this:
    // Keep anchor = 0.
    // Set `scale.x = -1`.
    // This flips it and draws at `x` going left -> `x-64`.
    // We want it at `x` going right (but flipped image).
    // So we want it to occupy `x` to `x+64`.
    // But visually flipped.
    // If we draw at `x+64` with scale -1, it draws from `x+64` to `x`.
    // So we need to shift position by +64.
    // But we can't shift `sprite.x`.
    // We can shift `sprite.pivot.x`? No, pivot is pre-scale.
    // We can use `sprite.anchor.x`.
    
    // If `anchor.x = 1` didn't work, maybe `anchor.x = 0` and `x` offset is needed.
    
    // Let's try `anchor.x = 1` but forcing the sign?
    // Maybe I should just set `anchor.x = 1` ALWAYS when flipped?
    // I did that.
    
    // Let's trust the user observation: It is too far LEFT.
    // So we need to move it RIGHT.
    // To move right by 64px (1 tile), we need to add 64 to X.
    // Or adjust anchor to shift it right.
    // Decreasing anchor X shifts sprite Right.
    // Increasing anchor X shifts sprite Left.
    // Wait. `pos - anchor * size`.
    // If size is positive: higher anchor -> smaller result (Left).
    // If size is negative: higher anchor -> larger result (Right)?
    // `pos - (1 * -64) = pos + 64`. (Right).
    
    // If the user sees it Left, maybe size is NOT negative?
    // `sprite.scale.x = -1`.
    // Maybe Pixi anchor uses absolute width?
    // `pos - (anchor * abs(width))`.
    // `pos - (1 * 64) = pos - 64` (Left).
    
    // If Pixi uses absolute width for anchor calculation:
    // We want `pos + 0` (Left edge of sprite at pos)? No, right edge of sprite at pos?
    // Flipped sprite: The "Left" of the image (now visual right) is at `pos`.
    // The "Right" of the image (now visual left) is at `pos + 64`.
    // We want the image to occupy `x` to `x+64`.
    // With `scale = -1`.
    // Origin of sprite texture (0,0) is usually top-left.
    // Scaled -1, origin (0,0) is still at `sprite.x`.
    // But image draws leftwards from origin.
    // So image draws `x` to `x-64`.
    // We want image `x` to `x+64`.
    // So we need origin to be at `x+64`.
    // `sprite.x` is fixed at `x`.
    // We need offset `+64`.
    // `pos - (anchor * width)`.
    // If width is -64: `anchor * -64 = -64` => anchor = 1. (This is what I did).
    // If width is 64 (abs): `anchor * 64 = -64` => anchor = -1.
    
    // Let's try `anchor.x = 0` (default) and `pivot.x = 16` (texture width).
    // `pivot` is point in texture to place at `sprite.x`.
    // If pivot is 16 (right edge of texture).
    // And scale is -1.
    // This might behave better.
    
    // ACTUALLY: The standard way to flip in place with top-left origin 0,0:
    // Translate to center, scale -1, translate back?
    
    // Try: `anchor.x = 1` caused it to shift left?
    // That suggests `anchor * size` was positive.
    // `pos - (+64) = pos - 64`.
    // So `size` was positive 64? But I set `scale.x = -1`.
    // Does Pixi anchor calculation use `this.width` which might report positive?
    
    // Let's try setting `anchor.x = 0` and using `pivot`.
    // Or just try `anchor.x = 0`?
    // If `anchor.x = 0`, scale -1 -> draws at X going Left (X-64).
    // That is definitely left.
    
    // The user said "The trick... doesn't seem to work. It make the sprite draw a full tile too much to the left".
    // This implies `anchor.x = 1` resulted in the sprite being at `x-64`.
    
    // I will try setting `anchor.x = 0` and `x` offset in `renderer/objects.ts` isn't possible because `x` is managed externally.
    // But wait, `sprite.texture` frame update doesn't change `x`.
    
    // Let's assume Pixi uses absolute width for anchor.
    // To shift RIGHT by 64px (to counteract the -64 flip), we need `anchor = -1`?
    // `pos - (-1 * 64) = pos + 64`.
    
    // Let's try `anchor.x = 0` and `pivot.x = 16` (the width of the texture, 16px).
    // Pivot 16 means the right side of the 16px texture is placed at `sprite.x`.
    // If scale is 1: Image draws `x-64` to `x`. (Left).
    // If scale is -1: Image draws `x` to `x+64`?
    // Let's trace:
    // Coord = (TexCoord - Pivot) * Scale + Position.
    // Left Pixel (0): (0 - 16) * -4 + P = (-16 * -4) + P = 64 + P.
    // Right Pixel (16): (16 - 16) * -4 + P = 0 + P = P.
    // So it draws from P+64 (Pixel 0) to P (Pixel 16).
    // Occupies P to P+64.
    // THIS LOOKS CORRECT!
    
    // So:
    // flipX: scale.x = -4, pivot.x = 16.
    // no flip: scale.x = 4, pivot.x = 0.
    
    // Note: scale factor is `DISPLAY_TILE_SIZE / 16` = 4.
    
    sprite.scale.x = (flipX ? -1 : 1) * (DISPLAY_TILE_SIZE / 16);
    sprite.pivot.x = flipX ? 16 : 0;
    sprite.anchor.x = 0; // Reset anchor just in case
  } else {
    sprite.scale.x = 1 * (DISPLAY_TILE_SIZE / 16);
    sprite.pivot.x = 0;
    sprite.anchor.x = 0;
  }
  // Ensure Y scale is correct
  sprite.scale.y = DISPLAY_TILE_SIZE / 16;
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

