export interface PointerPackFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PointerPackHotspot {
  x: number;
  y: number;
}

export interface PointerPackVariant {
  variantId: string;
  displayName: string;
  spriteKey: string;
  category: string;
  frame: PointerPackFrame;
  hotspot: PointerPackHotspot;
}

export interface PointerPackLayout {
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
}

export interface PointerPackCredits {
  creator: string;
  homepage: string;
  licenseName: string;
  creditRequired: boolean;
  sourceDescription: string;
  retrievedAt: string;
  restrictions: readonly string[];
}

export interface PointerPackManifest {
  id: string;
  name: string;
  version: string;
  type: 'pointer-pack';
  sheet: string;
  defaults: {
    baseVariantId: string;
    interactiveVariantId: string;
  };
  layout: PointerPackLayout;
  credits: PointerPackCredits;
  pointers: PointerPackVariant[];
  notes: readonly string[];
}
