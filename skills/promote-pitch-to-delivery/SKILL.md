---
name: promote-pitch-to-delivery
description: Promotes a pitch into an active delivery by composing other skills: create-delivery-branch, create-delivery-folder, move-pitch-to-delivery, create-implementation-plan, create-delivery-roadmap, create-delivery-readme. Use when the user wants to start a delivery from a pitch, promote a pitch to delivery, or create the delivery folder and plan from a pitch.
---

# Promote pitch to delivery

Runs the full "promote a pitch to delivery" workflow by **composing other skills** in sequence. Do not repeat steps that are already defined in the sub-skills; read and follow each skill with the inputs below.

## When to use

- User says "promote this pitch to delivery," "start a delivery from this pitch," or "create the delivery folder for [pitch]"
- User wants to begin implementation from a pitch and needs branch, folder, move pitch, plan, roadmap, and README

## Prerequisites

- Pitch exists at `packages/outside-design/docs/pitches/<name>.md` (or user provides path)
- Working tree is clean enough to create a branch (commit or stash first if needed, ask the user if needed)

## Checklist (run in order)

1. **Identify pitch and derive slug**
   - Confirm which pitch is being promoted (path under `packages/outside-design/docs/pitches/<name>.md` or user-specified).
   - Derive **delivery slug** (kebab-case) from the pitch title. Example: "Food in the Dungeon — Static Pickups" → `food-static-pickups`.

2. **Apply create-delivery-branch**
   - Read and follow [create-delivery-branch](../create-delivery-branch/SKILL.md) with branch name `feature/<delivery-slug>`.

3. **Apply create-delivery-folder**
   - Read and follow [create-delivery-folder](../create-delivery-folder/SKILL.md) with delivery slug and current date-time.
   - Result: folder `packages/outside-design/docs/deliveries/{YYYY-MM-DD-HHMM}-{delivery-slug}/` with placeholder files.

4. **Apply move-pitch-to-delivery**
   - Read and follow [move-pitch-to-delivery](../move-pitch-to-delivery/SKILL.md).
   - Inputs: source = pitch path from step 1; destination = delivery folder from step 3.

5. **Apply create-implementation-plan**
   - Read and follow [create-implementation-plan](../create-implementation-plan/SKILL.md).
   - Pitch is at `{delivery-folder}/pitch.md`; write plan to `{delivery-folder}/plan.md` (see skill: "When delivery folder exists").

6. **Apply create-delivery-roadmap**
   - Read and follow [create-delivery-roadmap](../create-delivery-roadmap/SKILL.md) with delivery folder path and plan at `{delivery-folder}/plan.md`.

7. **Apply create-delivery-readme**
   - Read and follow [create-delivery-readme](../create-delivery-readme/SKILL.md) with delivery folder path, delivery title (from pitch), branch `feature/<delivery-slug>`, and optional one-sentence summary (from pitch).

## What not to do

- Do **not** create delivered.md, testing.md, or commit.md (those are for the wrapup process).

## Merge strategy

When closing the feature branch or ending the delivery, use **Merge and Squash**.
