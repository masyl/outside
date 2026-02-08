import type { Texture } from 'pixi.js';
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
}

/**
 * Small set of placeholder kinds used while assets load or when a mapping fails.
 */
export type PlaceholderKind = 'bot' | 'hero' | 'food' | 'error';

/**
 * Runtime texture bundle used by sprite construction and updates.
 */
export interface RendererAssets {
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
