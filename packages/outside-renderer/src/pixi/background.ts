import { Graphics, TilingSprite, type Container, type Renderer, type Texture } from 'pixi.js';
import { setNearestScale } from './assets';

/**
 * Owns the tiled background grid so renderer logic stays focused on entities.
 */
export class PixiGridBackground {
  private background?: TilingSprite;
  private gridTexture?: Texture;
  private gridTileSize = 0;

  constructor(
    private readonly renderer: Renderer,
    private readonly layer: Container
  ) {}

  /**
   * Rebuilds grid texture when tile size changes and resizes the full-screen tiling sprite.
   */
  update(tileSize: number, width: number, height: number): void {
    if (!this.gridTexture || this.gridTileSize !== tileSize) {
      if (this.gridTexture) {
        this.gridTexture.destroy(true);
      }
      this.gridTexture = this.createGridTexture(tileSize);
      this.gridTileSize = tileSize;
      if (this.background) {
        this.background.texture = this.gridTexture;
      }
    }

    if (!this.background && this.gridTexture) {
      this.background = new TilingSprite({
        texture: this.gridTexture,
        width,
        height,
      });
      this.background.zIndex = 0;
      this.layer.addChild(this.background);
    }

    if (this.background) {
      this.background.width = width;
      this.background.height = height;
    }
  }

  /**
   * Destroys owned Pixi resources.
   */
  destroy(): void {
    this.background?.destroy();
    this.background = undefined;
    this.gridTexture?.destroy(true);
    this.gridTexture = undefined;
    this.gridTileSize = 0;
  }

  private createGridTexture(tileSize: number): Texture {
    const base = 0x0b0d12;
    const line = 0x151a21;
    const g = new Graphics();
    g.rect(0, 0, tileSize, tileSize).fill(base);
    g.moveTo(0, 0).lineTo(tileSize, 0).stroke({ color: line, width: 1 });
    g.moveTo(0, 0).lineTo(0, tileSize).stroke({ color: line, width: 1 });
    const texture = this.renderer.generateTexture(g, {
      resolution: 1,
      region: undefined,
      antialias: false,
    });
    setNearestScale(texture);
    return texture;
  }
}
