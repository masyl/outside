#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { McpProxy } from "./proxy.js";
import { servers } from "./servers.config.js";

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
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
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
