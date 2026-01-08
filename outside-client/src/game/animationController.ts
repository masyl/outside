import { WorldState, GameObject, Position } from '@outside/core';
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

      if (!this.positionsDiffer(fromPos, toPos)) {
        return;
      }

      this.animateMovement(id, fromPos, toPos);
    });

    this.previousState = currentState;
  }

  private positionsDiffer(a: Position, b: Position): boolean {
    return a.x !== b.x || a.y !== b.y;
  }

  private animateMovement(id: string, fromPos: Position, toPos: Position): void {
    const sprite = this.renderer.getSpriteForObject(id);
    if (!sprite) {
      console.warn(`Sprite not found for object ${id}`);
      return;
    }

    // Cancel any existing animation for this object
    const existing = this.activeAnimations.get(id);
    if (existing) {
      existing();
      this.activeAnimations.delete(id);
    }

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
      500,
      (pixelX, pixelY) => {
        // Update sprite position in pixel space
        // This allows the sprite to be at intermediate positions between grid tiles
        sprite.x = pixelX;
        sprite.y = pixelY;
      },
      () => {
        // Animation complete - ensure sprite is exactly at target grid position
        sprite.x = toPos.x * DISPLAY_TILE_SIZE;
        sprite.y = toPos.y * DISPLAY_TILE_SIZE;
        this.activeAnimations.delete(id);
      }
    );

    this.activeAnimations.set(id, cancel);
  }
}

