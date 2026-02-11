---
title: Controller Core Input Library - Delivered
delivery_date: 2026-02-11
status: done
type: delivered
---

# Delivered Summary

## What was delivered

- New package: `@outside/controller-core`
  - dependency-free controller normalization and action API
  - profile families (xbox-like, playstation-like, nintendo-like, generic)
  - repeatable action processor and configurable thresholds/deadzones
  - unit tests and Storybook stories for synthetic and live inspection
- New package: `@outside/test-player`
  - reusable story/runtime harness that composes simulator + renderer + controller API
  - extracted shared stream/controller logic from direct story wiring
- Zoo stories refactored to use `@outside/test-player`
  - dedicated config modules per story
  - controller selector UI with `None`, `Auto`, and per-device options
- Controller interaction updates
  - d-pad left cycles active hero
  - `X`/PRIMARY triggers jump on selected hero
  - touchpad button click triggers pointer action path
- Simulator input-intent architecture improvement
  - added `TargetDirection` component (desired input direction, independent from movement direction)
  - urge system now consumes `TargetDirection` for hero control and maps to pace levels
  - tests added for the new intent behavior

## Deviations from original pitch/plan

- The original pitch focused on a dependency-free core library + Storybook validation.
- Additional integration scaffolding and simulator intent work were added to support practical controller verification and reusable testing workflows.

## Extras added after planning

- `@outside/test-player` package and Zoo story integration.
- Hero selection and controller device selection controls in-story.
- `TargetDirection` simulator component and related urge tests.

## Coverage/testing impact (short)

- Controller-core tests remain green.
- Simulator urge test coverage increased with controlled-hero intent cases.
- Storybook build validates end-to-end package integration.

## Architecture / dependency notes

- Added new workspace package: `@outside/test-player`.
- Added simulator component `TargetDirection` and urge-system behavior branch for controlled heroes.
- No external runtime dependency added to controller-core.

## Logical next pitch

- Integrate controller command outputs into `outside-client` runtime input abstraction (keyboard + controller unification), including persistent remapping and platform-specific adapter strategy.
