---
title: "WFC Dungeon Generator in Storybook Roadmap"
delivery_date: 2026-02-04
status: done
type: roadmap
related_documents: ['./pitch.md', './plan.md']
---

# WFC Dungeon Generator in Storybook — Roadmap

This roadmap tracks the **todos** and **success criteria** for adding a WFC-based dungeon generator to Storybook. Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for details.

## Workstreams

- **W1: Dependency and types** — Add wavefunctioncollapse, type declarations.
- **W2: WFC dungeon module** — Tileset, generateDungeonWFC, fallback to rooms.
- **W3: Spawn and Storybook** — New spawn functions, new stories.
- **W4: Verification** — Build and Storybook run; compare WFC vs rooms in browser.

## Agent workflow

1. Complete one plan checklist item (or phase).
2. Run build and Storybook; fix any issues.
3. Update roadmap.md (check off items).
4. Commit. Repeat until all items done.

## Milestones / Todos

- [x] **Phase 1**: Add dependency and type declarations (plan §1).
- [x] **Phase 2**: Implement dungeonLayoutWFC.ts and generateDungeonWFC (plan §2).
- [x] **Phase 3**: Add WFC spawn functions and Storybook stories (plan §3).
