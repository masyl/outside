import { Assets, Graphics, type Renderer, type Texture } from 'pixi.js';
import type { RendererAssets, PlaceholderKind } from './types';

/**
 * Creates an empty asset bundle.
 */
export function createRendererAssets(): RendererAssets {
  return {
    icons: {},
    placeholders: {},
  };
}

/**
 * Forces nearest-neighbor scaling for pixel-art crispness.
 */
export function setNearestScale(texture?: Texture): void {
  if (!texture) return;
  if ((texture.source as any)?.scaleMode !== undefined) {
    (texture.source as any).scaleMode = 'nearest';
  }
}

/**
 * Loads spritesheets/icons into the provided asset bundle.
 */
export async function loadRendererAssets(
  assets: RendererAssets,
  options: {
    assetBaseUrl: string;
    iconUrls: { bot: string; hero: string; food: string };
    onLoaded?: () => void;
  }
): Promise<void> {
  const idleUrl = `${options.assetBaseUrl}/eris-esra-character-template-4/16x16/16x16 Idle-Sheet.png`;
  const walkUrl = `${options.assetBaseUrl}/eris-esra-character-template-4/16x16/16x16 Walk-Sheet.png`;

  assets.botIdle = await Assets.load(idleUrl);
  assets.botWalk = await Assets.load(walkUrl);
  assets.icons.bot = await Assets.load(options.iconUrls.bot);
  assets.icons.hero = await Assets.load(options.iconUrls.hero);
  assets.icons.food = await Assets.load(options.iconUrls.food);

  setNearestScale(assets.botIdle);
  setNearestScale(assets.botWalk);
  setNearestScale(assets.icons.bot);
  setNearestScale(assets.icons.hero);
  setNearestScale(assets.icons.food);

  options.onLoaded?.();
}

/**
 * Returns a cached placeholder texture; creates it on first request.
 */
export function getPlaceholderTexture(
  renderer: Renderer,
  assets: RendererAssets,
  kind: PlaceholderKind
): Texture {
  const cached = assets.placeholders[kind];
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

  const texture = renderer.generateTexture(g, {
    resolution: 1,
    region: undefined,
    antialias: false,
  });
  setNearestScale(texture);
  assets.placeholders[kind] = texture;
  return texture;
}
