# Outside CLI Tools

This document outlines the requirements for rewriting the current `devside` implementation into a proper CLI tool.

## 1. Core Goal

Provide an orchestration CLI and REPL (`devside`) for the Outside project.

It pools together a rich set of POSIX style commands that can be used both by developers and coding agents to automate tasks with speed and minimal friction.

The commands covers two main contexts:

- dev: the development lifecycle of the project.
- mesh: interaction with a running Outside mesh network.

## Commands Structure

Commands are built as individual deno scripts that provide enough metadata to be discovered and then proxied through the common CLI and REPL. The commands are not called directly by their internal names, but rather through proxy commands that are mapped by the CLI/REPL.

By default the commands return structured data (JSON) which is handled by the CLI/REPL to either show a rich terminal UI, raw text or JSON itself.

Each command can also output it's metadata as JSON for discovery and a Skill description for instructing coding agents.

## Interactive Shell (aka REPL)

When run without arguments, the CLI starts an interactive Shell (REPL) that provides a rich terminal UI with interactive prompting, shortcut keystrokes, selecting items, autonomplete, hints,live progress, tables, trees, status indicators, etc.

It is not based on a windowed TUI layout, but rather a CLI with an augmented user experience.

```shell
Ȯ \ dev \ tracks (3)

› stat█ us

Commands: [l] list • [s] status • [f] fix • [h] help
Contexts: [1] devops • [2] documentation • [3] physics-update
```

## Context routing

Context routing provides a URL styles path syntax to make the navigation faster and less repetitive.

For example, the following path is in the "Fix" context of the "devops" track:

```
Ȯ \ dev \ tracks (3) \ devops \ fix
```

This implies that the autocomplete, keystrokes, available commands, help and input parameters for commands are predicted by this context.

Simply typing the `worktree` command would internally call up the command to fix the worktree with the appropriate arguments for the current track name.

```bash
container devops fix worktree
```

### Navigating the context tree

Navigating the context tree can be done using the following methods:

- Using the `..` key to go up one level.
- Using the `/` key to go to the root context.
- Typing an absolute path to navigate to a specific context.
- Typing the name of a sub context to navigate to.

The individual commands themselves are not "context aware", but the CLI manages the context and passes the relevant arguments to the commands.

### Persistent Command History

The CLI maintains a persistent command history of the last 20 commands executed, stored in a file named `.outside_cli_history` in the user's home directory.

It also stores the last context used and will return to it when the CLI is started again.

## Available contexts

At the moment, the available context routes are:

- **root**: The root context. It has only a "dev" sub context at the moment.
  - `Ȯ`
- **dev**: The development context. It has a "tracks" sub context.
  - `Ȯ / dev`
- **tracks**: The tracks context. It has a "<track_name>" sub context for each track.
  - `Ȯ / dev / tracks`
- **track**: A single track selected.
  - `Ȯ / dev / tracks / <track_name>`
- **fix**: Focus on fixing track issues, such as missing worktree, proxy container down, etc.
  - `Ȯ / dev / tracks / <track_name> / fix`

Eventually, the following contexts will be available:

- **worktree**:
  - `Ȯ / dev / tracks / <track_name> / worktree`
  - `Ȯ / dev / tracks / <track_name> / worktree / <worktree_name>`

- **mesh** management:
  - `Ȯ / mesh / [3E6D8A]`
  - `Ȯ / mesh / [3E6D8A] / entities (117) / chickens / 16`
  - `Ȯ / mesh / [3E6D8A] / perf`

## Track Management

One of the main task of this CLI is to manage multiple isolated environments called tracks. These tracks are isolated development workspaces that is focused on collaboration between a developer and a coding agent. The tooling is

A **Track** is defined by a unique `name` and combines three primary infrastructure components:

1. **Git Worktree**: Kept at `.tracks/<name>`. Uses a branch naming convention `track/<name>` or `track/<name>/*`.
2. **OrbStack Machine**: A native OrbStack Ubuntu Linux environment named `<name>`, used as the actual development/compute backend.
3. **Proxy Container**: A Docker container named `outside-proxy-<name>` attached to the `outside-proxy` network. It runs an idle process (`sleep infinity`) and uses labels to expose the OrbStack machine's ports to a Caddy router on the host network.
   - Example routing: `storybook.<name>.outside.localhost` -> `<name>.orb.local:6007`
   - Example routing: `doc.<name>.outside.localhost` -> `<name>.orb.local:5173`

## Track managementCommands

The CLI features a hierarchy of commands that can be invoked directly or via an interactive REPL context:

- **`create <name>`**: Provisions a new sequence. Creates the git worktree (and base branch if missing), spins up the OrbStack machine, and initializes the Proxy container.
- **`destroy <name>`**: Tears down a track environment by destroying the Proxy container and the OrbStack machine. (Note: Does not currently appear to clean up the git worktree).
- **`list`**: Shows a tabular overview of all tracks (based on existing OrbStack machines), displaying their names, current branch, overall status using "Andon" component status.

### Hidden / Contextual Commands

- **`track-status <name>`**: Shows the expanded Andon dashboard for the provided track, explaining the state of all components.
- **`track-fix-worktree <name>`**: Automatically recreates/repairs the local git worktree `tracks/<name>` if it's missing but a branch exists. Prompts the user if multiple track branches exist.
- **`track-fix-branch <name>`**: Checks out the correct `track/<name>` branch within an existing worktree.

### Keyboard interactions

The REPL have the follwoing behaviors:

- Pressing the up key will cycle through the command history.
- Pressing the down key will cycle through the available commands for that context, then cycle through the availablesub contexts.
- Pressing tab or left arrow forwards through the offered auto-complete suggestions.
- Pressing the escape key resets the prompt to a neutral state.
- Holding the "alt" key allows you to type shortcut keys and numbers for instant navigation or command execution. Every command has a shortcut key associated with it.

### Global commands:

- **`help` or `h`**: Prints helpful information mapped to the current hierarchical context.
- **`quit` or `q`**: Exits the REPL.
- **`json`**: Enable JSON output for commands.
- **`text`**: Disable JSON output for commands.
- **`raw`**: Disable JSON output for commands.
- **`color`**: Enable color output for commands.
- **`no-color`**: Disable color output for commands.

## Andon Status Codes and Health Monitoring

One major challenge of the Outdoor project and is that it is composes of a lage number of loosly coupled components that are different in nature and they all must be operationally healthy to allow the user to maintain velocity.

To address this challenge, the CLI proactivelly monitors the health of all components in the current context and provides clear statuses and visual feedback to the user.

Based on the concept of the Andon factory floor system, each component is represented by a status light (Green, Yellow, Red, Blue), and a two letter code that is used to identify the component.

Currently, the Andon lights do not show a live status, but instead show the status of the last poll. And a custom status message is displayed to explain the state of the component.

### Example of Andon lights

- **Pr (Proxy)**: Network proxying container state.
- **Tr (Track)**: Combined status of the container, branch, worktree, etc.
- **Co (Container)**: Container machine state (OrbStack).
- **Br (Branch)**: Presence of an appropriate `track/<name>` matching branch.
- **Wt (Worktree)**: A proper worktree is configured for the track.

## Concepts to abandon

- The global states such as: ontrack, offtrack, stopped.

## Concepts to clarify

- list [l]: Will list of available entities in the current context.
- select [s]: Will show a selection list of available entities in the current context.
- status [s]: Will poll the relevant components and show the Andon lights. Either as one light per row when in the context of a single track, or as a compact series of lights when in the context of multiple tracks.
