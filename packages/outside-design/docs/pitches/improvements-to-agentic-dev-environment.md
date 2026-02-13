---
Title: Improvements to Agentic Dev Environment
Category: Delivery Process
Summary: Make agentic implementation work observable, reproducible, and less disruptive for manual testing by standardizing runtime commands, shared logs, and proof-based validation.
---

# Improvements to Agentic Dev Environment

## Motivation

Fast and broad agentic edits do not map cleanly to standard Storybook/HMR workflows.

This causes repeated friction:

- Storybook can crash while agents are editing.
- Storybook can miss file updates in some runs.
- Storybook can stay stuck on stale cache.
- Frequent reloads reset manual tests while implementation is still in progress.
- Agents validate in a runtime that the user does not directly observe, causing "works on my machine" drift.

The project needs a shared, observable development runtime where user and agents can trust the same evidence.

## Solution

Create a standardized agentic development environment protocol that separates stable manual testing from fast live editing, and requires runtime evidence before claiming readiness.

The core idea is:

- one canonical way to run each environment,
- one shared way to inspect runtime health/logs,
- one consistent checklist for validation claims.

## Inclusions

- Standardized development commands for app, Storybook, fresh startup, and environment diagnostics.
- A two-lane workflow:
  - stable lane for uninterrupted manual testing
  - dev lane for rapid HMR edits
- File-backed runtime telemetry in a shared folder (logs, events, health snapshots).
- Shared terminal/session workflow (for example tmux) so user and agent observe the same live processes.
- Crash watchdog and auto-restart strategy for volatile dev servers.
- Proof-based readiness contract requiring objective runtime evidence.
- Documentation for daily usage and troubleshooting.

## Exclusions

- No simulator/gameplay feature work.
- No renderer behavior changes.
- No CI redesign in this pitch.
- No hard requirement to adopt one single container technology in this phase.

## Implementation Details

- Add canonical scripts for:
  - stable preview mode
  - HMR dev mode
  - fresh cache reset startup
  - runtime diagnostics
- Persist runtime outputs under a repository-local runtime folder (logs and health files).
- Define a "ready to test" evidence contract that includes:
  - command used
  - log path checked
  - health state observed
  - smoke artifact reference when available
- Provide operator docs so this flow is usable by both humans and agents across vendors.

## Missing Prerequisites

- None.

## Suggested follow ups

- Add automated smoke runs that attach screenshot/video/trace artifacts.
- Add a lightweight live status dashboard from runtime logs/health files.
- Add agent skills that enforce the proof contract by default.
- Expand this environment protocol to CI and remote execution contexts.

## Open Questions

- Which minimal runtime evidence set should be mandatory before saying "ready to test"?
- Which process supervisor/watchdog tool should be the default in this repository?
- Should runtime logs be kept as local-only artifacts or versioned in a dedicated debugging flow?
- Which part of this protocol should be enforced technically vs documented as team policy?
