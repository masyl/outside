# Improved Multi-Agents Track Management

## Motivation

Managing isolated development tracks has progressed, but is still a bit clunky and a little too slow.

Also, the containers setup relies on configs that are a little too specific to VS Code, which doesn't allow OpenAI Codex, or agents running other IDEs, to create tracks by themselves.

Finally, the track management relies on too much autonomy from the agents and not enough on predictable scripted commands and scripts.

## Solution

1. Remove the requirement to use VS Code DevContainers and make the container config more generic. Keep them usable as DevContainers if possible.
2. Move container management to OrbStack instead of Docker, to gain speed when booting up a new track.
3. Create better scripts to manage tracks by making them more granular and have better individual skill files for each.

## Inclusions

- Replacing Docker with OrbStack for container management
- Making dev container configuration IDE-agnostic
- Replacing autonomous agent track management with explicit scripted commands
- Updating track management skills (`manage-work-tracks`, etc.) to use the new scripts

## Exclusions

- Refactoring the entire CI/CD pipeline
- Changing the underlying branching strategy (still using `track/*`)

## Missing Prerequisites

- None

## Suggested follow ups

- Create detailed implementation plans for the new granular track management CLI scripts.
- Update all agent vendor configuration templates to utilize the newly defined generic container setup.

## Open Questions

- **OrbStack Integration:** ~~How exactly will OrbStack replace Docker in our current workflow? Are we using OrbStack's lightweight Linux machines or just its Docker drop-in replacement functionality?~~
  - _Answer:_ We will use OrbStack's lightweight Linux machines natively, bypassing Docker entirely, as the project needs to compile to Linux distributions anyway (for handhelds and web hosting).
- **DevContainer Compatibility:** ~~While making configs generic, do we still intend to support the `.devcontainer.json` standard for users who do want to use VS Code, or are we migrating to a completely custom script-based setup?~~
  - _Answer:_ We are not attached to maintaining DevContainers if they prevent optimal performance. We will prioritize the custom OrbStack machine setup.
- **CLI vs Skills:** For "predictable scripted commands", will we be writing a local CLI tool (e.g., in Node/Bash) that the skills simply call into, or will the scripts live entirely within the `.agent/skills` folder?
- **Cross-Platform:** Does the move to OrbStack limit development exclusively to macOS environments for human contributors as well? (OrbStack is macOS only).
  - _Downsides of OrbStack Machines to consider:_
    1. **macOS Lock-in:** OrbStack is currently exclusively available for macOS. If any contributor (human or agent) is running on Windows or native Linux, they will not be able to use OrbStack machines or the CLI scripts that depend on `orb`.
    2. **Loss of Ecosystem Tooling:** DevContainers come with a massive ecosystem of pre-built features (installing Node/Python, forwarding ports, setting up LSPs). With raw machines, we have to script all of this ourselves (e.g. bash scripts to install `nvm`, configure `pnpm`, etc.).
    3. **State Management:** Docker containers are ephemeral and declarative (built from a Dockerfile). OrbStack machines act more like persistent VMs. Unless we write robust provisioning scripts that destroy and recreate the machine every time, state (like old global packages or stray files) can accumulate and cause "works on my machine" bugs.

## Gains

- Ability to start a new track in seconds instead of minutes.
- Ability to start a new track from any agentic environment.
- Faster and more reliable behavior by agents when asking for track management tasks.
