---
name: create-feature-branch
description: Creates a new git branch for a delivery or feature from main, following project naming conventions. Use when starting a new feature, delivery, or when the user asks to create a branch for work.
---

# Create feature branch

Creates a feature branch from `main` for delivery work, using the project's branch naming convention.

## When to use

- User asks to create a branch for new work, a delivery, or a feature
- Starting a new feature and a branch does not exist yet
- User provides a delivery or feature name and wants to begin work

## Steps

1. **Ensure clean state**  
   If there are uncommitted changes, either commit them or stash. Do not create a branch over dirty work.

2. **Switch to main and update**  
   - `git checkout main`
   - `git pull origin main`

3. **Create the branch**  
   Use branch name: `feature/<kebab-case-name>`  
   - Examples: `feature/tappable-entities`, `feature/timeline-controls`, `feature/keystroke-help-menu`  
   - `git checkout -b feature/<name>`

4. **Optional: push to remote**  
   If the user will use a remote: `git push -u origin feature/<name>`

## Merge strategy

When closing a feature branch or ending a delivery, use **Merge and Squash**.

## Branch naming

- Prefix: `feature/`
- Name: lowercase, hyphens (kebab-case), descriptive
- Avoid: slashes in the name beyond the prefix, spaces, dates in the branch name
