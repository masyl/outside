---
Title: Paws & Whiskers Beige Cat Actor Variant Pack
Category: Rendering
Summary: Add a Beige Cat actor variant resource pack and expose separate bot/dog/cat spawn controls in Pixi ECS stories.
---

# Paws & Whiskers Beige Cat Actor Variant Pack

## Motivation

The renderer already supports a Golden Retriever actor variant. We now need the same pipeline for the Beige Cat spritesheet from the matching Paws & Whiskers free pack so actor variants can be mixed in one scenario and validated quickly in Storybook.

## Solution

Extend the existing `@outside/resource-packs` Paws & Whiskers pipeline to generate and export a Beige Cat pack with the same animation metadata model as Golden Retriever. Wire Pixi asset loading to map Beige Cat sprite keys for bots and heroes, and update the Hero and Food story flow so bot populations are independently controllable for default bots, dogs, and cats.

## Inclusions

- Beige Cat source ingestion from `agent-collab/Paws & Whiskers - Isometric Cats Pack (Free)`.
- Generated pack artifacts (sheet copy, manifest JSON, generated TS metadata, license file).
- New exports for Beige Cat variant ids/sprite keys/animation layout.
- Pixi renderer asset mapping for `actor.bot.beige-cat` and `actor.hero.beige-cat`.
- Storybook controls:
  - `botCount` for default bots
  - `dogCount` for Golden Retriever bots
  - `catCount` for Beige Cat bots
- Shared stream options updates so changing `dogCount`/`catCount` deterministically resets and rebuilds scenario state.

## Exclusions

- Changes to bot/hero simulation behavior.
- Runtime UI skin selection inside game client.
- Additional cat breeds beyond Beige Cat.

## Pre-requisites

- Existing resource pack package and build scripts.
- Existing actor variant support path in renderer (`VariantSpriteKey` + actor animation layout).
- Existing Pixi ECS Storybook stories and spawn pipeline.

## Open Questions

- Should hero variant become a Storybook control (default hero, dog hero, cat hero) in a follow-up?

## Next Logical Pitches

- Unified actor variant registry with pack-level discovery metadata.
- Storybook control for explicit hero skin selection.
- Additional Paws & Whiskers variants and deterministic spawn mix presets.
