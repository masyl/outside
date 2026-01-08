# AI Agent Instructions

This document contains instructions for AI agents working on the Outside project.

## Wrapup Process

When a plan has been completed and the user requests a "wrapup", follow this process:

### When to Perform Wrapup

- **Never initiate wrapup automatically** - only perform wrapup when explicitly requested by the user
- The user will say "wrapup" or request to wrapup a specific plan
- Wrapup should happen **after completing a plan, before the last commit and before the push**

### Wrapup Steps

1. **Update the Plan**
   - Read the original plan from `~/.cursor/plans/`
   - Update it to reflect the **actual work that was done** (not just the original plan)
   - Modify sections to match what was actually implemented
   - Remove or update any todos that weren't completed
   - Add notes about deviations from the original plan

2. **Add Work Summary**
   - Add a new "Work Summary" section as the **first section** of the plan
   - Include:
     - High-level overview of what was accomplished
     - Key achievements
     - Any notable challenges or solutions
     - Final state of the implementation

3. **Add Commit Reference**
   - Get the last commit hash before adding the plan
   - Add a "Commit Reference" section with:
     - Commit hash
     - GitHub link to the commit (format: `https://github.com/masyl/outside/commit/{hash}`)
     - Brief description of what the commit contains

4. **Save the Plan**
   - Create a new file in `outside-design/docs/built-plans/`
   - Use format: `{YYYY-MM-DD-HHMM}-{descriptive-name}.md`
   - Example: `2024-01-08-1409-game-client-poc.md`
   - Copy the updated plan content to this file

5. **Update the Index**
   - Edit `outside-design/docs/built-plans/index.md`
   - Add a new entry in the "Completed Plans" section
   - Include:
     - Date and time of completion
     - Brief description (1-2 sentences)
     - Link to the plan document
   - Keep entries in reverse chronological order (most recent first)

### Example Structure

```markdown
# Work Summary

[High-level overview of what was accomplished]

## Commit Reference

- **Commit**: `abc123def456...`
- **GitHub**: https://github.com/masyl/outside/commit/abc123def456...
- **Description**: Implemented game client POC with CQRS/Flux architecture

---

# [Original Plan Title]

[Updated plan content reflecting actual work done]
```

### Important Notes

- Always update the plan to reflect reality, not the original intention
- Include what was actually built, even if it differs from the plan
- Document any important decisions or changes made during implementation
- The wrapup is a documentation step, not a code change step
- After wrapup, the user will commit and push the documentation changes
