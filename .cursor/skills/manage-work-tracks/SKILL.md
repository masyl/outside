---
name: manage-work-tracks – Ȯ
description: Manages development tracks (worktree + track branch + related deliveries). Use when opening a new track, reporting status across active tracks, checking current track health, or closing a completed track.
---

# Manage Work Tracks – Ȯ

Defines the **Track** workflow:

- One branch: `track/<slug>`
- One worktree for that branch
- One or more related deliveries

A track is either:

- `IN_PROGRESS` (ongoing)
- `DONE` (completed and ready to close / closed)

## When to use

- User asks to start a new track from a pitch/delivery theme.
- User asks for status of active tracks.
- User asks for current track status.
- User asks to close or clean up a completed track.

## Naming rules

- Track branch prefix: `track/`
- Branch format: `track/<kebab-slug>`
- Worktree directory format: `<repo>.worktrees/track-<kebab-slug>`
- Track slug should be broader than a single pitch when future related deliveries are expected.

## 1) Start a new track

Use when opening a new development lane.

1. Ensure current workspace is clean (or explicitly committed/stashed).
2. Sync main:
   - `git fetch origin`
   - `git switch main`
   - `git pull --ff-only origin main`
3. Build names:
   - `track_slug=<kebab-slug>`
   - `track_branch=track/$track_slug`
   - `repo_name=$(basename "$PWD")`
   - `worktrees_root="$(cd .. && pwd)/${repo_name}.worktrees"`
   - `worktree_path="$worktrees_root/track-$track_slug"`
4. Create worktree + branch from `main`:
   - `mkdir -p "$worktrees_root"`
   - If branch does not exist:
     - `git worktree add -b "$track_branch" "$worktree_path" main`
   - If branch already exists:
     - `git worktree add "$worktree_path" "$track_branch"`
5. Verify:
   - `git -C "$worktree_path" branch --show-current` must equal `track/<slug>`.

Output summary with emoji:

- `🟢 Track opened`
- Include: branch, worktree path, base branch (`main`).

## 2) Tracks status (all active tracks)

Use when user asks for summary of open tracks.

### Discover active tracks

1. Read worktrees: `git worktree list --porcelain`
2. Keep entries where branch starts with `refs/heads/track/`.

### Evaluate each track

For each active `track/<slug>`:

1. Confirm naming consistency:
   - Branch should be `track/<slug>`
   - Worktree path should end with `track-<slug>`
2. Find related deliveries:
   - Scan `packages/outside-design/docs/deliveries/*/README.md`
   - Match `Branch: track/<slug>` in frontmatter/body
3. Determine delivery state:
   - `✅` if all matched deliveries are `Status: DONE`
   - `🟢` if any matched delivery is `Status: IN_PROGRESS`
   - `🟡` if no delivery is linked yet
   - `⚠️` if naming mismatch or mixed/inconsistent status metadata
4. Optional git signal:
   - `git log --oneline main..track/<slug>` for ahead commits count

### Report format

One line per track:

- `<emoji> track/<slug> | worktree: <path> | deliveries: <count> | state: <state>`

Use emoji legend:

- `🟢` in progress
- `✅` done
- `🟡` no linked delivery yet
- `⚠️` inconsistent metadata or naming

## 3) Current track status

Use when user asks “current track status”.

1. Read current branch:
   - `git branch --show-current`
2. If branch is not `track/*`, report:
   - `⚪ Not on a track branch`
3. If on `track/<slug>`, verify:
   - Worktree exists for current branch (`git worktree list --porcelain`)
   - Current worktree path name matches `track-<slug>`
4. Resolve related deliveries:
   - `packages/outside-design/docs/deliveries/*/README.md` with `Branch: track/<slug>`
5. Determine track status from delivery `Status` + branch signals:
   - `🟢` active/in-progress
   - `✅` completed
   - `⚠️` mismatch between docs and branch/worktree setup

Report should include:

- Branch
- Worktree path
- Naming check result
- Linked deliveries and their statuses
- Ahead/behind vs main (if needed): `git rev-list --left-right --count main...HEAD`

## 4) Close a track (when requested)

Use only when user asks to close.

1. Confirm linked deliveries are `DONE`.
2. Ensure changes are merged/squashed as requested.
3. Remove worktree:
   - `git worktree remove <worktree-path>`
4. Delete local branch (optional, user-confirmed):
   - `git branch -d track/<slug>`
5. Delete remote branch (optional, user-confirmed):
   - `git push origin --delete track/<slug>`

Output:

- `✅ Track closed` (or `⚠️ close partially complete` with missing steps).
