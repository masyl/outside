---
title: Controller Core Input Library Roadmap
delivery_date: 2026-02-11
status: 'done'
type: 'roadmap'
related_documents: ['./pitch.md', './plan.md']
---

This roadmap tracks the **todos** and **success criteria** for delivering a dependency-free controller core package and Storybook validation stories. Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for delivery scope.

## Workstreams

- **W1: Package setup** (workspace package, build/test config, exports)
- **W2: Core processing** (profile resolution, normalization, intent resolution)
- **W3: Validation tests** (unit tests and deterministic behavior checks)
- **W4: Storybook coverage** (interactive stories and control knobs)
- **W5: Delivery tracking** (plan/roadmap checklist updates)
- **W6: Reusable test harness + simulator intent** (`@outside/test-player`, `TargetDirection`)

## Agent workflow

1. Complete one todo.
2. Add or update tests and ensure they pass.
3. Update roadmap and plan checkboxes.
4. Commit-ready checkpoint. Then repeat.

## Milestones / Todos

### Phase 0: Package Setup

- [x] Complete package scaffolding and exports.

### Phase 1: Core API and Logic

- [x] Complete profile, normalization, and action resolver implementation.

### Phase 2: Tests

- [x] Complete unit and determinism coverage.

### Phase 3: Storybook Validation

- [x] Complete stories for raw/normalized/action views.

### Phase 4: Verification

- [x] Complete build/test verification and update planning docs.

### Phase 5: Extended Integration Validation

- [x] Build reusable test harness package for simulator/renderer/controller integration.
- [x] Refactor Zoo stories to consume the reusable harness.
- [x] Add controller selection UI and hero control behavior in stories.
- [x] Add simulator intent component and tests for controller-directed movement.
