import { Application, Container, type Sprite } from 'pixi.js';
import { DEFAULT_TILE_SIZE } from './constants';
import { DEFAULT_ICON_URLS } from './icons';
import { PixiGridBackground } from './pixi/background';
import { createRendererAssets, loadRendererAssets } from './pixi/assets';
import { PixiViewController } from './pixi/view-controller';
import { runRenderPass, type RenderDisplayState } from './pixi/render-pass';
import { RenderStreamController } from './pixi/stream-controller';
import type { PixiRendererOptions } from './pixi/types';
import type { RenderStreamPacket } from './render-world';

let NEXT_RENDERER_ID = 1;

function setNodeLabel(node: { label?: string }, label: string): void {
  node.label = label;
}

/**
 * Pixi renderer that consumes serialized simulator deltas/snapshots and renders a read-only view.
 */
export class PixiEcsRenderer {
  private readonly app: Application;
  private readonly backgroundLayer: Container;
  private readonly root: Container;
  private readonly tileLayer: Container;
  private readonly entityLayer: Container;
  private readonly stream: RenderStreamController;
  private readonly view: PixiViewController;
  private readonly rendererId: number;

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
    this.rendererId = NEXT_RENDERER_ID++;
    this.assetBaseUrl = options.assetBaseUrl ?? '/sprites';
    this.iconUrls = {
      ...DEFAULT_ICON_URLS,
      ...options.iconUrls,
    };

    this.root = new Container();
    this.root.sortableChildren = true;
    setNodeLabel(this.root, `renderer#${this.rendererId}:root`);

    this.tileLayer = new Container();
    this.entityLayer = new Container();
    this.tileLayer.zIndex = 0;
    this.entityLayer.zIndex = 1;
    setNodeLabel(this.tileLayer, `renderer#${this.rendererId}:tile-layer`);
    setNodeLabel(this.entityLayer, `renderer#${this.rendererId}:entity-layer`);
    this.root.addChild(this.tileLayer);
    this.root.addChild(this.entityLayer);

    this.backgroundLayer = new Container();
    this.backgroundLayer.zIndex = 0;
    setNodeLabel(this.backgroundLayer, `renderer#${this.rendererId}:background-layer`);
    this.root.zIndex = 1;

    this.app.stage.sortableChildren = true;
    setNodeLabel(this.app.stage, `renderer#${this.rendererId}:stage`);
    this.app.stage.addChild(this.backgroundLayer);
    this.app.stage.addChild(this.root);

    const background = new PixiGridBackground(
      this.app.renderer,
      this.backgroundLayer,
      `renderer#${this.rendererId}:background`
    );
    this.view = new PixiViewController(
      this.app.renderer,
      this.root,
      background,
      options.tileSize ?? DEFAULT_TILE_SIZE
    );

    this.stream = new RenderStreamController();

    this.displayState = {
      displayIndex: new Map<number, Sprite>(),
      displayKinds: new Map(),
    };
  }

  /**
   * Updates tile size and redraws immediately.
   *
   * @param tileSize `number` next tile side length in pixels.
   */
  setTileSize(tileSize: number): void {
    this.clearDisplayState();
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
    this.clearDisplayState();

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
    this.view.setViewCenter(worldX, worldY);

    // Static stories call camera updates independently from stream packets.
    this.render();
  }

  /**
   * Reapplies the last requested center.
   */
  recenter(): void {
    this.view.recenter();
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
    this.render();
  }

  /**
   * Runs one full render pass for the current render world.
   */
  render(): void {
    this.view.updateBackground();
    runRenderPass(
      this.app.renderer,
      this.stream.getWorldState(),
      this.assets,
      this.view.getTileSize(),
      this.tileLayer,
      this.entityLayer,
      this.displayState,
      `renderer#${this.rendererId}`
    );

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
    this.clearDisplayState();
    this.view.destroy();
    this.root.removeFromParent();
    this.backgroundLayer.removeFromParent();
    this.root.destroy({ children: true });
    this.backgroundLayer.destroy({ children: true });
  }

  /**
   * Destroys all tracked display objects and clears render-layer children.
   */
  private clearDisplayState(): void {
    for (const sprite of this.displayState.displayIndex.values()) {
      sprite.removeFromParent();
      sprite.destroy();
    }
    this.displayState.displayIndex.clear();
    this.displayState.displayKinds.clear();
    this.tileLayer.removeChildren();
    this.entityLayer.removeChildren();
  }
}

export type { PixiRendererOptions } from './pixi/types';
