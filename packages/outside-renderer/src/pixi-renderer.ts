import { Application, Container, Graphics, Text, TextStyle, type Sprite } from 'pixi.js';
import { Position } from '@outside/simulator';
import { query } from 'bitecs';
import { DEFAULT_TILE_SIZE } from './constants';
import { DEFAULT_ICON_URLS } from './icons';
import {
  applyRenderStream,
  createRenderWorld,
  type RenderStreamPacket,
  type RenderWorldState,
} from './render-world';
import { runAnimationTic } from './animation';
import { classifyRenderKind, type RenderKind } from './render-classify';
import { PixiGridBackground } from './pixi/background';
import { createRendererAssets, loadRendererAssets } from './pixi/assets';
import { createSpriteForKind, updateSpriteForEntity } from './pixi/sprite-render';
import type { PixiRendererOptions } from './pixi/types';

/**
 * Pixi renderer that consumes serialized simulator deltas/snapshots and renders a read-only view.
 */
export class PixiEcsRenderer {
  private readonly app: Application;
  private readonly root: Container;
  private readonly tileLayer: Container;
  private readonly entityLayer: Container;
  private readonly backgroundLayer: Container;
  private readonly background: PixiGridBackground;
  private renderWorld: RenderWorldState;

  private readonly displayIndex = new Map<number, Sprite>();
  private readonly displayKinds = new Map<number, RenderKind>();
  private readonly assets = createRendererAssets();

  private tileSize: number;
  private assetBaseUrl: string;
  private iconUrls: typeof DEFAULT_ICON_URLS;
  private debugEnabled: boolean;
  private debugLabel?: Text;
  private debugMarker?: Graphics;
  private assetsReady: Promise<void> | null = null;
  private lastCenter: { x: number; y: number } | null = null;

  /**
   * Creates a renderer bound to a Pixi app.
   */
  constructor(app: Application, options: PixiRendererOptions = {}) {
    this.app = app;
    this.tileSize = options.tileSize ?? DEFAULT_TILE_SIZE;
    this.assetBaseUrl = options.assetBaseUrl ?? '/sprites';
    this.debugEnabled = options.debugEnabled ?? false;
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

    this.backgroundLayer = new Container();
    this.backgroundLayer.zIndex = 0;
    this.root.zIndex = 1;

    this.app.stage.sortableChildren = true;
    this.app.stage.addChild(this.backgroundLayer);
    this.app.stage.addChild(this.root);

    this.background = new PixiGridBackground(this.app.renderer, this.backgroundLayer);
    this.updateBackground();
    this.renderWorld = createRenderWorld();
    this.setDebugEnabled(this.debugEnabled);
  }

  /**
   * Enables or disables on-canvas debug diagnostics.
   */
  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;

    if (enabled) {
      if (!this.debugMarker) {
        this.debugMarker = new Graphics();
        this.debugMarker.rect(10, 10, 120, 80).fill(0xff00ff);
        this.debugMarker.zIndex = 9999;
        this.app.stage.addChild(this.debugMarker);
      }
      if (!this.debugLabel) {
        this.debugLabel = new Text({
          text: 'renderer init',
          style: new TextStyle({
            fill: 0xffcc00,
            fontFamily: 'monospace',
            fontSize: 12,
            stroke: { color: 0x000000, width: 2 },
          }),
        });
        this.debugLabel.x = 10;
        this.debugLabel.y = 100;
        this.debugLabel.zIndex = 9999;
        this.app.stage.addChild(this.debugLabel);
      }
      return;
    }

    this.debugMarker?.destroy();
    this.debugMarker = undefined;
    this.debugLabel?.destroy();
    this.debugLabel = undefined;
  }

  /**
   * Updates tile size and redraws immediately.
   */
  setTileSize(tileSize: number): void {
    this.tileSize = tileSize;
    this.updateBackground();
    this.recenter();
    this.render();
  }

  /**
   * Loads textures asynchronously. Rendering starts immediately using placeholders.
   */
  async loadAssets(): Promise<void> {
    if (this.assetsReady) return this.assetsReady;

    this.assetsReady = loadRendererAssets(this.assets, {
      assetBaseUrl: this.assetBaseUrl,
      iconUrls: this.iconUrls,
      // Re-render to swap placeholder sprites to loaded textures.
      onLoaded: () => this.render(),
    }).catch((error) => {
      console.error('[PixiEcsRenderer] Failed to load assets:', error);
    });

    await this.assetsReady;
  }

  /**
   * Applies a render-stream packet and redraws once.
   */
  applyStream(packet: RenderStreamPacket): void {
    applyRenderStream(this.renderWorld, packet);
    runAnimationTic(this.renderWorld);
    this.render();
  }

  /**
   * Clears display objects and resets the render world.
   */
  resetWorld(): void {
    for (const sprite of this.displayIndex.values()) {
      sprite.destroy();
    }
    this.displayIndex.clear();
    this.displayKinds.clear();
    this.tileLayer.removeChildren();
    this.entityLayer.removeChildren();

    this.renderWorld = createRenderWorld();
    this.render();
  }

  /**
   * Returns the in-flight asset load promise.
   */
  getAssetsReady(): Promise<void> | null {
    return this.assetsReady;
  }

  /**
   * Places the world coordinate at the screen center.
   */
  setViewCenter(worldX: number, worldY: number): void {
    this.lastCenter = { x: worldX, y: worldY };

    const screenWidth = this.app.renderer.width;
    const screenHeight = this.app.renderer.height;
    this.root.x = screenWidth / 2 - worldX * this.tileSize;
    this.root.y = screenHeight / 2 - worldY * this.tileSize;

    if (this.debugLabel) {
      this.debugLabel.text =
        `center=(${worldX.toFixed(2)}, ${worldY.toFixed(2)}) ` +
        `screen=(${screenWidth}x${screenHeight}) ` +
        `root=(${this.root.x.toFixed(1)}, ${this.root.y.toFixed(1)})`;
    }
    if (this.debugEnabled) {
      console.log('[PixiEcsRenderer] view center', { worldX, worldY, screenWidth, screenHeight });
      console.log('[PixiEcsRenderer] root position', { x: this.root.x, y: this.root.y });
    }

    // Static stories call camera updates independently from stream packets.
    this.render();
  }

  /**
   * Reapplies the previous center after viewport/tile size changes.
   */
  recenter(): void {
    if (!this.lastCenter) return;
    this.setViewCenter(this.lastCenter.x, this.lastCenter.y);
  }

  /**
   * Resizes background and reapplies camera center.
   */
  setViewportSize(width: number, height: number): void {
    this.updateBackground(width, height);
    this.recenter();
  }

  /**
   * Runs one full render pass for current render-world state.
   */
  render(): void {
    this.updateBackground();

    const world = this.renderWorld.world;
    const entities = query(world, [Position]);
    const nextIds = new Set<number>();

    if (this.debugEnabled) {
      console.log('[PixiEcsRenderer] render entities=', entities.length);
    }

    let floorCount = 0;
    let wallCount = 0;
    let heroCount = 0;
    let foodCount = 0;
    let botCount = 0;
    let errorCount = 0;

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const kind = classifyRenderKind(world, eid);
      if (!kind) continue;
      nextIds.add(eid);

      switch (kind) {
        case 'floor':
          floorCount += 1;
          break;
        case 'wall':
          wallCount += 1;
          break;
        case 'hero':
          heroCount += 1;
          break;
        case 'food':
          foodCount += 1;
          break;
        case 'bot':
          botCount += 1;
          break;
        case 'error':
          errorCount += 1;
          break;
        default:
          botCount += 1;
          break;
      }

      let sprite = this.displayIndex.get(eid);
      const previousKind = this.displayKinds.get(eid);

      // Recreate sprite only when layer/type changes.
      if (sprite && previousKind && previousKind !== kind) {
        sprite.destroy();
        this.displayIndex.delete(eid);
        this.displayKinds.delete(eid);
        sprite = undefined;
      }

      if (!sprite) {
        sprite = createSpriteForKind(this.app.renderer, this.assets, kind);
        this.displayIndex.set(eid, sprite);
        this.displayKinds.set(eid, kind);
        if (kind === 'floor' || kind === 'wall') {
          this.tileLayer.addChild(sprite);
        } else {
          this.entityLayer.addChild(sprite);
        }
      }

      updateSpriteForEntity(
        this.app.renderer,
        sprite,
        kind,
        eid,
        this.tileSize,
        this.renderWorld,
        this.assets
      );
    }

    for (const [eid, sprite] of this.displayIndex.entries()) {
      if (nextIds.has(eid)) continue;
      sprite.destroy();
      this.displayIndex.delete(eid);
      this.displayKinds.delete(eid);
    }

    if (this.debugLabel) {
      this.debugLabel.text =
        `entities=${entities.length} displays=${this.displayIndex.size} ` +
        `tiles=${this.tileLayer.children.length} ents=${this.entityLayer.children.length} ` +
        `floor=${floorCount} wall=${wallCount} hero=${heroCount} food=${foodCount} bot=${botCount} error=${errorCount} ` +
        `root=(${this.root.x.toFixed(1)}, ${this.root.y.toFixed(1)})`;
    }

    if (this.debugEnabled) {
      console.log(
        '[PixiEcsRenderer] displayIndex=',
        this.displayIndex.size,
        'tileLayer=',
        this.tileLayer.children.length,
        'entityLayer=',
        this.entityLayer.children.length
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
   * Destroys all renderer-owned display objects and textures.
   */
  destroy(): void {
    for (const sprite of this.displayIndex.values()) {
      sprite.destroy();
    }
    this.displayIndex.clear();
    this.displayKinds.clear();
    this.background.destroy();
    this.root.destroy({ children: true });
  }

  private updateBackground(width?: number, height?: number): void {
    const nextWidth = width ?? this.app.renderer.width;
    const nextHeight = height ?? this.app.renderer.height;
    this.background.update(this.tileSize, nextWidth, nextHeight);
  }
}

export type { PixiRendererOptions } from './pixi/types';
