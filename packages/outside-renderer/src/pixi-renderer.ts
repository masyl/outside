import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Text,
  TextStyle,
  Sprite,
  TilingSprite,
  Texture,
} from 'pixi.js';
import { Position, VisualSize, Size } from '@outside/simulator';
import { hasComponent, query } from 'bitecs';
import { DEFAULT_TILE_SIZE, SPRITE_SIZE } from './constants';
import { DEFAULT_ICON_URLS } from './icons';
import {
  applyRenderStream,
  createRenderWorld,
  type RenderStreamPacket,
  type RenderWorldState,
} from './render-world';
import { getFacingDirection, getIsMoving, getWalkFrame, runAnimationTic } from './animation';
import { classifyRenderKind, type RenderKind } from './render-classify';

export interface PixiRendererOptions {
  tileSize?: number;
  assetBaseUrl?: string;
  iconUrls?: Partial<typeof DEFAULT_ICON_URLS>;
  debugEnabled?: boolean;
}


interface RendererAssets {
  botIdle?: Texture;
  botWalk?: Texture;
  icons: {
    bot?: Texture;
    hero?: Texture;
    food?: Texture;
  };
  placeholders: {
    bot?: Texture;
    hero?: Texture;
    food?: Texture;
    error?: Texture;
  };
}

export class PixiEcsRenderer {
  private app: Application;
  private root: Container;
  private tileLayer: Container;
  private entityLayer: Container;
  private backgroundLayer: Container;
  private background?: TilingSprite;
  private gridTexture?: Texture;
  private gridTileSize = 0;
  private renderWorld: RenderWorldState;
  private displayIndex = new Map<number, Sprite>();
  private displayKinds = new Map<number, RenderKind>();
  private assets: RendererAssets = { icons: {}, placeholders: {} };
  private tileSize: number;
  private assetBaseUrl: string;
  private iconUrls: typeof DEFAULT_ICON_URLS;
  private debugLabel?: Text;
  private debugMarker?: Graphics;
  private debugEnabled: boolean;
  private assetsReady: Promise<void> | null = null;
  private assetsLoaded: boolean = false;
  private lastCenter: { x: number; y: number } | null = null;

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
    this.root.roundPixels = true;
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
    this.app.stage.roundPixels = true;
    this.setDebugEnabled(this.debugEnabled);
    this.updateBackground();

    this.renderWorld = createRenderWorld();
  }

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
    } else {
      this.debugMarker?.destroy();
      this.debugMarker = undefined;
      this.debugLabel?.destroy();
      this.debugLabel = undefined;
    }
  }

  setTileSize(tileSize: number): void {
    this.tileSize = tileSize;
    this.updateBackground();
    this.recenter();
    this.render();
  }

  async loadAssets(): Promise<void> {
    if (this.assetsReady) return this.assetsReady;
    try {
      const idleUrl = `${this.assetBaseUrl}/eris-esra-character-template-4/16x16/16x16 Idle-Sheet.png`;
      const walkUrl = `${this.assetBaseUrl}/eris-esra-character-template-4/16x16/16x16 Walk-Sheet.png`;
      this.assetsReady = (async () => {
        this.assets.botIdle = await Assets.load(idleUrl);
        this.assets.botWalk = await Assets.load(walkUrl);
        this.assets.icons.bot = await Assets.load(this.iconUrls.bot);
        this.assets.icons.hero = await Assets.load(this.iconUrls.hero);
        this.assets.icons.food = await Assets.load(this.iconUrls.food);
        this.setNearestScale(this.assets.botIdle);
        this.setNearestScale(this.assets.botWalk);
        this.setNearestScale(this.assets.icons.bot);
        this.setNearestScale(this.assets.icons.hero);
        this.setNearestScale(this.assets.icons.food);
        this.assetsLoaded = true;
        this.render();
      })();
      await this.assetsReady;
    } catch (error) {
      console.error('[PixiEcsRenderer] Failed to load assets:', error);
    }
  }

  applyStream(packet: RenderStreamPacket): void {
    applyRenderStream(this.renderWorld, packet);
    runAnimationTic(this.renderWorld);
    this.render();
  }

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

  getAssetsReady(): Promise<void> | null {
    return this.assetsReady;
  }

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
    // Static stories rely on explicit renders; re-render immediately after camera move.
    this.render();
  }

  recenter(): void {
    if (!this.lastCenter) return;
    this.setViewCenter(this.lastCenter.x, this.lastCenter.y);
  }

  setViewportSize(width: number, height: number): void {
    this.updateBackground(width, height);
    this.recenter();
  }

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
      if (sprite && previousKind && previousKind !== kind) {
        sprite.destroy();
        this.displayIndex.delete(eid);
        this.displayKinds.delete(eid);
        sprite = undefined;
      }

      if (!sprite) {
        sprite = this.createSpriteForKind(kind);
        this.displayIndex.set(eid, sprite);
        this.displayKinds.set(eid, kind);
        if (kind === 'floor' || kind === 'wall') {
          this.tileLayer.addChild(sprite);
        } else {
          this.entityLayer.addChild(sprite);
        }
      }

      this.updateSpriteForEntity(sprite, kind, eid);
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

  destroy(): void {
    for (const sprite of this.displayIndex.values()) {
      sprite.destroy();
    }
    this.displayIndex.clear();
    this.displayKinds.clear();
    this.root.destroy({ children: true });
  }

  private createSpriteForKind(kind: RenderKind): Sprite {
    switch (kind) {
      case 'floor':
      case 'wall': {
        const sprite = new Sprite(Texture.WHITE);
        sprite.roundPixels = true;
        sprite.zIndex = kind === 'wall' ? 1 : 0;
        return sprite;
      }
      case 'food': {
        const texture =
          this.assets.icons.food ??
          this.assets.placeholders.food ??
          this.createPlaceholderTexture('food');
        const sprite = new Sprite(texture);
        sprite.roundPixels = true;
        sprite.zIndex = 3;
        return sprite;
      }
      case 'hero': {
        const texture =
          this.assets.botIdle ??
          this.assets.icons.bot ??
          this.assets.placeholders.bot ??
          this.createPlaceholderTexture('bot');
        const sprite = new Sprite(texture);
        sprite.roundPixels = true;
        sprite.zIndex = 4;
        return sprite;
      }
      case 'bot':
      case 'error':
      default: {
        const texture =
          kind === 'error'
            ? this.assets.placeholders.error ?? this.createPlaceholderTexture('error')
            : this.assets.botIdle ??
              this.assets.icons.bot ??
              this.assets.placeholders.bot ??
              this.createPlaceholderTexture('bot');
        const sprite = new Sprite(texture);
        sprite.roundPixels = true;
        sprite.zIndex = kind === 'error' ? 5 : 3;
        return sprite;
      }
    }
  }

  private updateSpriteForEntity(sprite: Sprite, kind: RenderKind, eid: number): void {
    const world = this.renderWorld.world;
    const tileSize = this.tileSize;

    const diameter = this.getEntityDiameter(world, eid, kind);
    const posX = Position.x[eid];
    const posY = Position.y[eid];
    const topLeft = kind === 'floor' || kind === 'wall'
      ? { x: posX * tileSize, y: posY * tileSize }
      : { x: (posX - diameter / 2) * tileSize, y: (posY - diameter / 2) * tileSize };

    if (kind === 'floor' || kind === 'wall') {
      sprite.x = topLeft.x;
      sprite.y = topLeft.y;
      sprite.width = tileSize;
      sprite.height = tileSize;
      sprite.tint = kind === 'wall' ? 0x2f2f2f : 0x4b4b4b;
      return;
    }

    if (kind === 'food' && this.assets.icons.food && sprite.texture !== this.assets.icons.food) {
      sprite.texture = this.assets.icons.food;
      this.setNearestScale(sprite.texture);
    }
    if (kind === 'bot' && this.assets.botIdle && sprite.texture !== this.assets.botIdle) {
      sprite.texture = this.assets.botIdle;
      this.setNearestScale(sprite.texture);
    }

    sprite.x = topLeft.x;
    sprite.y = topLeft.y;

    if ((kind === 'bot' || kind === 'hero') && this.assets.botIdle && this.assets.botWalk) {
      const facing = getFacingDirection(this.renderWorld, eid);
      const frame = getWalkFrame(this.renderWorld, eid);
      const isMoving = getIsMoving(this.renderWorld, eid);
      this.updateBotSpriteFrame(sprite, facing, isMoving, frame, diameter);
      return;
    }

    const size = kind === 'error' ? tileSize : tileSize * diameter;
    sprite.width = size;
    sprite.height = size;
  }

  private updateBotSpriteFrame(
    sprite: Sprite,
    direction: 'up' | 'down' | 'left' | 'right',
    isMoving: boolean,
    frameIndex: number,
    diameter: number
  ): void {
    if (!this.assets.botIdle || !this.assets.botWalk) return;

    const source = isMoving ? this.assets.botWalk : this.assets.botIdle;

    let row = 0;
    let flipX = false;

    switch (direction) {
      case 'down':
        row = 0;
        break;
      case 'left':
        row = 2;
        flipX = true;
        break;
      case 'right':
        row = 2;
        break;
      case 'up':
        row = 4;
        break;
    }

    const padding = 2;
    const stride = SPRITE_SIZE + padding * 2;
    const frameX = frameIndex * stride + padding;
    const frameY = row * stride + padding + 2;

    sprite.texture = new Texture({
      source: source.source,
      frame: new Rectangle(frameX, frameY, SPRITE_SIZE, SPRITE_SIZE),
    });
    this.setNearestScale(sprite.texture);

    const baseScale = (this.tileSize / SPRITE_SIZE) * diameter;
    sprite.anchor.set(0, 0);
    if (flipX) {
      sprite.scale.x = -baseScale;
      sprite.pivot.x = SPRITE_SIZE;
    } else {
      sprite.scale.x = baseScale;
      sprite.pivot.x = 0;
    }
    sprite.scale.y = baseScale;
    sprite.pivot.y = 0;
  }

  private getEntityDiameter(world: RenderWorldState['world'], eid: number, kind: RenderKind): number {
    if (kind === 'floor' || kind === 'wall') return 1;
    if (hasComponent(world, eid, VisualSize)) {
      return VisualSize.diameter[eid] ?? 1;
    }
    if (hasComponent(world, eid, Size)) {
      return Size.diameter[eid] ?? 1;
    }
    return 1;
  }

  private setNearestScale(texture?: Texture): void {
    if (!texture) return;
    if ((texture.source as any)?.scaleMode !== undefined) {
      (texture.source as any).scaleMode = 'nearest';
    }
  }

  private createPlaceholderTexture(kind: 'bot' | 'hero' | 'food' | 'error'): Texture {
    const cached = this.assets.placeholders[kind];
    if (cached) return cached;
    const color =
      kind === 'bot'
        ? 0x4aa8ff
        : kind === 'hero'
          ? 0xffd166
          : kind === 'food'
            ? 0xff3b30
            : 0xd40000;
    const g = new Graphics();
    const size = 16;
    const inset = 2;
    if (kind === 'food') {
      g.rect(inset, inset, size - inset * 2, size - inset * 2)
        .fill(color)
        .stroke({ color: 0x5b0b0b, width: 2 });
    } else if (kind === 'error') {
      g.rect(0, 0, size, size).fill(0x160000);
      g.moveTo(2, 2).lineTo(size - 2, size - 2).stroke({ color, width: 3 });
      g.moveTo(size - 2, 2).lineTo(2, size - 2).stroke({ color, width: 3 });
    } else {
      g.circle(size / 2, size / 2, size / 2 - 1)
        .fill(color)
        .stroke({ color: 0x0b0d12, width: 2 });
    }
    const texture = this.app.renderer.generateTexture(g, {
      resolution: 1,
      region: undefined,
      antialias: false,
    });
    this.setNearestScale(texture);
    this.assets.placeholders[kind] = texture;
    return texture;
  }

  private updateBackground(width?: number, height?: number): void {
    const nextWidth = width ?? this.app.renderer.width;
    const nextHeight = height ?? this.app.renderer.height;

    if (!this.gridTexture || this.gridTileSize !== this.tileSize) {
      if (this.gridTexture) {
        this.gridTexture.destroy(true);
      }
      this.gridTexture = this.createGridTexture(this.tileSize);
      this.gridTileSize = this.tileSize;
      if (this.background) {
        this.background.texture = this.gridTexture;
      }
    }

    if (!this.background && this.gridTexture) {
      this.background = new TilingSprite({
        texture: this.gridTexture,
        width: nextWidth,
        height: nextHeight,
      });
      this.background.zIndex = 0;
      this.backgroundLayer.addChild(this.background);
    }

    if (this.background) {
      this.background.width = nextWidth;
      this.background.height = nextHeight;
    }
  }

  private createGridTexture(tileSize: number): Texture {
    const base = 0x0b0d12;
    const line = 0x151a21;
    const g = new Graphics();
    g.rect(0, 0, tileSize, tileSize).fill(base);
    g.moveTo(0, 0).lineTo(tileSize, 0).stroke({ color: line, width: 1 });
    g.moveTo(0, 0).lineTo(0, tileSize).stroke({ color: line, width: 1 });
    const texture = this.app.renderer.generateTexture(g, {
      resolution: 1,
      region: undefined,
      antialias: false,
    });
    this.setNearestScale(texture);
    return texture;
  }

}
