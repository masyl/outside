---
name: create-pitch
description: Creates a properly formatted pitch document for new features following project conventions. Use when the user wants to create a pitch, propose a feature, formalize an idea, or asks about pitches.
---

# Create Pitch

Creates a pitch document following the project's Shape Up-inspired methodology. Pitches bridge ideation and implementation by framing scope without overly detailed requirements.

## When to use

- User asks to create a pitch or formalize an idea
- Starting a new feature that needs scoping
- Before creating an implementation plan
- User mentions "pitch" or "proposal"

## Pitch template

Use this structure for all pitches:

```markdown
# [Feature Name]

## Motivation

Why is this needed? What problem does it solve?

## Solution

High-level approach to solving the problem. Accessible to non-developers.

## Inclusions

Bullet list of what IS included in this pitch:
- Specific feature 1
- Specific feature 2
- Specific deliverable 3

## Exclusions

What is explicitly NOT included (future work, out of scope):
- Feature X (will be addressed in future pitch)
- Advanced capability Y

## Implementation Details

*Use sparingly* - only include if crucial to the pitch.
Most technical details belong in the planning phase.

## Missing Prerequisites

- Prerequisite feature 1
- Prerequisite feature 2
- Or: "None" if foundational

## Suggested follow ups

- Related features, improvements or pitches that could follow this one.
- Any other logical next steps that could follow the delivery of this pitch.

## Open Questions

- Question 1 that needs answering?
- Question 2 about approach?
- Or: "None"
```

## Review criteria

Before finalizing, verify:

**Readability**:

- Accessible to non-developers (designers, users, testers)
- Technical language used sparingly with justification
- Clear problem and solution statements

**Implementation confidence**:

- Agent can write detailed implementation plan from this pitch
- Scope is well-defined but not overly prescriptive
- Critical aspects are clear

**Technical details**:

- Minimal technical details (most belong in planning phase)
- Any included technical details have clear justification

## File location and naming

- **Directory**: `packages/outside-design/docs/pitches/`
- **Filename**: `kebab-case-name.md` (e.g., `timeline-engine-core.md`)
- **Title in file**: Use Title Case (e.g., "Timeline Engine Core")

### Alternate locations

- Pitches that have moved on to a delivery are moved to their delivery folders in: `packages/outside-design/docs/deliveries/*/pitch.md`
- If working on a temporary pitch during a session, a draft pitch document can be found in `agent-collab/new-pitch.md`


## Amendments after work starts

If the pitch needs modification during implementation:

- Use strikethrough for modified content
- Add warning: "This pitch was modified during implementation"
- Include summary of amendments
- Purpose: track abandoned requirements and scope changes

## Series pitches

For related features, indicate series context:

- Add series number to title: "Feature Name (Series: 1)"
- Reference related pitches in "Related Pitches" section
- Include "Series Context" section explaining relationship

## Examples

See existing pitches in `packages/outside-design/docs/pitches/`:

- `keystroke-help-menu.md` - Simple, focused pitch
- `timeline-engine-core.md` - Complex feature with series context
- `inventory-and-pickable-objects.md` - Minimal pitch (early stage)
