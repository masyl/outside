/**
 * Resource-pack manifest schema for Pixel Lands dungeon floor/wall tiles.
 */
export interface DungeonTileFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type DungeonTileRenderKind = 'floor' | 'wall';

export interface DungeonTileTransformFlags {
  reflectX: boolean;
  reflectY: boolean;
  rotate90: boolean;
  rotate180: boolean;
  rotate270: boolean;
}

export interface DungeonTileVariant {
  variantId: string;
  displayName: string;
  spriteKey: string;
  renderKind: DungeonTileRenderKind;
  isBase: boolean;
  transform: DungeonTileTransformFlags;
  frame: DungeonTileFrame;
  sourceCell: {
    x: number;
    y: number;
  };
}

export interface DungeonTilePackCredits {
  creator: string;
  homepage: string;
  license: string;
  creditRequired: boolean;
  sourceDescription: string;
  retrievedAt: string;
}

export interface DungeonTilePackManifest {
  id: string;
  name: string;
  version: string;
  type: 'dungeon-tiles';
  tileSize: number;
  padding: number;
  atlas: string;
  credits: DungeonTilePackCredits;
  tileVariants: readonly DungeonTileVariant[];
  notes: readonly string[];
}
