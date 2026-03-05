# Implementation Plan: Outside CLI Tools Rewrite

## Related Files

- **Pitch**: [outside-cli-tools.md](../../pitches/outside-cli-tools.md)
- **Requirements**: [devside_requirements.md](../../../../../.tracks/devops/packages/devside/devside_requirements.md)

## Overview

We will rewrite the orchestration tool into a new `cli` package using `Deno 2`. The new architecture separates standalone CLI commands (built with `cliffy`) from a React-based rich terminal REPL (built with `ink`). This enables URL-style context routing and non-interactive data extraction via JSON while providing an excellent developer experience.

## Architectural Principles

1. **Decoupled Commands**: Every command is a standalone script built with `cliffy`. They act as pure POSIX commands, independent of the REPL wrapper. They must be usable directly by agents or other scripts.
2. **Structured Outputs & Reflection**: Commands return structured JSON for execution, and can also emit JSON payloads describing their arguments and autocomplete suggestions (`--help-json`, `--suggest-json`).
3. **Rich REPL UI**: Built with `ink` in full-screen mode to handle complex layouts (progress bars, polling). The prompt and context bar stay at the bottom of the screen.
4. **Context Routing**: The REPL uses pattern matching to map user locations (e.g., `Ȯ / dev / tracks / <track_name> / fix`) into the correct command scripts. Contexts pre-fetch sub-entities for autocomplete.
5. **Non-Blocking Execution & Progress**: Use `Deno.Command.spawn` for executing commands. Long-running commands emit JSON progress events (`{ phase: "...", progress: 50 }`) which the REPL renders as progress bars.
6. **Andon Service**: Andon polling is handled as an independent on-demand background service, not a CLI command. Polling has an expiration and a dedicated visual state (blue).
7. **Configuration**: Global settings are stored in `.outside-cli-config.json` at the repository root.

## Pre-Requisites

### Checklist

- [ ] Create `.tracks/devops/packages/cli` directory.
- [ ] Initialize `deno.json` setting up Deno 2, adding `ink`, `react`, and `cliffy` dependencies.
- [ ] Create `.outside-cli-config.json` template at the repository root.

## Phase 1: Core Command Architecture

### Checklist

- [ ] Create command metadata and unified execution interface `packages/cli/src/commands/Command.ts`.
- [ ] Implement foundational global commands (`help`, `quit`, `json`, `text`, `raw`, `color`, `no-color`).
- [ ] Implement `track create`, `track destroy`, and `track list` standalone scripts.
- [ ] Implement hidden track-specific commands (`track-fix-worktree`, `track-fix-branch`, `track-status`).
- [ ] Extract Git, Docker, and OrbStack integrations from the old implementation into robust modules inside `packages/cli/src/core/`.

## Phase 2: REPL & Context Routing Engine

### Checklist

- [ ] Implement the base full-screen `ink` REPL loop (`packages/cli/src/repl/Repl.tsx`) with bottom prompt.
- [ ] Build the Context Router to map paths and pre-fetch sub-context autocomplete definitions.
- [ ] Implement autocomplete, suggestion cycling, and visual prompt elements.
- [ ] Implement command execution via `Deno.Command.spawn` capable of parsing JSON progress events into progress bars.
- [ ] Implement `Alt`/shortcut keyboard interactions intercepting standard terminal signals.
- [ ] Integrate command history file `.outside_cli_history`.

## Phase 3: Andon Health Status System

### Checklist

- [ ] Implement the independent Andon polling service (`packages/cli/src/andon/Service.ts`) with on-demand polling and expiration.
- [ ] Build the `ink` rendering components for Andon status lights (`Tr`, `Co`, `Br`, `Wt`, `Pr`), including the blue 'polling' state.
- [ ] Integrate granular status requests into the `list` and `status` REPL contexts using the background service.

## Master Checklist

- [ ] Pre-Requisites
- [ ] Phase 1: Core Command Architecture
- [ ] Phase 2: REPL & Context Routing Engine
- [ ] Phase 3: Andon Health Status System

## Verification Plan

### Automated Tests

- Write Deno unit tests for the Context Router (`packages/cli/src/repl/Router_test.ts`) asserting it maps `dev / tracks / xyz / fix` to the correct command execution payload.
- Run `deno test` across the package to ensure basic CLI parameter parsing behaves properly.

### Manual Verification

- Run `deno run -A --unstable-react packages/cli/main.tsx` to test the basic `ink` startup.
- Navigate the context tree using arrow keys and `.`, `..`, `/` shortcuts within the TUI.
- Execute `track list` within the REPL and verify Andon lights appear without rendering glitches.
- Run a CLI command non-interactively (e.g. `deno run -A packages/cli/bin.ts dev/tracks/my-track/fix worktree`) and verify JSON output format.
