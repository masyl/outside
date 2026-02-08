import pixelPlatterPackGenerated from './pixel-platter.pack.generated';
import type {
  ResourcePackManifest,
  ResourcePackFoodVariant,
} from './manifest.types';

/** Pixel Platter manifest metadata. */
export const pixelPlatterPack = pixelPlatterPackGenerated as unknown as ResourcePackManifest;

/** Food variant identifiers available in Pixel Platter. */
export const foodVariantIds = [
  'french-fries',
  'burger',
  'soda',
  'pizza-slice',
  'hotdog',
  'hotdog-mustard',
  'pumpkin-pie-slice',
  'macarons',
  'red-velvet-cake-slice',
  'tiramisu',
  'ice-cream-sandwich',
  'creme-brulee',
  'orange',
  'apple',
  'banana',
  'pear',
  'cherry',
  'lemon',
  'grapes',
  'strawberry',
  'raspberry',
  'kiwi',
] as const;

/** Canonical food variant id type. */
export type FoodVariantId = (typeof foodVariantIds)[number];

/** Default base sprite key for food entities. */
export const DEFAULT_FOOD_SPRITE_KEY = 'pickup.food';

/** Maps a food variant id to sprite key used in simulator stream. */
export function foodVariantToSpriteKey(variant: string): string {
  return `${DEFAULT_FOOD_SPRITE_KEY}.${variant}`;
}

/** Finds a food variant manifest entry by sprite key. */
export function findFoodVariantBySpriteKey(
  spriteKey: string
): ResourcePackFoodVariant | undefined {
  return pixelPlatterPack.foodVariants.find((variant) => variant.spriteKey === spriteKey);
}

/** Pack id exported for Storybook read-only controls. */
export const PIXEL_PLATTER_PACK_ID = pixelPlatterPack.id;

/** Pack version exported for Storybook read-only controls. */
export const PIXEL_PLATTER_PACK_VERSION = pixelPlatterPack.version;
