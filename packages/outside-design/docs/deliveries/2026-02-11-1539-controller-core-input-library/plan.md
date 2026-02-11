# Implementation Plan: Controller Core Input Library

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

Build a new dependency-free package that converts raw controller snapshots into normalized state and high-level actions. The package will remain platform-agnostic and will not call browser APIs directly. Storybook stories will exercise the API with synthetic inputs so behavior can be validated before client integration.

## Architectural Principles

1. Runtime dependency-free: rely only on TypeScript/JavaScript language features.
2. Platform-agnostic input: accept plain snapshot objects, never call `navigator.getGamepads()` inside core.
3. Stable intent model: output canonical action/intention shapes independent of vendor naming.
4. Deterministic processing: same snapshots + config should always produce the same outputs.
5. Explicit extensibility: profiles and mappings should be configurable without changing core flow.

## Package Setup

### Checklist

- [x] Create `packages/outside-controller-core` package with build/test scripts.
- [x] Add package TypeScript config and entrypoint exports.
- [x] Add package to Storybook dependencies and source aliases as needed.

## Core API and Logic

### Checklist

- [x] Define public types for raw snapshot input, normalized state, profiles, and emitted actions.
- [x] Implement profile resolution strategy (xbox-like, playstation-like, nintendo-like, fallback).
- [x] Implement normalization for sticks, triggers, and buttons with configurable thresholds/deadzones.
- [x] Implement intent/action resolver with repeat behavior controls.
- [x] Expose a compact high-level API for one-step processing.

## Tests

### Checklist

- [x] Add unit tests for profile resolution and fallback behavior.
- [x] Add unit tests for deadzone/threshold normalization.
- [x] Add unit tests for intent/action emission and repeat rules.
- [x] Validate deterministic behavior across repeated runs.

## Storybook Validation

### Checklist

- [x] Add stories that feed synthetic snapshots into the controller core API.
- [x] Add visual output for raw snapshot, normalized state, and emitted actions.
- [x] Add controls for profile family, deadzone, thresholds, and repeat timing.

## Additional Delivered Scope (Post-Plan)

### Checklist

- [x] Create reusable `@outside/test-player` package to compose simulator + renderer + controller APIs.
- [x] Refactor Zoo stories to use `@outside/test-player` configs instead of direct renderer wiring.
- [x] Add in-story controller device selector (`None` / `Auto` / specific pad).
- [x] Implement controller hero switching (`d-pad left`) and jump action (`PRIMARY`/X).
- [x] Add simulator `TargetDirection` intent component distinct from movement `Direction`.
- [x] Wire urge-system controlled-hero behavior to consume `TargetDirection`.
- [x] Add simulator tests for new controlled-hero target-direction behavior.

## Master Checklist

- [x] Package scaffolding complete.
- [x] Core API implemented and exported.
- [x] Unit tests added and passing.
- [x] Storybook stories added and working.
- [x] Build/test checks run successfully.

## Notes

- Integration with `outside-client` keyboard/network flow is intentionally out of scope for this delivery and belongs to a follow-up pitch.
- Scope expanded during implementation to include reusable Storybook test harness and simulator-side intent plumbing needed for practical controller verification.
