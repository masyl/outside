import { Application, Container, type Sprite } from 'pixi.js';
import { DEFAULT_TILE_SIZE } from './constants';
import { DEFAULT_ICON_URLS } from './icons';
import { PixiGridBackground } from './pixi/background';
import { createRendererAssets, loadRendererAssets } from './pixi/assets';
import { PixiViewController } from './pixi/view-controller';
import { PixiDebugOverlay } from './pixi/debug-overlay';
import { runRenderPass, type RenderDisplayState } from './pixi/render-pass';
import { RenderStreamController } from './pixi/stream-controller';
import type { PixiRendererOptions } from './pixi/types';
import type { RenderStreamPacket } from './render-world';

/**
 * Pixi renderer that consumes serialized simulator deltas/snapshots and renders a read-only view.
 */
export class PixiEcsRenderer {
  private readonly app: Application;
  private readonly root: Container;
  private readonly tileLayer: Container;
  private readonly entityLayer: Container;
  private readonly stream: RenderStreamController;
  private readonly view: PixiViewController;
  private readonly debugOverlay: PixiDebugOverlay;

  private readonly displayState: RenderDisplayState;
  private readonly assets = createRendererAssets();

  private readonly assetBaseUrl: string;
  private readonly iconUrls: typeof DEFAULT_ICON_URLS;
  private assetsReady: Promise<void> | null = null;

  /**
   * Creates a renderer bound to a Pixi application.
   *
   * @param app `Application` Pixi application hosting the stage and renderer.
   * @param options `PixiRendererOptions` optional camera/debug/asset configuration.
   */
  constructor(app: Application, options: PixiRendererOptions = {}) {
    this.app = app;
    this.assetBaseUrl = options.assetBaseUrl ?? '/sprites';
    this.iconUrls = {
      ...DEFAULT_ICON_URLS,
      ...options.iconUrls,
    };

    this.root = new Container();
    this.root.sortableChildren = true;

    this.tileLayer = new Container();
    this.entityLayer = new Container();
    this.tileLayer.zIndex = 0;
    this.entityLayer.zIndex = 1;
    this.root.addChild(this.tileLayer);
    this.root.addChild(this.entityLayer);

    const backgroundLayer = new Container();
    backgroundLayer.zIndex = 0;
    this.root.zIndex = 1;

    this.app.stage.sortableChildren = true;
    this.app.stage.addChild(backgroundLayer);
    this.app.stage.addChild(this.root);

    const background = new PixiGridBackground(this.app.renderer, backgroundLayer);
    this.view = new PixiViewController(
      this.app.renderer,
      this.root,
      background,
      options.tileSize ?? DEFAULT_TILE_SIZE
    );

    this.debugOverlay = new PixiDebugOverlay(this.app.stage);
    this.debugOverlay.setEnabled(options.debugEnabled ?? false);

    this.stream = new RenderStreamController();

    this.displayState = {
      displayIndex: new Map<number, Sprite>(),
      displayKinds: new Map(),
    };
  }

  /**
   * Enables or disables on-canvas debug diagnostics.
   *
   * @param enabled `boolean` that toggles debug overlays and verbose logging.
   */
  setDebugEnabled(enabled: boolean): void {
    this.debugOverlay.setEnabled(enabled);
  }

  /**
   * Updates tile size and redraws immediately.
   *
   * @param tileSize `number` next tile side length in pixels.
   */
  setTileSize(tileSize: number): void {
    this.view.setTileSize(tileSize);
    this.render();
  }

  /**
   * Loads textures asynchronously. Rendering starts immediately using placeholders.
   *
   * @returns `Promise<void>` resolved when all configured textures have loaded.
   */
  async loadAssets(): Promise<void> {
    if (this.assetsReady) return this.assetsReady;

    this.assetsReady = loadRendererAssets(this.assets, {
      assetBaseUrl: this.assetBaseUrl,
      iconUrls: this.iconUrls,
      // Re-render once loaded so placeholder textures are replaced immediately.
      onLoaded: () => this.render(),
    }).catch((error) => {
      console.error('[PixiEcsRenderer] Failed to load assets:', error);
    });

    await this.assetsReady;
  }

  /**
   * Applies one simulator stream packet and triggers a frame render.
   *
   * @param packet `RenderStreamPacket` delta/snapshot payload for the current tick.
   */
  applyStream(packet: RenderStreamPacket): void {
    this.stream.apply(packet);
    this.render();
  }

  /**
   * Clears display objects and resets the local render world.
   */
  resetWorld(): void {
    for (const sprite of this.displayState.displayIndex.values()) {
      sprite.destroy();
    }
    this.displayState.displayIndex.clear();
    this.displayState.displayKinds.clear();
    this.tileLayer.removeChildren();
    this.entityLayer.removeChildren();

    this.stream.reset();
    this.render();
  }

  /**
   * Returns the active asset-loading promise.
   *
   * @returns `Promise<void> | null` existing in-flight promise, else `null` before first load call.
   */
  getAssetsReady(): Promise<void> | null {
    return this.assetsReady;
  }

  /**
   * Places a world coordinate at viewport center and redraws.
   *
   * @param worldX `number` center X in world tile units.
   * @param worldY `number` center Y in world tile units.
   */
  setViewCenter(worldX: number, worldY: number): void {
    const metrics = this.view.setViewCenter(worldX, worldY);

    this.debugOverlay.setCenterLabel(
      worldX,
      worldY,
      metrics.screenWidth,
      metrics.screenHeight,
      metrics.rootX,
      metrics.rootY
    );

    if (this.debugOverlay.isEnabled()) {
      console.log('[PixiEcsRenderer] view center', {
        worldX,
        worldY,
        screenWidth: metrics.screenWidth,
        screenHeight: metrics.screenHeight,
      });
      console.log('[PixiEcsRenderer] root position', { x: metrics.rootX, y: metrics.rootY });
    }

    // Static stories call camera updates independently from stream packets.
    this.render();
  }

  /**
   * Reapplies the last requested center.
   */
  recenter(): void {
    const metrics = this.view.recenter();
    if (!metrics) return;

    if (this.debugOverlay.isEnabled()) {
      console.log('[PixiEcsRenderer] recenter', metrics);
    }
  }

  /**
   * Updates viewport-dependent rendering resources.
   *
   * @param width `number` viewport width in pixels.
   * @param height `number` viewport height in pixels.
   */
  setViewportSize(width: number, height: number): void {
    this.view.setViewportSize(width, height);
    this.recenter();
  }

  /**
   * Runs one full render pass for the current render world.
   */
  render(): void {
    this.view.updateBackground();

    const stats = runRenderPass(
      this.app.renderer,
      this.stream.getWorldState(),
      this.assets,
      this.view.getTileSize(),
      this.tileLayer,
      this.entityLayer,
      this.displayState
    );

    this.debugOverlay.setStatsLabel(
      `entities=${stats.entityCount} displays=${stats.displayCount} ` +
        `tiles=${stats.tileDisplayCount} ents=${stats.entityDisplayCount} ` +
        `floor=${stats.floorCount} wall=${stats.wallCount} hero=${stats.heroCount} food=${stats.foodCount} bot=${stats.botCount} error=${stats.errorCount} ` +
        `root=(${this.root.x.toFixed(1)}, ${this.root.y.toFixed(1)})`
    );

    if (this.debugOverlay.isEnabled()) {
      console.log('[PixiEcsRenderer] render entities=', stats.entityCount);
      console.log(
        '[PixiEcsRenderer] displayIndex=',
        stats.displayCount,
        'tileLayer=',
        stats.tileDisplayCount,
        'entityLayer=',
        stats.entityDisplayCount
      );
    }

    try {
      this.app.renderer.clear();
      this.app.renderer.render(this.app.stage);
    } catch (error) {
      console.warn('[PixiEcsRenderer] render failed', error);
    }
  }

  /**
   * Destroys all renderer-owned display objects and helpers.
   */
  destroy(): void {
    for (const sprite of this.displayState.displayIndex.values()) {
      sprite.destroy();
    }
    this.displayState.displayIndex.clear();
    this.displayState.displayKinds.clear();
    this.debugOverlay.destroy();
    this.view.destroy();
    this.root.destroy({ children: true });
  }
}

export type { PixiRendererOptions } from './pixi/types';
