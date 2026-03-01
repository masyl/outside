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
- Assumes development occurs inside the unified **Dev Container** (no worktrees)
- One or more related deliveries
- Tracks are frequently rebased on `trunk` to stay up to date, but they are not automatically integrated or closed when deliveries are completed.

A track is either:

- `IN_PROGRESS` (ongoing)
- `ABORTED` (ongoing)
- `DONE` (completed and ready to close / closed)

## When to use

- User asks to start a new track from a pitch/delivery theme.
- User asks for status of active tracks.
- User asks for current track status.
- User asks to sync the track, merge with trunk, retrunk, or push to trunk.
- User asks to close or clean up a completed track.

## Naming rules

- Track branch prefix: `track/`
- Branch format: `track/<kebab-slug>`
- Track slug should be broader than a single pitch when future related deliveries are expected.

## Dev Container Guidelines

Instead of using git worktrees, this project relies on **Dev Containers**. All work happens on standard branches within the same workspace. If a track introduces significant dependency changes, agents/developers should:
1. Run `pnpm install` after checking out the track branch.
2. Recommend rebuilding the dev container if native dependencies (like Node versions or OS packages) change.

## 1) Start a new track

Use when opening a new development lane.

1. Ensure current workspace is clean (or explicitly committed/stashed).
2. Sync trunk:
   - `git fetch origin`
   - `git switch trunk`
   - `git pull --ff-only origin trunk`
3. Create and switch to the new branch:
   - `git checkout -b track/<kebab-slug>`
4. Verify:
   - `git branch --show-current` must equal `track/<slug>`.

Output summary with emoji:

- `🟢 Track opened`
- Include: branch name, base branch (`trunk`).

## 2) Tracks status (all active tracks)

Use when user asks for summary of open tracks.

### Discover active tracks

1. Read local branches: `git branch --list 'track/*'`
2. Read remote branches if needed: `git branch -r --list 'origin/track/*'`

### Evaluate each track

For each active `track/<slug>`:

1. Confirm naming consistency:
   - Branch should be `track/<slug>`
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

- `<emoji> track/<slug> | deliveries: <count> | state: <state>`

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
3. Resolve related deliveries:
   - `packages/outside-design/docs/deliveries/*/README.md` with `Branch: track/<slug>`
4. Determine track status from delivery `Status` + branch signals:
   - `🟢` active/in-progress
   - `✅` completed

Report should include:

- Branch
- Linked deliveries and their statuses
- Ahead/behind vs trunk (if needed): `git rev-list --left-right --count trunk...HEAD`

## 4) Sync track with trunk

Also known as: "merge with trunk", "retrunk", "push to trunk".

Use when user asks to sync the current track with trunk.

1. Fetch latest:
   - `git fetch origin`
2. Rebase onto trunk:
   - `git rebase origin/trunk`
3. If rebase has conflicts, stop and report to user. Do not force resolve.
4. Force push the rebased branch:
   - `git push --force-with-lease origin HEAD`
5. Report ahead/behind:
   - `git rev-list --left-right --count origin/trunk...HEAD`

Output:

- `🔄 Track synced` with ahead count vs trunk.
- `⚠️ Sync failed — conflicts` if rebase had conflicts.

## 5) Signal readiness for integration (when requested)

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

**CRITICAL RULES:**
- NEVER bypass the CI/CD pipeline when integrating a branch, even if you have no visibility.
- If the CI/CD is either invisible to you or unresponsive, stop working and flag this to the user.

### Monitor result (optional)

```bash
git fetch --tags
git tag -l "integrated/track/<slug>"   # landed?
git tag -l "failed/track/<slug>"       # failed?
git show "failed/track/<slug>"         # failure details + CI link
```

If the integration failed, fix the issue on the track branch and re-trigger.

## 6) Close a track (when requested)

Use only when user asks to close.

1. Closing a track is not the same as integrating or syncing a track.
2. You MUST confirm with the user before doing this step on your own.
3. Confirm linked deliveries are `DONE`.
4. Confirm integration is complete: `integrated/track/<slug>` tag must exist on trunk.
5. Search for branch and optionally delete:
   - `git checkout trunk`
   - `git branch -D track/<slug>`

Output:

- `✅ Track closed` (or `⚠️ close partially complete` with missing steps).
