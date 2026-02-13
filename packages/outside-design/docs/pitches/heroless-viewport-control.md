---
Title: Heroless Viewport Control
Category: Gameplay
---

# Heroless Viewport Control

## Motivation

When the player has no hero available to control — because none exist yet, all heroes are dead, or the scenario does not include any — the viewport currently falls back to centering on the bounding box of all world entities. This is passive and gives the player no agency.

A better experience is to let the player freely pan the viewport in this situation, as if they are observing the world from a detached camera. This requires a first-class in-game entity to represent the viewport's position in the world.

## Solution

Introduce a **ViewportAnchor** entity: an invisible in-game entity placed at a position in the world. When no hero is available for control, the viewport follows this entity instead of a hero, and the player's directional input moves it.

The ViewportAnchor is always present in the world but is only activated as the follow target when no controllable hero exists.

## Inclusions

- `ViewportAnchor` ECS component and entity, created alongside the `View` entity during world initialisation.
- Logic to detect when no controllable hero is present and set the ViewportAnchor as the `IsViewportFocus` target.
- Logic to restore focus to a hero when one becomes available.
- Movement system that translates player directional input into ViewportAnchor position updates when it is the active follow target.
- The ViewportAnchor entity is never rendered (no sprite, no minimap pixel).

## Exclusions

- No visible indicator or sprite for the ViewportAnchor.
- No momentum or inertia on viewport panning.
- No edge-of-world clamping (out of scope for this pitch).

## Implementation Details

- The ViewportAnchor entity carries a `ViewportAnchor` tag component and a `Position` component.
- On each tick, a system checks if `IsViewportFocus` points to a valid hero. If not, it switches to the ViewportAnchor.
- Movement speed for the free-panning viewport should match the average hero walk speed.
- Initial placement of the ViewportAnchor is the center of the world bounds at spawn time.

## Missing Prerequisites

- None. The `View` + `IsViewportFocus` + `Position` infrastructure already exists in `outside-simulator`.

## Suggested Follow-ups

- Edge-of-world clamping.
- Smooth transition animation when focus switches between a hero and the ViewportAnchor.
- Allowing spectator mode to click-to-teleport the anchor.

## Review Questions

- Should the ViewportAnchor position persist across simulation resets, or reset to world center each time?
- Should directional input for the ViewportAnchor come from the same input bindings as hero movement, or separate pan bindings?