import { runAnimationTic } from '../animation';
import {
  applyRenderStream,
  createRenderWorld,
  type RenderStreamPacket,
  type RenderWorldState,
} from '../render-world';

/**
 * Owns render-world lifecycle and stream packet application.
 */
export class RenderStreamController {
  private renderWorld: RenderWorldState;

  constructor() {
    this.renderWorld = createRenderWorld();
  }

  /**
   * @returns `RenderWorldState` active local render world.
   */
  getWorldState(): RenderWorldState {
    return this.renderWorld;
  }

  /**
   * Applies one stream packet then advances renderer-only animation state.
   *
   * @param packet `RenderStreamPacket` snapshot or delta payload.
   */
  apply(packet: RenderStreamPacket): void {
    applyRenderStream(this.renderWorld, packet);
    runAnimationTic(this.renderWorld);
  }

  /**
   * Resets world and deserializers to an empty state.
   */
  reset(): void {
    this.renderWorld = createRenderWorld();
  }
}
