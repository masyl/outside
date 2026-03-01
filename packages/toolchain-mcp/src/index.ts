#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { McpProxy } from "./proxy.js";
import { servers } from "./servers.config.js";
import { GITHUB_TOOLS, handleGithubTool } from "./github-tools.js";
import { existsSync } from "fs";
import { join, dirname } from "path";

// Try to find the root directory where .env.local lives, looking up to 3 levels up
let rootDir = process.cwd();
for (let i = 0; i < 3; i++) {
  if (existsSync(join(rootDir, '.env')) || existsSync(join(rootDir, '.env.local'))) {
    break;
  }
  rootDir = dirname(rootDir);
}
if (existsSync(join(rootDir, '.env.local'))) {
  process.loadEnvFile(join(rootDir, '.env.local'));
} else if (existsSync(join(rootDir, '.env'))) {
  process.loadEnvFile(join(rootDir, '.env'));
}

async function main() {
  console.error("[toolchain-mcp] Starting proxy server...");

  const proxy = new McpProxy(servers);
  await proxy.connectAll();

  const server = new Server(
    { name: "toolchain-mcp", version: "0.1.0" },
    { capabilities: { tools: { listChanged: false } } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = await proxy.listTools();
    return { tools: [...tools, ...GITHUB_TOOLS] };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (GITHUB_TOOLS.some(t => t.name === name)) {
      return await handleGithubTool(name, args);
    }

    return (await proxy.callTool(name, args ?? {})) as {
      content: { type: string; text: string }[];
      isError?: boolean;
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[toolchain-mcp] Proxy server running on stdio");

  process.on("SIGINT", async () => {
    console.error("[toolchain-mcp] Shutting down...");
    await proxy.disconnectAll();
    await server.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[toolchain-mcp] Fatal error:", err);
  process.exit(1);
});
