---
name: create-implementation-plan – Ȯ
description: Drafts a detailed implementation plan from the requirement of a pitch. Use when a pitch is ready for planning, the user asks for an implementation plan, or when starting implementation and a plan is needed.
---

# Create Implementation Plan – Ȯ

Drafts an implementation plan from a pitch so the agent and human can track objectives and progress. Plans live in delivery folders and are updated during implementation and during the wrapup process before concluding the delivery.

## When to use

- User asks to create an implementation plan or to plan implementation
- A pitch has been reviewed and is ready for planning (see [pitch-review](../pitch-review/SKILL.md))
- Before starting implementation work that will be delivered via wrapup
- User says "plan this", "implementation plan", or "ready to plan"

## Workflow position

```text
Pitch → Pitch Review → **Implementation Plan** → Implementation → Wrapup
```

Project docs: [Pitch Phase](packages/outside-design/docs/design-process/pitch-phase.md) (Planning Phase), [Wrapup](packages/outside-design/docs/wrapup.md) (plan.md, delivery folder).

## Inputs

1. **Pitch**: Path to the pitch document (e.g. `packages/outside-design/docs/pitches/<name>.md`) or pitch content in context.
2. **Open questions**: Use answers from the pitch’s "Open Questions" / "Review Questions" section. If a question has multiple prepared answers (A1, A2, A3), use the single chosen **A:** when present; otherwise ask the user to pick or infer from context.

## Plan structure

Use this structure. Omit sections that do not apply.

```markdown
# Implementation Plan: [Feature Name]

## Related Files

- **Pitch**: [pitch.md](./pitch.md) or link to pitch in `packages/outside-design/docs/pitches/`

## Overview

1–3 sentences: what will be built and the main architectural or scope decisions (from pitch Solution + Inclusions).

## Architectural Principles

Numbered list of 3–5 principles that guide implementation (from pitch constraints, exclusions, and chosen answers to open questions).

## [Major area 1: e.g. Workspace / Package Setup]

### Checklist

- [ ] Task 1
- [ ] Task 2

(Optional: subsections with code snippets, file paths, or commands.)

## [Major area 2: e.g. Core Logic / API]

### Checklist

- [ ] Task 1
- [ ] Task 2

## [Further areas as needed]

### Checklist

- [ ] …

## Master Checklist

- [ ] Item 1
- [ ] Item 2
- [ ] …

## Notes

- Dependencies, follow-ups, or references to related pitches/deliveries.
```

## Conventions

- **Checklists**: Use `- [ ]` for pending, `- [x]` for done. Plan is updated during implementation and at wrapup to reflect reality.
- **Phases / areas**: Group by package, layer, or feature (e.g. Workspace setup, Command system, Component stories). Match granularity to the pitch.
- **Detail level**: Enough that an agent can execute steps and tick items; avoid restating the pitch. Add file paths, types, and key APIs where they resolve open questions.
- **Pitch alignment**: Inclusions → checklist items or phases; Exclusions → explicit "out of scope" in Notes or Overview; Implementation Details → reflected in principles or steps.
- **Open questions**: Lock decisions in Overview or Architectural Principles (e.g. "RNG: use outside-core"; "Events: pull API after each tick").
- **Package exports**: Do **not** add a step like "Re-exports in index.ts (manual list)". The public API must not depend on a hand-maintained list of exports. Prefer `package.json` `"exports"` and barrel files that re-export from modules (e.g. `export * from './module'`) so the API is defined by the modules themselves.

## Where to write the plan

- **Before delivery folder exists**: Create the plan in a logical place (e.g. `packages/outside-design/docs/deliveries/YYYY-MM-DD-HHMM-descriptive-name/plan.md` if the user already created the folder, or a scratch path). Tell the user where the plan is and that at wrapup it will live in the delivery folder.
- **When delivery folder exists**: Write directly to `packages/outside-design/docs/deliveries/<delivery-folder>/plan.md`. Ensure the folder follows `{YYYY-MM-DD-HHMM}-{descriptive-name}/`.

## Output

1. **Plan document**: Full markdown following the structure above, filled from the pitch and open-question answers.
2. **Brief note**: Where the plan was written and what the next step is (e.g. create delivery branch, start Phase 1).

## References

- [Pitch Phase](packages/outside-design/docs/design-process/pitch-phase.md) — Planning Phase, pitch → plan.
- [Wrapup](packages/outside-design/docs/wrapup.md) — Delivery folder structure, plan.md role, "Update the Plan".
- Example plans: `packages/outside-design/docs/deliveries/2026-01-16-1430-keystroke-help-menu/plan.md`, `packages/outside-design/docs/deliveries/2026-01-15-storybook-implementation/plan.md`.
