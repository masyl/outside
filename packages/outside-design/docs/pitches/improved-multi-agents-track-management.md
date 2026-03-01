# Improved Multi-Agents Track Management

## Motivation

Managing isolated development tracks has progressed, but is still a bit clunky and a little too slow.

Also, the containers setup relies on configs that are a little too specific to VS Code, which doesn't allow OpenAI Codex, or agents running other IDEs, to create tracks by themselves.

Finally, the track management relies on too much autonomy from the agents and not enough on predictable scripted commands and scripts.

## Solution

1. Remove the requirement to use VS Code DevContainers, bypassing Docker entirely, and make the track environment setup natively utilize OrbStack's lightweight Linux machines for maximum performance.
2. Build a basic local CLI tool (using Deno 2) for track management. The project `/skills` files will be updated to call into this CLI tool to ensure predictable and scripted environment controls.
3. Manage port forwarding and track-specific hostnames through our existing setup instead of relying on the DevContainer ecosystem.
4. Track lifecycles will provision the OrbStack machine at the beginning of the track and dispose of it at the end, ensuring environments remain short-lived and clean.

## Inclusions

- Replacing Docker DevContainers with native OrbStack Linux machines for track management.
- Creating a Deno 2 CLI tool for predictable track lifecycle scripts.
- Replacing autonomous agent track management with explicit scripted CLI commands.
- Updating track management skills (`manage-work-tracks`, etc.) to use the new scripts.
- Porting over existing port-forwarding and hostname configurations for the track environments.

## Exclusions

- Refactoring the entire CI/CD pipeline
- Changing the underlying branching strategy (still using `track/*`)
- Supporting Windows or native Linux human contributors in this initial iteration (support will be added later once the CLI is stable).

## Missing Prerequisites

- None

## Suggested follow ups

- Better documentation on the track management appraoch (the flow, trunk based inspirations, skills, the CLI tool, etc.)

## Gains

- Ability to start a new track in seconds instead of minutes.
- Ability to start a new track from any agentic environment.
- Faster and more reliable behavior by agents when asking for track management tasks.
