---
Title: Controller Core Input Library
Category: Input
Summary: Create a dependency-free controller core package that normalizes controller layouts into a clean API, with Storybook stories for validation.
DeliveryLink: /deliveries/2026-02-11-1539-controller-core-input-library/
---

# Controller Core Input Library

## Motivation

The current input system is keyboard and pointer oriented. Adding game controller support directly inside the client would quickly create device-specific branches and repeated mapping logic. We need a reusable foundation that isolates controller complexity behind a clean API so future features can consume controller intent without caring about controller brand differences.

## Solution

Create a new standalone package that has no external runtime dependencies and exposes a small, typed API for controller normalization and action resolution.

The package will accept generic controller snapshots (buttons, axes, metadata) and produce normalized outputs such as directional intent and named actions. The package will include profile-based mapping for common controller families (Xbox-like, PlayStation-like, Nintendo-like), plus a fallback strategy for unknown controllers.

Validation and exploratory testing will be done through Storybook stories that visualize raw input, normalized state, and emitted intents.

## Inclusions

- New package dedicated to controller-core logic (dependency-free runtime).
- Public API for:
  - ingesting controller snapshots,
  - normalizing axes/buttons,
  - resolving high-level intents/actions,
  - exposing profile and mapping metadata.
- Default profiles for major layout families (Xbox-like, PlayStation-like, Nintendo-like) and an explicit fallback profile.
- Configurable deadzones, trigger thresholds, and repeat behavior controls.
- Deterministic unit tests for normalization and mapping behavior.
- Storybook stories in `outside-storybook` to interactively test and inspect the library behavior.
- Documentation comments for key public types and functions.

## Exclusions

- Wiring controller input into the game loop, host/client modes, or existing keyboard handler.
- Browser APIs (`navigator.getGamepads`) integration.
- Vendor-specific advanced features (rumble, LEDs, gyro, touchpad).
- Persistence of user remaps.
- UI for in-game remapping.

## Implementation Details

Implementation should remain platform-agnostic by accepting plain data snapshots instead of reading browser APIs directly. This keeps the package reusable in browser, tests, and potential non-browser runtimes.

## Prerequisites

None.

## Suggested follow ups

- Pitch: Integrate the controller core API into `outside-client` input flow.
- Pitch: Add browser adapter layer (Gamepad API + connection lifecycle).
- Pitch: Add optional vendor adapters (WebHID) for advanced features.
- Pitch: Add user remapping and profile persistence.

## Open Questions

- Should the future integration pitch include keyboard and controller unification under a single input abstraction, or keep parallel adapters that both emit the same command shape?
