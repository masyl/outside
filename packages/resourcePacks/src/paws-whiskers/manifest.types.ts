export interface ActorVariantCardinalGroups {
  down: number;
  right: number;
  up: number;
  left: number;
}

export interface ActorVariantAnimationLayout {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  directionCount: number;
  idleRow: number;
  walkRow: number;
  framePitchX: number;
  framePitchY: number;
  frameInsetX: number;
  frameInsetY: number;
  directionOrder: readonly string[];
  cardinalDirectionToGroup: ActorVariantCardinalGroups;
}

export interface ActorVariantCredits {
  creator: string;
  homepage: string;
  licenseName: string;
  creditRequired: boolean;
  sourceDescription: string;
  retrievedAt: string;
  restrictions: readonly string[];
}

export interface ActorVariantManifest {
  id: string;
  name: string;
  version: string;
  type: 'actor-variant';
  sheet: string;
  credits: ActorVariantCredits;
  actorVariant: {
    variantId: string;
    displayName: string;
    botSpriteKey: string;
    heroSpriteKey: string;
    animation: ActorVariantAnimationLayout;
  };
  notes: readonly string[];
}
