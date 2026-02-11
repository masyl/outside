---
title: Controller Core Input Library - Testing Report
delivery_date: 2026-02-11
status: done
type: testing
---

# Testing Report

## Scope covered

- `@outside/controller-core`
  - normalization (axes/buttons/deadzone/threshold)
  - profile resolution/fallback behavior
  - action generation and repeat handling
- `@outside/simulator`
  - new `TargetDirection` intent path in urge system
  - controlled-hero pacing/turning behavior
- `outside-storybook`
  - static build validation for updated stories and new `@outside/test-player` integration

## Commands run

- `pnpm --filter @outside/controller-core test`
- `pnpm --filter @outside/simulator test urge.test.ts`
- `pnpm --filter outside-storybook build-storybook`

## Results

- All executed tests passed.
- Storybook production build completed successfully.

## Not tested

- No dedicated unit tests exist yet in `@outside/test-player` (package currently relies on integration validation through Storybook).
- Live hardware behavior (PS5 touchpad pointer movement stream differences by browser/OS combination) still depends on manual validation in-browser.

## Recommendations

- Add targeted unit tests for `@outside/test-player` stream/controller orchestration (`gamepad selection`, `hero switch`, `target-direction set/clear`).
- Add one simulator test for `TargetDirection` + path-following interaction precedence if both are present in the same tick.
