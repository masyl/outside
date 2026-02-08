import pixelLandsDungeonsPackGenerated from './pixel-lands-dungeons.pack.generated';
import type {
  DungeonTilePackManifest,
  DungeonTileVariant,
} from './manifest.types';

/** Pixel Lands Dungeons tile pack manifest metadata. */
export const pixelLandsDungeonsPack =
  pixelLandsDungeonsPackGenerated as unknown as DungeonTilePackManifest;

/** Base sprite key for floor tiles. */
export const DEFAULT_FLOOR_TILE_SPRITE_KEY = 'tile.floor';

/** Base sprite key for wall tiles. */
export const DEFAULT_WALL_TILE_SPRITE_KEY = 'tile.wall';

/** Pack id exported for Storybook/read-only metadata controls. */
export const PIXEL_LANDS_DUNGEONS_PACK_ID = pixelLandsDungeonsPack.id;

/** Pack version exported for Storybook/read-only metadata controls. */
export const PIXEL_LANDS_DUNGEONS_PACK_VERSION = pixelLandsDungeonsPack.version;

/** Ordered floor tile variants from manifest metadata. */
export const floorTileVariants = pixelLandsDungeonsPack.tileVariants.filter(
  (variant): variant is DungeonTileVariant => variant.renderKind === 'floor'
);

/** Ordered wall tile variants from manifest metadata. */
export const wallTileVariants = pixelLandsDungeonsPack.tileVariants.filter(
  (variant): variant is DungeonTileVariant => variant.renderKind === 'wall'
);
