/**
 * Resource-pack manifest schema for Pixel Platter food atlas.
 */
export interface ResourcePackFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ResourcePackFoodVariant {
  variantId: string;
  displayName: string;
  spriteKey: string;
  frame: ResourcePackFrame;
  sourceFile: string;
}

export interface ResourcePackCredits {
  creator: string;
  homepage: string;
  license: string;
  creditRequired: boolean;
  sourceDescription: string;
  retrievedAt: string;
}

export interface ResourcePackManifest {
  id: string;
  name: string;
  version: string;
  type: 'food-icons';
  tileSize: number;
  padding: number;
  atlas: string;
  credits: ResourcePackCredits;
  foodVariants: readonly ResourcePackFoodVariant[];
  itemsFromHomepage: readonly string[];
  notes: readonly string[];
}
