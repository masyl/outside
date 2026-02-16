# Toolchain MCP Proxy Server

## Motivation

The project uses multiple AI agent vendors (Claude Code, Cursor, Codex, OpenCode, Gemini CLI), and each needs access to the same set of MCP servers (Context7, Browserbase, Smithery, etc.). Today, configuring MCP servers requires per-vendor setup — different file formats, different locations, different tooling. This is fragile: servers get misconfigured, forgotten, or only partially installed. Agents end up shelling out to CLI tools instead of using native MCP capabilities.

A single local MCP server that proxies to all remote MCPs eliminates this problem. Each vendor configures one server; the proxy handles the rest.

## Solution

Create a new monorepo package (`@outside/toolchain-mcp`) that runs as a local MCP server on stdio. It connects to remote MCP servers on startup, aggregates their tools under namespaced names, and routes tool calls to the correct remote server. Every AI agent vendor points to this one server.

## Inclusions

- New package `packages/toolchain-mcp` as an MCP server using the official TypeScript SDK
- Stdio transport for local agent communication
- Proxy connections to remote MCP servers via Streamable HTTP
- Tool namespacing (`context7/resolve-library-id`) to avoid collisions
- Typed configuration file for declaring remote servers
- Context7 as the first proxied server
- Graceful degradation when a remote server is unreachable

## Exclusions

- Smithery CLI integration (remains a separate skill, not proxied)
- Browserbase/Stagehand integration (future pitch, requires API key setup)
- Authentication/OAuth handling for remote servers (use simple API key headers for now)
- Auto-discovery of MCP servers from Smithery registry
- Hot-reload of server configuration without restart

## Implementation Details

Uses the low-level `Server` class from `@modelcontextprotocol/sdk` (not the high-level `McpServer`) because tool definitions are dynamic — they come from remote servers at runtime, not from static registrations.

## Missing Prerequisites

None.

## Suggested Follow Ups

- Add Browserbase/Stagehand MCP for live browser testing capabilities
- Add Smithery registry MCP for in-agent server discovery and installation
- Create a setup script that configures all vendors to point to this server
- Add tool list caching and lazy connections for faster startup
- Add a `sync-mcp-config` script (similar to `sync-skills`) that writes vendor configs

## Open Questions

None.
