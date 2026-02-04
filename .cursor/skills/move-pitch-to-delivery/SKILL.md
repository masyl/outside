---
name: move-pitch-to-delivery
description: Copies the full content of a pitch file into a delivery folder as pitch.md. Use when promoting a pitch to a delivery and the delivery folder already exists.
---

# Move pitch to delivery

Copies the entire content of a pitch file into a delivery folder as `pitch.md`. Single, focused task. Does not create the folder or other files.

## When to use

- Promoting a pitch to a delivery and the delivery folder already exists
- User asks to move or send the pitch into the delivery folder
- Setting up a delivery folder with the pitch content

## Inputs

- **Source pitch path**: Full path to the pitch file (e.g. `outside-design/docs/pitches/food-static-pickups.md`)
- **Destination delivery folder path**: Full path to the delivery folder (e.g. `outside-design/docs/deliveries/2026-02-02-1000-food-static-pickups`)

## Actions

1. Read the **entire content** of the source pitch file.
2. Write that content to `{delivery-folder}/pitch.md` (same filename `pitch.md` in the delivery folder).
3. Do **not** delete or modify the original file in `outside-design/docs/pitches/`.
4. Do **not** create the delivery folder or any other files.

## Do not

- Delete or edit the original pitch in docs/pitches.
- Create or fill plan.md, roadmap.md, or README.md (other skills do that).
