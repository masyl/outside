---
Title: Pointer Zoo and Hover Delivery (Post-written)
Category: Rendering / Input
Summary: Retroactive pitch documenting pointer variant rendering, pointer zoo stories, hover overrides, and supporting inspector integration.
---

# Pointer Zoo and Hover Delivery (Post-written)

> This pitch was written after implementation to document an already-shipped commit set.

## Motivation

Pointer behavior and pointer-style experimentation were spread across multiple commits while working on other gameplay tasks. The work needed its own delivery package so its scope, rationale, and follow-ups are explicit.

## Solution

Document the pointer-focused implementation as its own coherent delivery, covering custom pointer variants, pointer zoo stories, pointer hover behavior, and the associated renderer/simulator/inspector integration work required to make those interactions visible and testable.

## Inclusions

- Pointer zoo stories and controls in Storybook.
- ECS-backed custom pointer rendering path.
- Pointer hover style override behavior.
- Pointer-kind component support and pointer tests.
- Supporting inspector and renderer integration updates directly tied to pointer visibility/usability.

## Exclusions

- Soccer ball prefab, rolling animation, kick physics, and recoil balancing.
- Unrelated skill/developer-workflow automation work.
- New network protocol capabilities.

## Open Questions

- Should pointer style remain renderer-specific or be promoted to a stable cross-render API?
- Which pointer variants should be exposed by default in game client vs Storybook-only?

## Next Logical Pitches

- Unified pointer style presets shared across client and Storybook.
- Pointer customization UX and persistence.
- Pointer accessibility pass (contrast, size, motion sensitivity).
