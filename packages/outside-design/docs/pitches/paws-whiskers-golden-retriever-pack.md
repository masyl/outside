---
Title: Paws & Whiskers Golden Retriever Actor Variant Pack
Category: Rendering
Summary: Add a Golden Retriever actor variant pack and map bot/hero variant sprite keys to the new animation sheet.
---

# Paws & Whiskers Golden Retriever Actor Variant Pack

## Motivation

We now have food-themed resource packs and need the same content pipeline for actor skins. The Golden Retriever sheet should be available as a reusable bot/hero variant that can be selected through stream sprite keys without changing simulation behavior.

## Solution

Create a second resource pack in `@outside/resource-packs` for `Paws & Whiskers - Isometric Dogs Pack (Free)` (Golden Retriever), including metadata and licensing files. Extend Pixi actor texture resolution to support actor variant sprite keys for bots and heroes using pack-defined animation layout.

## Inclusions

- New Golden Retriever pack files and metadata in `@outside/resource-packs`.
- Pack exports for variant sprite keys and animation-layout metadata.
- Pixi renderer support for `actor.bot.*` and `actor.hero.*` variant keys.
- Story wiring to demonstrate Golden Retriever variant usage for bot and hero.

## Exclusions

- Changes to simulation systems.
- Runtime UI for switching all actor themes.
- Additional dog breeds or packs in this delivery.

## Pre-requisites

- Existing variant sprite key pipeline (`DefaultSpriteKey` / `VariantSpriteKey`).
- Existing resource pack package infrastructure.

## Open Questions

- Should actor-variant selection be exposed as a Storybook control in a follow-up?

## Next Logical Pitches

- Multi-breed actor pack registry.
- Runtime actor-skin selector wired to entity prefab options.
- Unified validation CLI for all resource pack manifests and sheets.
