import { Application, Container, Graphics } from 'pixi.js';
import { PixiEcsRenderer, type RenderStreamPacket } from '@outside/renderer';

function setNodeLabel(node: { label?: string }, label: string): void {
  node.label = label;
}

export type MinimapShape = 'round' | 'square';
export type MinimapPlacement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface RendererManagerMinimapOptions {
  enabled?: boolean;
  shape?: MinimapShape;
  placement?: MinimapPlacement;
  zoomLevel?: number;
  opacity?: number;
  snapToGrid?: boolean;
  sizeRatio?: number;
  paddingXRatio?: number;
  paddingYRatio?: number;
}

const DEFAULT_MINIMAP_OPTIONS: Required<RendererManagerMinimapOptions> = {
  enabled: false,
  shape: 'round',
  placement: 'bottom-right',
  zoomLevel: 2,
  opacity: 0.5,
  snapToGrid: false,
  sizeRatio: 0.2,
  paddingXRatio: 0.025,
  paddingYRatio: 0.025,
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export interface RendererManagerOptions {
  tileSize: number;
  assetBaseUrl: string;
  minimap?: RendererManagerMinimapOptions;
}

export type StatusBarHit =
  | { kind: 'fullscreen' }
  | { kind: 'hero'; index: number };

/**
 * Composes primary, minimap, and status-bar renderer instances on a single Pixi application.
 */
export class RendererManager {
  private readonly app: Application;
  private readonly assetBaseUrl: string;
  private mainTileSize: number;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private center = { x: 0, y: 0 };

  private mainRenderer: PixiEcsRenderer;
  private minimapRenderer: PixiEcsRenderer | null = null;
  private minimapHost: Container | null = null;
  private minimapBackground: Graphics | null = null;
  private minimapMask: Graphics | null = null;
  private minimapViewportOutline: Graphics | null = null;
  private minimapConfig: Required<RendererManagerMinimapOptions>;

  private statusBarRenderer: PixiEcsRenderer | null = null;
  private statusBarHost: Container | null = null;
  private statusBarBackground: Graphics | null = null;
  private statusBarMask: Graphics | null = null;

  constructor(app: Application, options: RendererManagerOptions) {
    this.app = app;
    this.assetBaseUrl = options.assetBaseUrl;
    this.mainTileSize = options.tileSize;
    this.minimapConfig = this.normalizeMinimapOptions(options.minimap);

    this.mainRenderer = new PixiEcsRenderer(this.app, {
      tileSize: this.mainTileSize,
      assetBaseUrl: this.assetBaseUrl,
    });

    this.syncMinimapRenderer();
    this.syncStatusBarRenderer();
  }

  isBoundTo(app: Application): boolean {
    return this.app === app;
  }

  async loadAssets(): Promise<void> {
    await this.mainRenderer.loadAssets();
  }

  getAssetsReady(): Promise<void> | null {
    return this.mainRenderer.getAssetsReady();
  }

  applyStream(packet: RenderStreamPacket): void {
    this.mainRenderer.applyStream(packet);
    this.minimapRenderer?.applyStream(packet);
  }

  applyStatusBarStream(packet: RenderStreamPacket): void {
    this.statusBarRenderer?.applyStream(packet);
  }

  resetWorld(): void {
    this.mainRenderer.resetWorld();
    this.minimapRenderer?.resetWorld();
    this.statusBarRenderer?.resetWorld();
  }

  setTileSize(tileSize: number): void {
    this.mainTileSize = tileSize;
    this.mainRenderer.setTileSize(tileSize);
    if (this.minimapRenderer) {
      this.minimapRenderer.setTileSize(this.getMinimapTileSize());
      this.updateMinimapViewportOutline();
    }
    if (this.statusBarRenderer) {
      this.statusBarRenderer.setTileSize(tileSize);
      this.syncStatusBarLayout();
    }
  }

  setViewportSize(width: number, height: number): void {
    this.viewportWidth = Math.max(1, Math.floor(width));
    this.viewportHeight = Math.max(1, Math.floor(height));
    this.mainRenderer.setViewportSize(this.viewportWidth, this.viewportHeight);
    this.syncMinimapRendererLayout();
    this.syncStatusBarLayout();
  }

  setViewCenter(worldX: number, worldY: number): void {
    this.center = { x: worldX, y: worldY };
    this.mainRenderer.setViewCenter(worldX, worldY);
    this.minimapRenderer?.setViewCenter(worldX, worldY);
    this.updateMinimapViewportOutline();
  }

  setCrtEnabled(enabled: boolean): void {
    this.mainRenderer.setCrtEnabled(enabled);
  }

  setMinimapOptions(options: RendererManagerMinimapOptions): void {
    this.minimapConfig = this.normalizeMinimapOptions(options);
    this.syncMinimapRenderer();
  }

  destroy(): void {
    this.destroyStatusBarRenderer();
    this.destroyMinimapRenderer();
    this.mainRenderer.destroy();
  }

  private normalizeMinimapOptions(
    options: RendererManagerMinimapOptions | undefined
  ): Required<RendererManagerMinimapOptions> {
    const next = {
      ...DEFAULT_MINIMAP_OPTIONS,
      ...(options ?? {}),
    };
    return {
      enabled: next.enabled === true,
      shape: next.shape === 'square' ? 'square' : 'round',
      placement: next.placement ?? DEFAULT_MINIMAP_OPTIONS.placement,
      zoomLevel: clamp(next.zoomLevel, 2, 16),
      opacity: clamp(next.opacity, 0, 1),
      snapToGrid: next.snapToGrid === true,
      sizeRatio: clamp(next.sizeRatio, 0.08, 0.5),
      paddingXRatio: clamp(next.paddingXRatio, 0, 0.2),
      paddingYRatio: clamp(next.paddingYRatio, 0, 0.2),
    };
  }

  private getMinimapTileSize(): number {
    return Math.max(1, Math.round(this.minimapConfig.zoomLevel));
  }

  private getMinimapSizePx(): number {
    const fromHeight = Math.round(this.viewportHeight * this.minimapConfig.sizeRatio);
    const maxSize = Math.max(16, Math.min(this.viewportWidth, this.viewportHeight) - 2);
    return clamp(fromHeight, 16, maxSize);
  }

  private syncMinimapRenderer(): void {
    if (!this.minimapConfig.enabled) {
      this.destroyMinimapRenderer();
      return;
    }
    if (!this.minimapRenderer) {
      this.minimapHost = new Container();
      this.minimapHost.zIndex = 20;
      this.minimapHost.sortableChildren = true;
      this.minimapBackground = new Graphics();
      this.minimapBackground.zIndex = 0;
      setNodeLabel(this.minimapBackground, 'renderer-manager:minimap:background');
      this.minimapMask = new Graphics();
      this.minimapMask.zIndex = 100;
      this.minimapViewportOutline = new Graphics();
      this.minimapViewportOutline.zIndex = 101;
      this.minimapHost.addChild(this.minimapBackground);
      this.minimapHost.addChild(this.minimapMask);
      this.minimapHost.addChild(this.minimapViewportOutline);
      this.minimapHost.mask = this.minimapMask;
      this.app.stage.addChild(this.minimapHost);

      this.minimapRenderer = new PixiEcsRenderer(this.app, {
        tileSize: this.getMinimapTileSize(),
        renderMode: 'minimap',
        stageContainer: this.minimapHost,
        backgroundEnabled: false,
        alpha: 1,
        minimapSnapToGrid: this.minimapConfig.snapToGrid,
      });
    } else {
      this.minimapRenderer.setTileSize(this.getMinimapTileSize());
      this.minimapRenderer.setMinimapSnapToGrid(this.minimapConfig.snapToGrid);
    }
    this.syncMinimapRendererLayout();
  }

  handleMinimapClick(screenX: number, screenY: number): boolean {
    if (!this.minimapConfig.enabled || !this.minimapHost) return false;

    const sizePx = this.getMinimapSizePx();
    const localX = screenX - this.minimapHost.x;
    const localY = screenY - this.minimapHost.y;

    if (localX < 0 || localY < 0 || localX > sizePx || localY > sizePx) {
      return false;
    }

    if (this.minimapConfig.shape === 'round') {
      const radius = sizePx / 2;
      const dx = localX - radius;
      const dy = localY - radius;
      if (dx * dx + dy * dy > radius * radius) {
        return false;
      }
    }

    this.minimapConfig = {
      ...this.minimapConfig,
      placement: this.flipMinimapPlacementHorizontally(this.minimapConfig.placement),
    };
    this.syncMinimapRendererLayout();
    return true;
  }

  private flipMinimapPlacementHorizontally(placement: MinimapPlacement): MinimapPlacement {
    if (placement === 'top-left') return 'top-right';
    if (placement === 'top-right') return 'top-left';
    if (placement === 'bottom-left') return 'bottom-right';
    return 'bottom-left';
  }

  private syncMinimapRendererLayout(): void {
    if (!this.minimapRenderer || !this.minimapHost || !this.minimapMask) return;

    const sizePx = this.getMinimapSizePx();
    const paddingX = Math.round(this.viewportHeight * this.minimapConfig.paddingXRatio);
    const paddingY = Math.round(this.viewportHeight * this.minimapConfig.paddingYRatio);

    const x =
      this.minimapConfig.placement === 'top-right' || this.minimapConfig.placement === 'bottom-right'
        ? this.viewportWidth - sizePx - paddingX
        : paddingX;
    const y =
      this.minimapConfig.placement === 'bottom-left' || this.minimapConfig.placement === 'bottom-right'
        ? this.viewportHeight - sizePx - paddingY
        : paddingY;

    this.minimapHost.x = Math.round(Math.max(0, x));
    this.minimapHost.y = Math.round(Math.max(0, y));

    this.minimapBackground?.clear();
    this.minimapBackground?.rect(0, 0, sizePx, sizePx);
    this.minimapBackground?.fill({
      color: 0x000000,
      alpha: this.minimapConfig.opacity,
    });

    this.minimapMask.clear();
    if (this.minimapConfig.shape === 'round') {
      const radius = sizePx / 2;
      this.minimapMask.circle(radius, radius, radius);
    } else {
      this.minimapMask.rect(0, 0, sizePx, sizePx);
    }
    this.minimapMask.fill(0xffffff);

    this.minimapRenderer.setViewportSize(sizePx, sizePx);
    this.minimapRenderer.setViewCenter(this.center.x, this.center.y);
    this.updateMinimapViewportOutline();
  }

  private updateMinimapViewportOutline(): void {
    if (!this.minimapRenderer || !this.minimapViewportOutline) return;

    const sizePx = this.getMinimapSizePx();
    const minimapTileSize = Math.max(1, this.minimapRenderer.getTileSize());
    const mainTileSize = Math.max(1, this.mainTileSize);
    const viewportTilesWide = this.viewportWidth / mainTileSize;
    const viewportTilesHigh = this.viewportHeight / mainTileSize;
    const rectWidth = clamp(viewportTilesWide * minimapTileSize, 1, sizePx);
    const rectHeight = clamp(viewportTilesHigh * minimapTileSize, 1, sizePx);
    const rectX = (sizePx - rectWidth) / 2;
    const rectY = (sizePx - rectHeight) / 2;

    this.minimapViewportOutline.clear();
    this.drawDottedViewportOutline(this.minimapViewportOutline, rectX, rectY, rectWidth, rectHeight);
  }

  private drawDottedViewportOutline(
    graphics: Graphics,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const dotSpacing = 6;
    const dotRadius = 1.5;
    const color = 0xffffff;
    const alpha = 0.5;

    for (let px = x; px <= x + width; px += dotSpacing) {
      graphics.circle(px, y, dotRadius);
      graphics.fill({ color, alpha });
      graphics.circle(px, y + height, dotRadius);
      graphics.fill({ color, alpha });
    }

    for (let py = y; py <= y + height; py += dotSpacing) {
      graphics.circle(x, py, dotRadius);
      graphics.fill({ color, alpha });
      graphics.circle(x + width, py, dotRadius);
      graphics.fill({ color, alpha });
    }
  }

  private destroyMinimapRenderer(): void {
    this.minimapRenderer?.destroy();
    this.minimapRenderer = null;
    this.minimapHost?.removeFromParent();
    this.minimapHost?.destroy({ children: true });
    this.minimapHost = null;
    this.minimapBackground = null;
    this.minimapMask = null;
    this.minimapViewportOutline = null;
  }

  // ── Status Bar ──────────────────────────────────────────────────────────────

  /**
   * Returns the hit type if (screenX, screenY) lands within the status bar strip,
   * given the current number of hero slots. Returns null if the click is outside.
   */
  handleStatusBarClick(screenX: number, screenY: number, heroCount: number): StatusBarHit | null {
    if (!this.statusBarHost) return null;
    const tileSize = this.mainTileSize;
    // The status bar occupies the top tileSize pixels of the viewport.
    if (screenY < 0 || screenY >= tileSize) return null;
    if (screenX < 0 || screenX >= this.viewportWidth) return null;

    // Center is set so that world x=0 (fullscreen) is at the rightmost tile.
    const n = Math.floor(this.viewportWidth / tileSize);
    const centerX = 0.5 - n / 2;
    const worldX = centerX + (screenX - this.viewportWidth / 2) / tileSize;
    const tileHit = Math.round(worldX);

    if (tileHit === 0) return { kind: 'fullscreen' };
    if (tileHit >= -heroCount && tileHit <= -1) {
      return { kind: 'hero', index: -tileHit - 1 };
    }
    return null;
  }

  private syncStatusBarRenderer(): void {
    if (this.statusBarRenderer) return; // Already initialised.

    const host = new Container();
    host.zIndex = 30; // Above minimap (zIndex 20).
    host.sortableChildren = true;
    this.statusBarHost = host;

    const bg = new Graphics();
    bg.zIndex = 0;
    setNodeLabel(bg, 'renderer-manager:status-bar:background');
    this.statusBarBackground = bg;

    const mask = new Graphics();
    mask.zIndex = 100;
    this.statusBarMask = mask;

    host.addChild(bg);
    host.addChild(mask);
    host.mask = mask;
    this.app.stage.addChild(host);

    this.statusBarRenderer = new PixiEcsRenderer(this.app, {
      tileSize: this.mainTileSize,
      assetBaseUrl: this.assetBaseUrl,
      stageContainer: host,
      backgroundEnabled: false,
      alpha: 1,
    });

    this.syncStatusBarLayout();
  }

  private syncStatusBarLayout(): void {
    if (!this.statusBarRenderer || !this.statusBarHost || !this.statusBarMask) return;

    const tileSize = this.mainTileSize;
    const vpW = this.viewportWidth;
    const n = Math.floor(vpW / tileSize);

    // Position the host at the top-left of the viewport.
    this.statusBarHost.x = 0;
    this.statusBarHost.y = 0;

    // 50% opaque black background spanning the full width, 1 tile tall.
    this.statusBarBackground?.clear();
    this.statusBarBackground?.rect(0, 0, vpW, tileSize);
    this.statusBarBackground?.fill({ color: 0x000000, alpha: 0.5 });

    // Rectangular mask matching the background.
    this.statusBarMask.clear();
    this.statusBarMask.rect(0, 0, vpW, tileSize);
    this.statusBarMask.fill(0xffffff);

    // The renderer viewport is full-width, 1 tile tall.
    this.statusBarRenderer.setViewportSize(vpW, tileSize);

    // Center so world x=0 (fullscreen) sits at the rightmost tile.
    // centerX = 0.5 - n/2  →  world x=0 maps to screenX = vpW - tileSize/2.
    const centerX = 0.5 - n / 2;
    this.statusBarRenderer.setViewCenter(centerX, 0);
  }

  private destroyStatusBarRenderer(): void {
    this.statusBarRenderer?.destroy();
    this.statusBarRenderer = null;
    this.statusBarHost?.removeFromParent();
    this.statusBarHost?.destroy({ children: true });
    this.statusBarHost = null;
    this.statusBarBackground = null;
    this.statusBarMask = null;
  }
}
