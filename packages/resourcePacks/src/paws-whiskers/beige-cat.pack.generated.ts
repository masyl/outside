export const beigeCatPack = {
  "id": "paws-whiskers-beige-cat",
  "name": "Paws & Whiskers Isometric Cats Pack (Free) - Beige Cat",
  "version": "1.0.0",
  "type": "actor-variant",
  "sheet": "beige-cat.spritesheet.png",
  "credits": {
    "creator": "Netherzapdos",
    "homepage": "https://netherzapdos.itch.io/paws-whiskers-isometric-cats-pack",
    "licenseName": "Paws & Whiskers Free Pack License",
    "creditRequired": false,
    "sourceDescription": "Paws & Whiskers - Isometric Cats Pack Free Version",
    "retrievedAt": "2026-02-08T00:00:00.000Z",
    "restrictions": [
      "Use allowed for non-commercial projects.",
      "Do not resell or redistribute assets, modified or unmodified.",
      "Do not use assets as basis for AI-generated content."
    ]
  },
  "actorVariant": {
    "variantId": "beige-cat",
    "displayName": "Beige Cat",
    "botSpriteKey": "actor.bot.beige-cat",
    "heroSpriteKey": "actor.hero.beige-cat",
    "animation": {
      "frameWidth": 16,
      "frameHeight": 16,
      "frameCount": 4,
      "directionCount": 8,
      "idleRow": 0,
      "walkRow": 1,
      "framePitchX": 32,
      "framePitchY": 31,
      "frameInsetX": 8,
      "frameInsetY": 9,
      "directionOrder": [
        "bottom",
        "bottom-left",
        "right",
        "top-right",
        "top",
        "top-left",
        "left",
        "bottom-right"
      ],
      "cardinalDirectionToGroup": {
        "down": 4,
        "right": 2,
        "up": 0,
        "left": 6
      }
    }
  },
  "notes": [
    "Source sheet copied from packages/resourcePacks/sources/paws-whiskers/cats.",
    "Frame layout extracted from source image dimensions and provided pack notes.",
    "This pack provides actor variant keys for bots and heroes."
  ]
} as const;

export default beigeCatPack;
