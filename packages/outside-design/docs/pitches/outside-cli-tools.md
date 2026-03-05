# Outside CLI Tools

## Motivation

The current `devside` implementation has become difficult to maintain and does not provide a scalable foundation for future automation. We need a robust CLI and REPL to orchestrate both developer workflows (`dev` context) and running game networks (`mesh` context). This new CLI will provide a POSIX-style command structure, rich terminal UI via `ink`, and standalone, context-agnostic commands built with `cliffy` that can be utilized effectively by both humans and coding agents.

## Solution

Rewrite the CLI tool from scratch into a new `cli` package. The architecture will cleanly separate the interactive REPL (using `ink`) from the underlying execution of commands. Each command will be a standalone Deno script using `@cliffy/command`, returning structured JSON data. A central REPL will provide URL-style context routing (e.g., `Ȯ / dev / tracks / <track_name> / fix`), auto-completion, persistent command history, and real-time visual status updates based on the Andon factory-floor system.

## Inclusions

- New `cli` package structure.
- Standalone Deno CLI scripts for each command using `@cliffy/command`.
- Command metadata and help files for discovery.
- A rich REPL built with `ink` that provides auto-complete, shortcuts, lists, and context prompting.
- Context routing engine (`/dev/tracks/...`) mapping UI paths to underlying command executions.
- Support for interactive (REPL) and non-interactive (CLI with context path args) execution.
- POSIX standard argument parsing.
- Global support commands (`help`, `quit`, `json`, `text`, `raw`, `color`, `no-color`).
- Andon status polling and visualization for Track Management.
- Command history persistence (`.outside_cli_history`).
- Explicit TS Doc headers, strict typings, and single-responsibility module isolation.

## Exclusions

- Fixing or reusing the legacy `devops/packages/devside` implementation (used only for reference).
- Global summary states (e.g., `ontrack`, `offtrack`, `stopped`); explicitly replaced by granular Andon status lights.
- Full implementation of the `mesh` management commands (only the routing structure for `dev` and foundational worktree functions are in scope for the initial rewrite).

## Implementation Details

- Build using `Deno 2`.
- REPL UI created with the `vadimdemedes/ink` React-based terminal rendering library.
- Individual scripts use `@cliffy/command` and export their functionality cleanly.
- Global constants/structs moved to configuration files or global scopes instead of being locally defined.
- Complete departure from manual UI rendering in favor of the `ink` ecosystem.

## Missing Prerequisites

- Basic `ink` library validation in Deno 2 environment (if not already verified).

## Suggested follow ups

- Implement `mesh` context commands (entities, performance).
- Expose the CLI commands as discrete MCP skills or through direct agent toolchains.
- Add real-time live polling to the Andon lights instead of relying on static polling runs.

## Open Questions

## Open Questions

- **The `cliffy` vs. `ink` Boundary**: If the user executes `track list` interactively in the REPL (via `ink`) vs non-interactively on the terminal (via `cliffy`), does the REPL literally spawn the CLI command as a `Deno.Command.spawn` child process and stream its JSON output, or does the REPL just import the exact same underlying logic functions (e.g. `listTracks()`) that the Cliffy command wraps?
  - The goal is to keep the REPL/Shell/CLI as a thin wrapper around POSIX style commands.
  - The REPL/Shell/CLI should not be aware of the internal implementation of the commands.
  - The individual commands should not be aware of how it is being used/orchestrated.
  - While the native deno import approach is tempting, it would not encourage a "linus" style composability where commands can be used in any context.
  - Coding Agents should be able to use the commands directly, without the REPL/Shell/CLI.
  - This also means that we could eventually map commands that have not been designed specifically to run in Outside CLI.

- **Context Routing & Autocomplete State**: In an interactive prompt, autocomplete suggestions heavily depend on the context. If the individual commands are entirely decoupled from routing, how should the REPL look up dynamic suggestions? Should each standalone command export a metadata payload defining how to fetch its autocomplete suggestions, or does the REPL maintain its own "knowledge base" of contexts?
  - First, each commands should answer to a generic help request with a JSON payload describing its arguments and options.
  - Second, each commands should answer to a generic "suggest" request with a JSON payload listing suggested values for each arguments.
  - Each context should also be configures to pre-fetch the list of available sub-contexts entities. This part is defined in the context itself.
  - The REPL/Shell/CLI should use this information to provide autocomplete suggestions.

- **Andon System Component Source of Truth**: For a snappy `ink` UI that doesn't block, should we have a unified polling system running continuously in the background of the REPL (e.g., every 5 seconds) and updating a cached React state, or should we only query the systems using `Deno.Command.spawn` right when the user requests a refresh or enters a context?
  - This is a great idea.
  - The polling should start only on-demand, and have a expiration if not polled for a certain amount of time.
  - Use the "blue" color to indicate that the polling is active.
  - The REPL/Shell/CLI should always use the Andon API to get the status of the components in a non-blocking way.
  - The Andon API does not have to be a CLI command. It can be a service that is called by the CLI.

- **Configuration and "Global Constants"**: Where should configuration files live? Should we rely on an `.outside-cli-config.json` at the root of the project, or should we export a TypeScript configuration singleton inside `packages/cli/src/config/`?
  - The configuration should be stored in a file named `.outside-cli-config.json` in the root of the project.
  - The configuration should be in JSON format.

- **Standard Output Interception in the REPL**: If a standalone CLI command takes a while to run and writes to `stdout` or `stderr`, should `ink` transition into a "fullscreen stream" view to pipe the raw output of the subprocess, or should the commands emit structured JSON progress events (`{ phase: "Creating branch", progress: 50 }`) that the REPL parses and renders into a React progress bar?
  - The commands should emit structured JSON progress events (`{ phase: "Creating branch", progress: 50 }`) that the REPL parses and renders into a React progress bar.
  - The REPL should indeed be in full screen mode to better handle the output of the commands and simultaneous polling and progress events.
  - Place the prompt and context bar at the bottom of the screen.
