---
name: create-delivery-folder
description: Creates the delivery folder and initial file structure (empty placeholders) under outside-design/docs/deliveries. Use when starting a new delivery and the folder does not exist yet, or when an agent needs the folder structure before copying pitch, plan, or roadmap.
---

# Create delivery folder

Creates the delivery folder and initial file structure only. Does not fill pitch.md, plan.md, or roadmap.md content; other skills do that.

## When to use

- Starting a new delivery and the folder does not exist yet
- An agent needs to create the folder structure before copying pitch, plan, or roadmap
- User asks to create the delivery folder or delivery folder structure

## Inputs

- **Delivery slug** (kebab-case) or full folder name (e.g. `food-static-pickups`)
- **Optional**: Date-time for folder prefix (default: current date and time). Format: `YYYY-MM-DD-HHMM` (e.g. `2026-02-02-1000`)

## Actions

1. **Folder path**: `outside-design/docs/deliveries/{YYYY-MM-DD-HHMM}-{kebab-name}/`
   - Use current date-time if not provided (e.g. today at 10:00 → `2026-02-02-1000`).
   - Name: lowercase, hyphens only (kebab-case).

2. **Create the folder** and these files with initial content only:
   - **pitch.md**: Empty or placeholder line (e.g. `<!-- populated by copy-pitch-to-delivery -->`). Do not fill from pitches.
   - **plan.md**: Empty or placeholder. Do not fill (create-implementation-plan does that).
   - **roadmap.md**: Empty or placeholder. Do not fill (create-delivery-roadmap does that).
   - **README.md**: Minimal content:
     - Frontmatter: `Title` (placeholder or from input), `DeliveryDate` (YYYY-MM-DD), `Summary` (optional), `Status: TODO`, `Branch` (e.g. `feature/<slug>`).
     - Body: H1 title (placeholder or slug-derived), short line "Documents:", links to [Pitch](./pitch.md), [Implementation Plan](./plan.md), [Roadmap](./roadmap.md).

## Do not

- Fill pitch.md, plan.md, or roadmap.md with real content (other skills do that).
- Create delivered.md, testing.md, or commit.md (those are for wrapup).

## Reference

- [Wrapup: Delivery Folder Structure](outside-design/docs/wrapup.md) — folder format and expected files.
