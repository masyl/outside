---
name: manage-work-tracks – Ȯ
description: Manages development tracks (worktree + track branch + related deliveries). Use when opening a new track, reporting status across active tracks, checking current track health, or closing a completed track.
---

# Manage Work Tracks – Ȯ

Tracks are long running branches that are frequently rebased on `trunk` to stay up to date.

They hold work context for a specific theme or initiative that may span multiple deliveries.

Syncing with trunk is done often, sometimes multiple times a day.

Never confuse syncing a track with closing a track. They are different operations.

Defines the **Track** workflow:

- One branch: `track/<slug>`
- One worktree for that branch
- One or more related deliveries
- Tracks are frequently rebased on `trunk` to stay up to date, but they are not automatically integrated or closed when deliveries are completed.
-

A track is either:

- `IN_PROGRESS` (ongoing)
- `ABORTED` (ongoing)
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
2. Sync trunk:
   - `git fetch origin`
   - `git switch trunk`
   - `git pull --ff-only origin trunk`
3. Build names:
   - `track_slug=<kebab-slug>`
   - `track_branch=track/$track_slug`
   - `repo_name=$(basename "$PWD")`
   - `worktrees_root="$(cd .. && pwd)/${repo_name}.worktrees"`
   - `worktree_path="$worktrees_root/track-$track_slug"`
4. Create worktree + branch from `trunk`:
   - `mkdir -p "$worktrees_root"`
   - If branch does not exist:
     - `git worktree add -b "$track_branch" "$worktree_path" trunk`
   - If branch already exists:
     - `git worktree add "$worktree_path" "$track_branch"`
5. Verify:
   - `git -C "$worktree_path" branch --show-current` must equal `track/<slug>`.

Output summary with emoji:

- `🟢 Track opened`
- Include: branch, worktree path, base branch (`trunk`).

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
   - `git log --oneline trunk..track/<slug>` for ahead commits count

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
- Ahead/behind vs main (if needed): `git rev-list --left-right --count trunk...HEAD`

## 4) Signal readiness for integration (when requested)

Integration into trunk is **fully automated and async** via a GitHub Actions pipeline.
No pull request is created. The agent signals readiness with a git tag; the pipeline handles the rest.

### Tag signal protocol

| Tag | Who sets it | Meaning |
|---|---|---|
| `ready/track/<slug>` | Agent | Triggers the integration pipeline |
| `integrated/track/<slug>` | Pipeline | Squash commit landed on trunk (success) |
| `closed/track/<slug>` | Pipeline | Branch tip preserved before deletion (success) |
| `failed/track/<slug>` | Pipeline | Integration failed — message contains CI run link |

### Prepare

Before signaling, ensure the track is integration-ready:

1. Rebase onto current trunk to surface conflicts now:
   - `git fetch origin`
   - `git rebase origin/trunk`
2. Run quality gates locally:
   - `pnpm lint && pnpm test`
3. Organise commits into logical units if needed.

### Trigger

Push the `ready/track/<slug>` annotated tag with integration metadata as the message:

```bash
git tag -a "ready/track/<slug>" HEAD \
  -m "Scope: <affected packages>
Squash title: <type>(<scope>): <summary>
Breaking: <yes|no>
Notes: <optional context>"
git push origin "ready/track/<slug>"
```

The pipeline will squash-merge to trunk, push result tags, and delete the branch.
**The agent does not wait** — move on to other work.

### Monitor result (optional)

```bash
git fetch --tags
git tag -l "integrated/track/<slug>"   # landed?
git tag -l "failed/track/<slug>"       # failed?
git show "failed/track/<slug>"         # failure details + CI link
```

If the integration failed, fix the issue on the track branch and re-trigger.

## 5) Close a track (when requested)

Use only when user asks to close.

1. Closing a track is not the same as integrating or syncing a track.
2. You MUST confirm with the user before doing this step on your own.
3. Confirm linked deliveries are `DONE`.
4. Confirm integration is complete: `integrated/track/<slug>` tag must exist on trunk.
5. Remove worktree:
   - `git worktree remove <worktree-path>`
6. Delete local branch (if not already deleted by pipeline):
   - `git branch -d track/<slug>`

Output:

- `✅ Track closed` (or `⚠️ close partially complete` with missing steps).
