import type { Container, Renderer } from 'pixi.js';
import { PixiGridBackground } from './background';

/**
 * Camera + viewport + tile-size controller for Pixi renderer.
 */
export class PixiViewController {
  private lastCenter: { x: number; y: number } | null = null;

  /**
   * @param renderer `Renderer` used for viewport dimensions.
   * @param root `Container` world root that gets translated for camera movement.
   * @param background `PixiGridBackground` tiled grid owner.
   * @param tileSize `number` initial world tile size in pixels.
   */
  constructor(
    private readonly renderer: Renderer,
    private readonly root: Container,
    private readonly background: PixiGridBackground,
    private tileSize: number
  ) {
    this.updateBackground();
  }

  /**
   * @returns `number` current tile size in pixels.
   */
  getTileSize(): number {
    return this.tileSize;
  }

  /**
   * Sets tile size and reapplies camera centering.
   *
   * @param tileSize `number` next tile side length in pixels.
   */
  setTileSize(tileSize: number): void {
    this.tileSize = tileSize;
    this.updateBackground();
    this.recenter();
  }

  /**
   * Centers world coordinate on viewport center.
   *
   * @param worldX `number` center X in world tile units.
   * @param worldY `number` center Y in world tile units.
   * @returns object with viewport/root metrics for logging/debug labels.
   */
  setViewCenter(worldX: number, worldY: number): {
    screenWidth: number;
    screenHeight: number;
    rootX: number;
    rootY: number;
  } {
    this.lastCenter = { x: worldX, y: worldY };

    const screenWidth = this.renderer.width;
    const screenHeight = this.renderer.height;

    // Convert desired world-center into root translation so world point lands at screen midpoint.
    const rootX = screenWidth / 2 - worldX * this.tileSize;
    // World space is Y-up; screen space is Y-down. Invert Y during camera translation.
    const rootY = screenHeight / 2 + worldY * this.tileSize;
    this.root.x = rootX;
    this.root.y = rootY;

    return { screenWidth, screenHeight, rootX, rootY };
  }

  /**
   * Reapplies last known world center.
   *
   * @returns same metrics as `setViewCenter`, or `null` if no center has been set yet.
   */
  recenter(): {
    screenWidth: number;
    screenHeight: number;
    rootX: number;
    rootY: number;
  } | null {
    if (!this.lastCenter) return null;
    return this.setViewCenter(this.lastCenter.x, this.lastCenter.y);
  }

  /**
   * Updates viewport size dependent resources.
   *
   * @param width `number` viewport width in pixels.
   * @param height `number` viewport height in pixels.
   */
  setViewportSize(width: number, height: number): void {
    this.updateBackground(width, height);
    this.recenter();
  }

  /**
   * Destroys view-owned resources.
   */
  destroy(): void {
    this.background.destroy();
  }

  /**
   * Updates full-screen background coverage.
   *
   * @param width optional `number` explicit viewport width in pixels.
   * @param height optional `number` explicit viewport height in pixels.
   */
  updateBackground(width?: number, height?: number): void {
    const nextWidth = width ?? this.renderer.width;
    const nextHeight = height ?? this.renderer.height;
    this.background.update(this.tileSize, nextWidth, nextHeight);
  }
}
