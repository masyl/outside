# Local MCP Server for Project DevOps

## Motivation

AI agents working on this project must rebuild their understanding of the development environment from scratch at the start of each session: which tracks are active, what services are running, what the build state is, what deliveries exist. This exploration takes time and can miss things. A local MCP server would give agents a structured, always-available interface to the project's devops state — making them faster to orient and more reliable in their actions.

## Solution

A new monorepo package `packages/outside-mcp` implements a Model Context Protocol server that runs locally via stdio transport. AI tools (Claude Code, OpenCode, Cursor, Codex) spawn it as a subprocess and call its tools directly. It exposes read-only status queries and controlled command execution for the four most useful devops surfaces: track/worktree status, running service detection, turbo command execution, and delivery browsing.

## Inclusions

- New package `packages/outside-mcp` with TypeScript build (`tsc`, NodeNext modules)
- **Tool: `list_worktrees`** — parse `git worktree list`, identify `track/*` branches, surface linked delivery and its status
- **Tool: `get_track_status`** — ahead/behind count vs main, dirty file count, linked delivery summary for a given branch
- **Tool: `list_deliveries`** — list all delivery folders with frontmatter metadata (title, status, date, branch)
- **Tool: `read_delivery`** — return concatenated markdown content of a delivery folder (pitch, plan, roadmap, delivered)
- **Tool: `list_services`** — return all monorepo packages with their dev command and known port
- **Tool: `check_service_health`** — for each service, report whether its port is currently occupied (via `lsof`)
- **Tool: `run_turbo`** — run `pnpm turbo run <task> [--filter=pkg]` with a timeout; supports `build`, `test`, `lint`, `clean` (excludes `dev`)
- Config entries for all AI tools: `.mcp.json` (Claude Code), `opencode.jsonc` addition (OpenCode), `.cursor/mcp.json` (Cursor)

## Exclusions

- No `dev` command execution (persistent processes not suitable for MCP tools)
- No CI/CD pipeline integration (no CI exists yet in this project)
- No write operations to delivery documents (agents already have file system access)
- No real-time log streaming from running services
- No authentication or remote access — local stdio transport only

## Implementation Details

Dependencies: `@modelcontextprotocol/sdk` (official TypeScript SDK) and `gray-matter` (YAML frontmatter parsing). No `@outside/*` runtime dependencies — this package is a standalone devops tool.

Port detection uses `lsof -i :PORT -t`. Service port registry is derived from vite configs and known package settings at build time.

## Missing Prerequisites

None — this is a standalone tooling package with no dependencies on game runtime packages.

## Suggested Follow Ups

- Add a `run_dev` tool once a safe async process management pattern is established
- CI/CD status tool once GitHub Actions are configured
- Pitch index search tool (query pitches by keyword/status)

## Open Questions

- Should `run_turbo` stream output progressively or return it all at once on completion? (Streaming requires SSE transport instead of stdio)
- Which exact ports do `outside-client`, `outside-server`, and `outside-design` use in dev mode? (To be confirmed during implementation by reading vite configs)
