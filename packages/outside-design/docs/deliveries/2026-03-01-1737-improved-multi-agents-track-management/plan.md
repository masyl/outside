# Implementation Plan: Improved Multi-Agents Track Management

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

We will replace the current VS Code DevContainers track management approach with a lightweight Deno 2 CLI tool (powered by Cliffy) that orchestrates native OrbStack Linux machines. This new tool will handle provisioning, port-forwarding, hostnames, and track teardown, and agent skills will be updated to interface directly with this CLI instead of relying on autonomous bash scripting.

## Architectural Principles

1. **Bare-Metal Performance**: Bypass Docker overhead by executing track environments directly within OrbStack Linux machines.
2. **Scripted Predictability**: Agent autonomy for environment setup is replaced by strictly defined Deno Cliffy CLI commands.
3. **Ephemeral Environments**: Tracks provision a machine on start and destroy it on close.
4. **Deno-Native tooling**: Utilizing Deno 2 and Cliffy for the orchestration tool.

## Phase 1: Deno 2 CLI Tool Creation

### Checklist

- [x] Initialize a new Deno Deno 2 project for the CLI tool (e.g., `packages/devside`).
- [x] Add `Cliffy` as a dependency for building the CLI interface.
- [x] Scaffold the basic CLI command structure (e.g., `track create`, `track destroy`, `track list`).

## Phase 2: OrbStack Orchestration & Caddy Routing

### Checklist

- [x] Implement `orb create` logic within the CLI to provision new lightweight Linux machines for a given track name.
- [x] Implement `orb delete` logic within the CLI to tear down track environments.
- [x] Implement local routing by creating a lightweight Docker container (attached to `outside-proxy` network) holding the standard `caddy_*` Docker labels (e.g. `doc.[track].outside.localhost`) that reverse proxies incoming traffic to the OrbStack machine's IP / hostname.

## Phase 3: Agent Skills Migration

### Checklist

- [x] Update `.agent/skills/manage-work-tracks/SKILL.md` to utilize the new Deno CLI tool instead of autonomous bash commands.
- [x] Update any other relevant skills that handled DevContainer logic.

## Phase 4: Cleanup & Documentation

### Checklist

- [x] Remove legacy `.devcontainer` configuration files from the repository if they are no longer needed.
- [x] Document the CLI usage instructions and the new flow in the `docs/` folder (could be within this delivery folder or a broader project README).

## Master Checklist

- [x] Create Deno Cliffy CLI package.
- [x] Implement track lifecycle commands (create/destroy).
- [x] Implement OrbStack integration and port-forwarding.
- [x] Update agent skills to use the CLI.
- [x] Remove DevContainer configs.

## Notes

- Will require testing on an environment with OrbStack installed.
- Ensure that the agent running the script has permissions to execute `orb` commands.
