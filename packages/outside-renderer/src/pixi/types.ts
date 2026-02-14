import type { Container, Texture } from 'pixi.js';
import type { ActorVariantAnimationLayout } from '@outside/resource-packs/paws-whiskers/meta';
import type { DungeonTileTransformFlags } from '@outside/resource-packs';
import type { DEFAULT_ICON_URLS } from '../icons';

/**
 * Configures renderer behavior and optional asset overrides.
 */
export interface PixiRendererOptions {
  /**
   * World tile size in screen pixels.
   */
  tileSize?: number;
  /**
   * Base path for spritesheet assets.
   */
  assetBaseUrl?: string;
  /**
   * Optional icon URL overrides.
   */
  iconUrls?: Partial<typeof DEFAULT_ICON_URLS>;
  /**
   * Enables CRT post-processing filter on the stage.
   */
  crtEffectEnabled?: boolean;
  /**
   * Render mode. `default` draws textured sprites; `minimap` draws snapped solid pixels.
   */
  renderMode?: 'default' | 'minimap';
  /**
   * Optional host container for this renderer root (defaults to `app.stage`).
   */
  stageContainer?: Container;
  /**
   * Enables background layer rendering (grid + fill). Defaults to true.
   */
  backgroundEnabled?: boolean;
  /**
   * Root alpha applied to the renderer scene.
   */
  alpha?: number;
  /**
   * In minimap mode, snaps rendered pixels to tile coordinates when true.
   */
  minimapSnapToGrid?: boolean;
}

/**
 * Small set of placeholder kinds used while assets load or when a mapping fails.
 */
export type PlaceholderKind = 'bot' | 'hero' | 'food' | 'error';

export interface ActorVariantSheet {
  texture: Texture;
  animation: ActorVariantAnimationLayout;
}

export interface TileTransform {
  reflectX: boolean;
  reflectY: boolean;
  rotationRad: number;
}

export interface TileTextureVariant {
  texture: Texture;
  spriteKey: string;
  transformFlags: DungeonTileTransformFlags;
  subVariants: TileTransform[];
}

export interface TileTextureVariantPool {
  base?: TileTextureVariant;
  variants: TileTextureVariant[];
}

/**
 * Runtime texture bundle used by sprite construction and updates.
 */
export interface RendererAssets {
  botIdle?: Texture;
  botWalk?: Texture;
  soccerBallSheet?: Texture;
  pointerCursor?: Texture;
  pointerCursorBySpriteKey: Map<string, Texture>;
  foodTextureBySpriteKey: Map<string, Texture>;
  uiTextureBySpriteKey: Map<string, Texture>;
  actorVariantSheetBySpriteKey: Map<string, ActorVariantSheet>;
  tileTextureByKind: {
    floor: TileTextureVariantPool;
    wall: TileTextureVariantPool;
  };
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
