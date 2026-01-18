import { WorldState, GameObject, Position, Direction } from '@outside/core';
import { Store } from '../store/store';
import { GameRenderer } from '../renderer/renderer';
import { animateObjectMovement } from './animations';
import { DISPLAY_TILE_SIZE } from '../renderer/grid';

type CancelAnimation = () => void;

/**
 * AnimationController
 *
 * Listens to world state changes and triggers smooth motion.dev animations
 * for bots when their positions change.
 */
export class AnimationController {
  private store: Store;
  private renderer: GameRenderer;
  private previousState: WorldState | null = null;
  private activeAnimations: Map<string, CancelAnimation> = new Map();
  private unsubscribe: (() => void) | null = null;

  constructor(store: Store, renderer: GameRenderer) {
    this.store = store;
    this.renderer = renderer;

    this.unsubscribe = this.store.subscribe((state) => {
      this.handleStateChange(state);
    });
  }

  /**
   * Reset the previous state (useful after replaying events to avoid animating restoration)
   */
  resetPreviousState(): void {
    this.previousState = this.store.getState();
  }

  /**
   * Stop listening to store updates and cancel all animations.
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.activeAnimations.forEach((cancel) => cancel());
    this.activeAnimations.clear();
  }

  private handleStateChange(currentState: WorldState): void {
    if (!this.previousState) {
      this.previousState = currentState;
      return;
    }

    const prevObjects = this.previousState.objects;
    const currentObjects = currentState.objects;

    currentObjects.forEach((currentObj, id) => {
      const prevObj = prevObjects.get(id);
      if (!prevObj) {
        // New object – no movement animation needed yet
        return;
      }

      const fromPos = prevObj.position;
      const toPos = currentObj.position;

      // If bot was previously unpositioned, skip animation (appears instantly at new position)
      if (!fromPos || !toPos) {
        // Bot was just positioned - no animation needed, just update sprite position directly
        if (!fromPos && toPos) {
          const sprite = this.renderer.getSpriteForObject(id);
          if (sprite) {
            const VERTICAL_OFFSET = -8;
            sprite.x = toPos.x * DISPLAY_TILE_SIZE;
            sprite.y = (toPos.y * DISPLAY_TILE_SIZE) + VERTICAL_OFFSET;
          }
        }
        return;
      }

      if (!this.positionsDiffer(fromPos, toPos)) {
        return;
      }

      // Position changed - animate movement (no logging to avoid console spam)
      this.animateMovement(id, fromPos, toPos);
    });

    this.previousState = currentState;
  }

  private positionsDiffer(a: Position, b: Position): boolean {
    return a.x !== b.x || a.y !== b.y;
  }

  private animateMovement(id: string, fromPos: Position, toPos: Position): void {
    // The vertical offset should be the equivalent of four virtual pixels.
    // This is to account for the placement of the bots to "look" like they are
    // at the center of a tile instead of "inside" the tile.
    const VERTICAL_OFFSET = -8;
    let sprite = this.renderer.getSpriteForObject(id);
    if (!sprite) {
      const world = this.store.getState();
      // Try to force-creation for missing sprite (race condition between color swap + animation)
      const object = world.objects.get(id);
      if (object) {
        sprite = this.renderer.ensureSpriteForObject(object);
      }
    }

    if (!sprite) {
      console.warn(`[AnimationController] Sprite not found for object ${id}`);
      return;
    }

    // Cancel any existing animation for this object
    const existing = this.activeAnimations.get(id);
    if (existing) {
      existing();
      this.activeAnimations.delete(id);
    }

    // Determine direction
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    let direction: Direction = 'down';

    if (dx === 0 && dy === -1) direction = 'up';
    else if (dx === 0 && dy === 1) direction = 'down';
    else if (dx === -1 && dy === 0) direction = 'left';
    else if (dx === 1 && dy === 0) direction = 'right';
    else if (dx === 1 && dy === -1) direction = 'up-right';
    else if (dx === -1 && dy === -1) direction = 'up-left';
    else if (dx === 1 && dy === 1) direction = 'down-right';
    else if (dx === -1 && dy === 1) direction = 'down-left';

    // Update facing direction in store
    // Note: This dispatches an action which might trigger another state update,
    // but we're in the middle of handling a state update.
    // Ideally, the game logic (HostMode) should update facing, but AnimationController is client-side visual logic.
    // For now, we'll let the renderer handle the visual update based on direction if we can pass it.
    // But AnimationController is about position interpolation.
    
    // We can update the sprite's texture frame directly in the renderer based on direction
    // But we need to persist "facing" state for idle animations.
    
    // Let's call a method on renderer to set the facing direction for this bot
    this.renderer.updateBotDirection(id, direction, true); // true = moving

    // Always start from the sprite's CURRENT pixel position (which may be mid-animation)
    // This allows smooth continuation if an animation is interrupted
    const currentPixelX = sprite.x;
    const currentPixelY = sprite.y;
    
    // Convert current pixel position to grid coordinates for the animation function
    // The animation function expects grid coordinates and converts to pixels internally
    const fromGridX = currentPixelX / DISPLAY_TILE_SIZE;
    const fromGridY = currentPixelY / DISPLAY_TILE_SIZE;

    // Animate from current position (in grid coords) to target position (in grid coords)
    // The animation function will handle pixel interpolation, allowing smooth sub-grid movement
    const cancel = animateObjectMovement(
      id,
      fromGridX,
      fromGridY,
      toPos.x,
      toPos.y,
      375,
      (pixelX, pixelY) => {
        // Update sprite position in pixel space
        // This allows the sprite to be at intermediate positions between grid tiles
        sprite.x = pixelX;
        sprite.y = pixelY;
      },
      () => {
        // Animation complete - ensure sprite is exactly at target grid position
        sprite.x = toPos.x * DISPLAY_TILE_SIZE;
        sprite.y = (toPos.y * DISPLAY_TILE_SIZE) + VERTICAL_OFFSET;
        this.activeAnimations.delete(id);
        
        // Update state to idle
        this.renderer.updateBotDirection(id, direction, false); // false = idle
      }
    );

    this.activeAnimations.set(id, cancel);
  }
}

