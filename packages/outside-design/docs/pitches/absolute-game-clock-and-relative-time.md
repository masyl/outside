---
Title: Absolute Game Clock and RelativeTime Component
Category: Core
Summary: Add a canonical absolute game clock and ECS relative-time offsets, with Storybook time stories and live absolute-time control.
---

# Absolute Game Clock and RelativeTime Component

## Motivation

The simulation currently has tick progression but no shared, explicit game-time concept that systems can reference in a consistent way. Features like watches, day/night cycles, cooldown displays, and scripted temporal offsets need a canonical clock plus an easy way to express entity-local offsets from that clock.

## Solution

Introduce a core **AbsoluteGameClock** concept represented in `DD:HH:MM:SS:MMMM` format, plus a **RelativeTime** ECS component that stores an offset from the absolute clock.

Systems can read:

- Absolute game time (global source of truth).
- Relative time for entities/features that need shifted views of that same timeline.

## Inclusions

- New core time model for absolute game time with canonical formatting `DD:HH:MM:SS:MMMM`.
- `RelativeTime` component that represents signed offset from `AbsoluteGameClock`.
- Utility functions to:
  - advance absolute time by ticks,
  - format absolute time string,
  - resolve effective time for entities/components using relative offsets.
- Deterministic behavior tied to fixed-step simulation updates.
- Storybook section dedicated to time features.
- A visible control showing the current absolute time in Storybook/demo surface.
- Tests for formatting, rollover, negative/positive offsets, and deterministic advancement.

## Exclusions

- No full timeline/replay/time-travel UI in this pitch.
- No real-world wall-clock synchronization.
- No scheduling language or cron-like event authoring.
- No multiplayer protocol redesign beyond minimal serialization needs.

## Implementation Details (use sparingly)

- Treat absolute clock as simulation data, not renderer-local state.
- Prefer a millisecond-based internal representation with derived formatted output.
- Keep `RelativeTime` as offset-only (does not duplicate absolute fields).
- Storybook time stories should demonstrate:
  - plain absolute clock progression,
  - one or more entities with different relative offsets.

## Pre-requisites

- Existing ECS simulation tick loop.
- Storybook infrastructure for simulator/renderer demos.

## Open Questions

- Confirm exact semantics of `MMMM` (milliseconds padded to 4 digits vs another sub-second unit).
- Should `RelativeTime` support only fixed offsets, or optional scaling (for slower/faster local time) in later pitches?
- Should there be a default global day-length convention for time-of-day consumers, or leave to follow-up pitches?

## Next Logical Pitches

- Time-of-day systems (lighting, ambience, NPC behavior windows).
- Wearable/watch UI that displays entity-relative time.
- Script/event triggers keyed to absolute or relative time conditions.
