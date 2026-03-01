---
name: create-delivery-readme – Ȯ
description: Creates or updates README.md in a delivery folder with frontmatter and document links. Use when creating or refreshing the delivery folder index (e.g. at promote time or when delivery metadata changes).
---

# Create delivery README – Ȯ

Creates or updates `README.md` in a delivery folder. Single, focused task: frontmatter and body with title, short description, and links to pitch, plan, roadmap.

## When to use

- Creating or refreshing the delivery folder index at promote time
- Delivery metadata (title, branch, summary) has changed and README should be updated
- User asks to create or update the delivery README

## Inputs

- **Delivery folder path**: Full path to the delivery folder (e.g. `packages/outside-design/docs/deliveries/2026-02-02-1000-food-static-pickups`)
- **Delivery title**: Human-readable title (e.g. "Food in the Dungeon — Static Pickups")
- **Branch name**: e.g. `feature/<delivery-slug>`
- **Optional**: One-sentence summary (for frontmatter `Summary`)
- **Optional**: Delivery date (YYYY-MM-DD) for frontmatter; default: use folder date or today

## Actions

1. **Frontmatter** (YAML):
   - `Title`: Delivery title (quoted if it contains a colon)
   - `DeliveryDate`: YYYY-MM-DD
   - `Summary`: One sentence or leave empty
   - `Status: TODO` (or DOING if delivery is in progress)
   - `Branch`: Branch name (e.g. `feature/food-static-pickups`)
   - `Commit`: Leave empty (filled at wrapup)

2. **Body**:
   - H1: Same as delivery title
   - One or two sentences: short motivation/solution (from pitch or summary)
   - **Documents** section with links:
     - [Pitch](./pitch.md)
     - [Implementation Plan](./plan.md)
     - [Roadmap](./roadmap.md)

3. Do **not** add links to delivered.md, testing.md, or commit.md (those are created at wrapup).

## Reference

- [Wrapup: Create or update README](packages/outside-design/docs/wrapup.md) — step 8
- [tappable-entities/README.md](packages/outside-design/docs/deliveries/tappable-entities/README.md)
