---
title: Controller Core Input Library - Commit Prep
delivery_date: 2026-02-11
status: done
type: commit
---

# Squash Commit Message

feat(input): add controller core, reusable test-player, and hero intent controls

## Summary

- add `@outside/controller-core` package for dependency-free controller normalization and action processing
- add `@outside/test-player` package to compose simulator/renderer/controller in reusable stories
- refactor Zoo stories to use test-player configs
- add controller device selector and PS-style interaction flow (hero select/switch, jump, touchpad click)
- add simulator `TargetDirection` component and urge-system handling for input intent distinct from movement direction
- add/extend tests and validate Storybook build

## Related

- Delivery: `2026-02-11-1539-controller-core-input-library`
- Pitch: `packages/outside-design/docs/pitches/controller-core-input-library.md`

## Tags

- `delivery:2026-02-11-1539-controller-core-input-library`
- `area:input`
- `area:simulator`
- `area:storybook`
