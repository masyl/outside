---
name: create-delivery-roadmap
description: Creates roadmap.md in a delivery folder with frontmatter, Workstreams, Agent workflow, and Milestones/Todos (structure only, unchecked). Use when a delivery folder and plan exist and a roadmap file is needed to track progress.
---

# Create delivery roadmap

Creates `roadmap.md` in a delivery folder. Structure only: frontmatter, Workstreams (bullet list), Agent workflow (short loop), and Milestones/Todos with unchecked `- [ ]` items. If plan.md exists, derive phase and todo headings from its major sections.

## When to use

- A delivery folder and plan exist and a roadmap file is needed
- Promoting a pitch to delivery (after plan is written)
- User asks to create the roadmap for a delivery

## Inputs

- **Delivery folder path**: Full path to the delivery folder (e.g. `outside-design/docs/deliveries/2026-02-02-1000-food-static-pickups`)
- **Optional**: Path to plan.md (to derive phase/todo structure from plan headings). Default: `{delivery-folder}/plan.md`
- **Optional**: Delivery title (for roadmap title and intro)
- **Optional**: Delivery date (YYYY-MM-DD) for frontmatter; default: use folder date or today

## Actions

1. **Frontmatter** (YAML):
   - `title`: Short title (e.g. "<Delivery Name> Roadmap")
   - `delivery_date`: YYYY-MM-DD
   - `status: 'planning'`
   - `type: 'roadmap'`
   - `related_documents`: `['./pitch.md', './plan.md']`

2. **Body**:
   - **Intro**: One short paragraph: "This roadmap tracks the **todos** and **success criteria** for [delivery goal]. Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for details."
   - **Workstreams**: 3–5 high-level workstreams as a bullet list only (no checkboxes). Example: `- **W1: Data model** (components, types)`, `- **W2: Core logic** (systems)`, `- **W3: Integration** (API, Storybook)`, `- **W4: Tests** (unit, determinism)`, `- **W5: Docs** (TSDoc, README)`.
   - **Agent workflow**: Short incremental loop. Example: "1. Complete one todo / 2. Write tests and pass / 3. Update roadmap.md / 4. Commit. Then repeat."
   - **Milestones / Todos**: Phases (Phase 0, 1, 2, …) with **unchecked** items only: `- [ ]`. If plan.md exists, read its major section headings (e.g. "## 1. Components", "## 2. Systems") and create one phase per section with one unchecked item per phase (e.g. "Complete Phase 0 tasks"). If plan does not exist, create 3–5 generic phases (e.g. "Phase 0: Setup", "Phase 1: Core", "Phase 2: Integration", "Phase 3: Tests") with one unchecked item each.

3. **Do not** add "Success criteria" or "Open questions" blocks in the initial roadmap unless the plan explicitly references them; structure only.

## Reference

- [tappable-entities/roadmap.md](outside-design/docs/deliveries/tappable-entities/roadmap.md)
- [urge-system/roadmap.md](outside-design/docs/deliveries/urge-system/roadmap.md)
