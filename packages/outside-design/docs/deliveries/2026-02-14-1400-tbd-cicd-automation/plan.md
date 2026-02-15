# Implementation Plan: Automated Trunk-Based Development & CI/CD Pipeline

## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Roadmap**: [roadmap.md](./roadmap.md)

## Overview

This delivery implements a complete trunk-based development system with automated CI/CD, enabling hourly pushes of non-breaking changes and daily pushes of all changes to production without human intervention. Work is organized into 8 sequential phases, each of which integrates back to trunk immediately upon completion, dogfooding the TBD workflow itself. The implementation prioritizes safety (feature flags gate WIP), automation (all merges and deployments automated), and maintainability (clean trunk history, clear documentation).

## Architectural Principles

1. **Trunk First**: The trunk branch is sacred—only clean, organized commits with passing CI/CD. Exploration happens on track branches, organized before integration.

2. **Feature Flags for Safety**: All incomplete work is hidden behind feature flags, allowing code integration without behavioral changes. Flags are config-based initially (can migrate to service-based later).

3. **Automation Over Manual Process**: Every gate is automated—PR creation, CI/CD checks, merge decision, deployment, rollback. No human intervention required for non-breaking changes.

4. **Clear Commit History**: Trunk history tells the story of intentional changes. Interactive rebase on track branches organizes exploration into clean commits before merging.

5. **Phase-Based Integration**: Each phase is self-contained, completes to a working state, and integrates back to trunk. This preserves context and enables parallel work on some phases.

## Phase 1: Infrastructure & Branch Management

Rename main to trunk, update all references.

### Checklist

- [ ] Create `trunk` branch from current `main`
- [ ] Set `trunk` as default branch on GitHub
- [ ] Update local git config: `git branch -m main trunk && git branch -u origin/trunk trunk`
- [ ] Update CI/CD workflows: all references `main` → `trunk`
- [ ] Update README and documentation: all references `main` → `trunk`
- [ ] Update `.gitconfig` or team scripts to reference `trunk`
- [ ] Delete `main` branch from remote
- [ ] Verify all team members update local repos
- [ ] **INTEGRATION POINT**: Organize recent commits, create PR to trunk, merge
- [ ] Document this phase in `docs/architecture-decisions/adr-xxx-trunk-naming.md`

**Completion Criteria**:
- Default branch is `trunk`
- All CI/CD workflows reference `trunk`
- All documentation references `trunk`
- Local `main` branch deleted, `trunk` tracking `origin/trunk`

---

## Phase 2: CI/CD Pipeline Enhancement

Ensure full CI/CD suite runs on trunk, add security scanning.

### Checklist

- [ ] Identify CI/CD platform in use (GitHub Actions, CircleCI, GitLab CI, other)
- [ ] List all active workflows (tests, type checks, lint, builds)
- [ ] Update all workflows to trigger on `trunk` branch pushes
- [ ] Verify tests run end-to-end on trunk
- [ ] Verify TypeScript type checks pass on trunk
- [ ] Verify linting passes on trunk
- [ ] Add SAST (static application security testing) if not present
- [ ] Add dependency security scanning (e.g., Dependabot, Snyk)
- [ ] Configure PR checks to block merge if any check fails
- [ ] Document CI/CD pipeline in `docs/ci-cd/pipeline-overview.md`
- [ ] **INTEGRATION POINT**: Create PR with CI/CD updates, merge to trunk

**Completion Criteria**:
- All checks run on `trunk` pushes
- All checks run on PR to `trunk`
- No check failures on current `trunk`
- PR cannot merge if checks fail

---

## Phase 3: Automated PR Creation System

Auto-aggregate changes from track branch and create PRs to trunk.

### Checklist

- [ ] Design change detection system
  - How to identify changes on track branch? (git diff, commit hooks, scheduled scan)
  - How to aggregate commits? (collect all since last PR, or by time window)

- [ ] **Hourly non-breaking aggregation**
  - [ ] Define "non-breaking change": no behavior changes, config/docs/tooling only, feature-flagged feature
  - [ ] Build hourly job (GitHub Actions scheduled workflow or external scheduler)
  - [ ] Detect non-breaking changes on track branch
  - [ ] Aggregate into logical commits (use interactive rebase or git reset)
  - [ ] Generate PR title and body from commit messages
  - [ ] Create PR automatically via `gh pr create` or GitHub API
  - [ ] Add PR labels: `automated`, `hourly`, `non-breaking`

- [ ] **Daily all-changes aggregation**
  - [ ] Build daily job (GitHub Actions scheduled workflow)
  - [ ] Detect all changes on track branch
  - [ ] Aggregate into logical commits
  - [ ] Generate PR title and body with breaking change notice if applicable
  - [ ] Create PR automatically
  - [ ] Add PR labels: `automated`, `daily`

- [ ] **Commit organization before aggregation**
  - [ ] Document workflow: how to organize messy commits via interactive rebase
  - [ ] Create helper script to assist with rebase if useful

- [ ] Implement rollback if PR already open (don't create duplicate)
- [ ] **INTEGRATION POINT**: Create PR with PR automation system, merge to trunk

**Completion Criteria**:
- Hourly job detects non-breaking changes and creates PR
- Daily job detects all changes and creates PR
- PR includes organized, logical commits (not one giant commit)
- PR title and body are auto-generated from commit messages
- No duplicate PRs created

---

## Phase 4: Automated Merge Logic

Auto-merge to trunk when CI/CD passes.

### Checklist

- [ ] **Auto-merge configuration**
  - [ ] Enable auto-merge on GitHub (or equivalent on other platforms)
  - [ ] Configure auto-merge to trigger when all CI checks pass
  - [ ] Set merge strategy (squash, rebase, or merge commit) — **Recommendation: merge commit to preserve history**

- [ ] **Breaking change detection**
  - [ ] Define breaking change convention in commits (e.g., `BREAKING CHANGE:` in commit body)
  - [ ] Or: define in PR labels (e.g., `breaking-change`)
  - [ ] Build detection logic: scan commit messages for breaking markers
  - [ ] Document convention in `docs/development/commit-conventions.md`

- [ ] **Merge status logging**
  - [ ] Log all merge events (PR number, commits, timestamp, success/failure)
  - [ ] Create simple dashboard or metrics file tracking merge frequency

- [ ] **Rollback procedures**
  - [ ] Document how to revert a merged commit (use `git revert`, create new PR)
  - [ ] Document incident response: who to notify, how to monitor
  - [ ] Test rollback procedure with test commit

- [ ] Test auto-merge with real PRs from track branch
- [ ] **INTEGRATION POINT**: Create PR with auto-merge logic, merge to trunk

**Completion Criteria**:
- CI pass → PR auto-merges to trunk within 5 minutes
- Breaking changes detected and logged
- Rollback tested and documented

---

## Phase 5: Feature Flags System

Implement feature flags to gate incomplete/WIP features.

### Checklist

- [ ] **Design feature flag system**
  - [ ] Decision: Config-based (YAML/JSON), environment-based (env vars), or service-based?
  - [ ] **Recommendation: Config-based for now (can migrate later)**
  - [ ] Choose config location: `config/features.json`, `env/features.yaml`, or `.env.features`
  - [ ] Design flag schema: name, enabled, description, owner

- [ ] **Implement flag evaluation**
  - [ ] Create flag service/utility function: `isFeatureEnabled(flagName: string): boolean`
  - [ ] Handle flag not found (error vs safe default)
  - [ ] Support overrides (e.g., via environment variables for testing)

- [ ] **Documentation and examples**
  - [ ] Write `docs/development/feature-flags.md`: how to define and check flags
  - [ ] Create example: "Adding a new feature behind a flag"
  - [ ] Document flag naming convention (e.g., `feat.newPlayerModel`, `infra.deploymentV2`)

- [ ] **Initial flags for this delivery**
  - [ ] Create flags for each phase not yet complete:
    - `infra.trunkBased` (when Phase 1 done, remove gate)
    - `infra.autoMerge` (when Phase 4 done, remove gate)
    - `infra.featureFlags` (when Phase 5 done, remove gate)
    - Etc.

- [ ] **Flag management**
  - [ ] Document how to add/remove/toggle flags
  - [ ] Document how to query which flags are active in production

- [ ] Test feature flag evaluation in code
- [ ] **INTEGRATION POINT**: Create PR with feature flag system, merge to trunk

**Completion Criteria**:
- Flag evaluation function works correctly
- Flags can be toggled via config/environment
- All WIP phases are hidden behind flags
- Documentation is clear and includes examples

---

## Phase 6: Automated Production Deployment

Deploy to production automatically on trunk merge.

### Checklist

- [ ] **Identify deployment target**
  - [ ] Where does production run? (Vercel, Docker, custom infrastructure)
  - [ ] Access credentials and deployment procedures

- [ ] **Create deployment workflow**
  - [ ] GitHub Actions workflow: trigger on `trunk` push
  - [ ] Or: external deployment trigger (e.g., webhook, scheduled job)
  - [ ] Workflow steps: build, test, deploy

- [ ] **Environment configuration**
  - [ ] Document production environment variables
  - [ ] Document secrets management (GitHub Secrets, env files, vault)
  - [ ] Ensure sensitive config is not committed

- [ ] **Health checks and monitoring**
  - [ ] Define health check endpoint (or checklist of checks)
  - [ ] Implement health check in deployment workflow
  - [ ] Wait for health checks to pass before marking deployment done
  - [ ] Set up alerting on deployment failure (Slack, email, PagerDuty, etc.)

- [ ] **Automatic rollback on failure**
  - [ ] If health checks fail, trigger rollback
  - [ ] Rollback: revert to previous successful deployment or previous trunk commit
  - [ ] Document rollback process

- [ ] **Deployment logging and status**
  - [ ] Log all deployments: commit, timestamp, success/failure, duration
  - [ ] Create simple status page or metrics: "Last deployment: X minutes ago, status: OK"

- [ ] **Notification on deployment**
  - [ ] When deployment starts: notify (optional, to avoid noise)
  - [ ] When deployment succeeds: notify with commits included
  - [ ] When deployment fails: notify with error details
  - [ ] Notification channels: Slack, Discord, email, etc.

- [ ] Test full deployment pipeline with real trunk commit
- [ ] Test rollback procedure with intentional health check failure
- [ ] **INTEGRATION POINT**: Create PR with deployment automation, merge to trunk

**Completion Criteria**:
- Trunk commit → automatic build and deployment
- Health checks run before considering deployment successful
- Failed deployments trigger automatic rollback
- All deployments logged and monitored

---

## Phase 7: Documentation & Workflow Guides

Document the complete TBD + CI/CD system for developers and operators.

### Checklist

- [ ] **Developer workflow guides**
  - [ ] Create `docs/development/track-branch-workflow.md`
    - Overview of track branches + trunk
    - When to create delivery sub-branches
    - How to commit on track (messy is OK)
    - When and how to push to trunk

  - [ ] Create `docs/development/interactive-rebase-guide.md`
    - Step-by-step: how to organize exploration commits
    - Example: squash 8 doc tweaks into 1 clean commit
    - How to rewrite commit messages
    - Recovery from rebase mistakes

  - [ ] Create `docs/development/feature-flags.md` (already started in Phase 5)
    - How to define a new flag
    - How to use flag in code (examples)
    - When to remove a flag

  - [ ] Create `docs/development/commit-conventions.md`
    - Commit message format
    - Breaking change markers
    - Hourly vs daily change distinction

- [ ] **Operator/CI documentation**
  - [ ] Create `docs/operations/deployment-overview.md`
    - How automated deployments work
    - Monitoring and alerts
    - How to check deployment status

  - [ ] Create `docs/operations/rollback-procedures.md`
    - When to rollback
    - Rollback steps
    - Recovery procedures
    - Who to notify

  - [ ] Create `docs/operations/incident-response.md`
    - What constitutes an incident
    - Escalation procedures
    - Post-incident review process

- [ ] **Architecture Decision Records (ADRs)**
  - [ ] Create `docs/architecture-decisions/adr-001-trunk-based-development.md`
    - Decision: Use trunk-based development
    - Rationale
    - Alternatives considered
    - Consequences

  - [ ] Create `docs/architecture-decisions/adr-002-feature-flag-implementation.md`
    - Decision: Config-based feature flags
    - Rationale
    - How to extend to service-based later

  - [ ] Create `docs/architecture-decisions/adr-003-hourly-daily-deployments.md`
    - Decision: Hourly non-breaking, daily all changes
    - How breaking changes are detected
    - Future: automated detection

- [ ] **Process documentation**
  - [ ] Create `docs/development/pr-workflow.md`
    - How PRs are created (automatically)
    - How to handle auto-created PRs (review, amend if needed)
    - When to manually create a PR

  - [ ] Create `docs/development/merging-to-trunk.md`
    - When commits auto-merge
    - How to manually merge if needed
    - Reverting a merge

- [ ] Review all documentation for clarity and completeness
- [ ] **INTEGRATION POINT**: Create PR with documentation, merge to trunk

**Completion Criteria**:
- Developer can read track-branch-workflow.md and understand how to work
- Developer can read feature-flags.md and add a new flag
- Operator can read rollback-procedures.md and execute a rollback
- All major decisions documented in ADRs

---

## Phase 8: End-to-End Validation

Test the full pipeline with real deliveries.

### Checklist

- [ ] **Test hourly non-breaking aggregation**
  - [ ] Create commits on track branch (feature flags, docs, tooling)
  - [ ] Wait for hourly job to run
  - [ ] Verify PR created with organized commits
  - [ ] Verify CI/CD runs and passes
  - [ ] Verify PR auto-merges to trunk
  - [ ] Verify deployment happens automatically
  - [ ] Verify production is live with new changes

- [ ] **Test daily all-changes aggregation**
  - [ ] Create breaking-change commits on track branch (behavior change behind flag)
  - [ ] Wait for daily job to run
  - [ ] Verify PR created with breaking-change label/notice
  - [ ] Verify CI/CD runs and passes
  - [ ] Verify PR auto-merges to trunk
  - [ ] Verify deployment happens automatically
  - [ ] Verify production has new changes

- [ ] **Test rollback procedure**
  - [ ] Intentionally break health checks
  - [ ] Verify automatic rollback triggers
  - [ ] Verify alerts fire correctly
  - [ ] Verify production recovers

- [ ] **Validation checklist**
  - [ ] ✓ Hourly non-breaking changes deploy successfully
  - [ ] ✓ Daily all-changes deploy successfully
  - [ ] ✓ Trunk history is clean and tells the story
  - [ ] ✓ Feature flags properly gate WIP features
  - [ ] ✓ Rollback works correctly
  - [ ] ✓ Agent can push changes without friction
  - [ ] ✓ No human intervention needed (except for incidents)

- [ ] **Documentation review**
  - [ ] Developers follow docs successfully
  - [ ] Operators can execute all procedures
  - [ ] Edge cases documented

- [ ] **Cleanup and finalization**
  - [ ] Remove temporary feature flags used for phases
  - [ ] Remove debug logging
  - [ ] Final PR to trunk with cleanup

**Completion Criteria**:
- Full end-to-end pipeline works with real deliveries
- Hourly and daily deployments working
- Rollback tested and verified
- All documentation reviewed and updated
- Zero human intervention required for normal operation

---

## Master Checklist

- [ ] **Phase 1**: Infrastructure & Branch Management complete
- [ ] **Phase 2**: CI/CD Pipeline Enhancement complete
- [ ] **Phase 3**: Automated PR Creation System complete
- [ ] **Phase 4**: Automated Merge Logic complete
- [ ] **Phase 5**: Feature Flags System complete
- [ ] **Phase 6**: Automated Production Deployment complete
- [ ] **Phase 7**: Documentation & Workflow Guides complete
- [ ] **Phase 8**: End-to-End Validation complete
- [ ] All integration points merged to trunk
- [ ] All temporary feature flags removed
- [ ] Final documentation review complete
- [ ] Delivery complete and validated

---

## Notes

### Dependencies

- **Phase 1** must complete first (infrastructure)
- **Phase 2** should complete before Phase 3 (ensure CI/CD is solid)
- **Phase 4** depends on Phase 2 and 3 (needs working CI/CD and PR creation)
- **Phase 5** can proceed in parallel with Phase 3-4 (independent work)
- **Phase 6** depends on all previous phases
- **Phases 7 & 8** can proceed in parallel with Phase 6

### Integration Strategy (Dogfooding TBD)

Each phase completes and immediately integrates back to trunk:
1. Work on long-running track branch across multiple sessions
2. Organize exploration commits via interactive rebase
3. Create PR to trunk
4. Verify CI passes
5. System auto-merges
6. System auto-deploys to production
7. Move to next phase

This demonstrates the TBD workflow as we implement it.

### Open Questions Resolved

From the pitch, the following need to be clarified:

1. **CI/CD Platform**: GitHub Actions / CircleCI / other?
   - **Assumption**: GitHub Actions (detected from repo)
   - **Action**: Confirm in Phase 2

2. **Deployment Target**: Vercel / Docker / custom?
   - **Assumption**: Vercel (common for web projects)
   - **Action**: Confirm in Phase 6

3. **Feature Flag Implementation**: Config / env / service?
   - **Recommendation**: Config-based YAML in Phase 5, migrate to service-based later
   - **Action**: Implement in Phase 5

4. **Breaking Change Detection**: Automatic / manual?
   - **Recommendation**: Manual (commit message convention) in Phase 4, automate later
   - **Action**: Implement in Phase 4

5. **Deployment Notification**: Slack / Discord / email?
   - **Assumption**: Slack (most common)
   - **Action**: Implement in Phase 6

### References

- Pitch: [pitch.md](./pitch.md)
- Roadmap: [roadmap.md](./roadmap.md)
- Trunk-Based Development principles: https://trunkbaseddevelopment.com/
- GitHub Auto-Merge: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request
- Feature Flags: https://martinfowler.com/articles/feature-toggles.html
