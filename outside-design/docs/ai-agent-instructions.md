# AI Agent Instructions

This document contains instructions for AI agents working on the Outside project.

## Pitch Phase

When proposing new features or system changes, create a pitch to frame the scope of development work.

### When to Create a Pitch

- After ideation is complete and we have a worthwhile idea
- Before beginning implementation work
- As the first step in planning work for any system modification

### Pitch Creation Process

1. Draft the pitch using the standard template and format requirements
2. Review the pitch in conversation with an AI agent using the review criteria
3. Refine based on feedback to achieve appropriate scope and clarity
4. Move to implementation planning

[Complete Pitch Phase documentation →](/design-process/pitch-phase)

## Wrapup Phase

When a plan has been completed and the user requests a "wrapup", follow this process:

### When to Perform Wrapup

- **Never initiate wrapup automatically** - only perform wrapup when explicitly requested by the user
- The user will say "wrapup" or request to wrapup a specific plan
- Wrapup should happen **after completing a plan, before the last commit and before the push**

### Delivery Folder Structure

Each delivery gets its own folder with the following structure:

```
outside-design/docs/deliveries/{YYYY-MM-DD-HHMM}-{descriptive-name}/
├── pitch.md      # The original pitch for this delivery
├── commit.md     # Prepared commit message for merging back to main
├── plan.md       # Completed or ongoing implementation plan
└── README.md     # Optional: additional context or notes
```

### Wrapup Steps

1. **Update the Plan**
   - Read the current plan content from the conversation
   - Update it to reflect the **actual work that was done** (not just the original plan)
   - Modify sections to match what was actually implemented
   - Remove or update any todos that weren't completed
   - Add notes about deviations from the original plan

2. **Create Delivery Folder**
   - Create folder in `outside-design/docs/deliveries/`
   - Use format: `{YYYY-MM-DD-HHMM}-{descriptive-name}/`
   - Example: `2024-01-08-1409-game-client-poc/`

3. **Copy Pitch**
   - Copy the original pitch file to `pitch.md`
   - Pitches are located in `outside-design/docs/pitches/`
   - Use the same pitch that initiated this work

4. **Create Commit Message**
   - Create `commit.md` with a prepared commit message
   - Include:
     - Clear, concise title
     - Brief summary of changes
     - References to pitch or related work
   - This message will be used when merging back to main branch

5. **Save Updated Plan**
   - Create `plan.md` with the updated implementation plan
   - Add cross-references at the top:
     ```markdown
     ## Related Files

     - **Pitch**: [pitch.md](./pitch.md)
     - **Commit Message**: [commit.md](./commit.md)
     ```
   - Include work summary and commit reference sections

6. **Update the Index**
   - Edit `outside-design/docs/deliveries/index.md`
   - Add a new entry in the "Completed Plans" section
   - Include:
     - Date and time of completion
     - Brief description (1-2 sentences)
     - Link to the delivery folder
   - Keep entries in reverse chronological order (most recent first)

### Example File Contents

**commit.md:**

```markdown
Implement basic unit testing setup

Set up comprehensive unit testing framework across all workspace packages with code coverage reporting and TypeScript support.

- Added Vitest configuration for monorepo
- Configured code coverage with c8
- Updated turbo build scripts
- Created initial test files for core utilities
```

**plan.md:**

```markdown
## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Commit Message**: [commit.md](./commit.md)

# Work Summary

Successfully implemented a complete unit testing setup using Vitest across the monorepo. All packages now have test capabilities with proper TypeScript support and code coverage reporting.

## Commit Reference

- **Commit**: `abc123def456...`
- **GitHub**: https://github.com/masyl/outside/commit/abc123def456...
- **Description**: Implemented basic unit testing setup with Vitest and coverage reporting

---

# Basic Unit Testing Implementation Plan

[Updated plan content reflecting actual work done]
```

### Important Notes

- Always update the plan to reflect reality, not the original intention
- Include what was actually built, even if it differs from the plan
- Document any important decisions or changes made during implementation
- The wrapup is a documentation step, not a code change step
- After wrapup, the user will commit and push the documentation changes
- **Do not retrofit older deliveries** - this new structure applies only to new work
