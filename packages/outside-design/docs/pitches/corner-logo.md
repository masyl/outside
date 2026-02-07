---
Title: Corner Logo
Category: Ideas
Status: draft
---

# Corner Logo

## Motivation

The game or demo client benefits from a visible identity or branding element. A small logo in a corner (e.g. top-left or top-right) provides that without intruding on the play area.

## Solution

Add a **corner logo** to the game or Storybook canvas: a small image or placeholder (e.g. text or icon) positioned in a chosen corner, with optional link (e.g. to project or docs). The logo is a presentational element only; no game logic depends on it.

## Inclusions

- **Placement**: one corner (e.g. top-left or top-right); configurable or fixed.
- **Asset or placeholder**: image, SVG, or text so the logo is visible even before final art.
- **Optional link**: clicking the logo can open a URL (e.g. project page, docs).
- Layering so the logo sits above the game view but does not block critical UI.

## Exclusions

- No full branding or theme system.
- No multiple logos or dynamic logo switching in this pitch.
- No game logic or simulation tied to the logo.

## Pre-requisites

- Client or Storybook canvas where the logo can be overlaid (e.g. DOM or render layer).

## Open Questions

- Which corner and what size?
- Should the logo be optional (e.g. off in production) or always on?

## Next Logical Pitches

- Theming or skinning that affects the logo.
- Settings to toggle or customize the logo.

## Implementation Details (use sparingly)

- Client-only overlay (DOM or canvas layer). No simulator or ECS involvement.
