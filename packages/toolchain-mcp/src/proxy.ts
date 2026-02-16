import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { RemoteServerConfig, ToolOrigin } from "./types.js";

export class RemoteConnection {
  readonly config: RemoteServerConfig;
  private client: Client;
  private connected = false;

  constructor(config: RemoteServerConfig) {
    this.config = config;
    this.client = new Client(
      { name: "toolchain-mcp", version: "0.1.0" },
      { capabilities: {} },
    );
  }

  async connect(): Promise<void> {
    const transport = new StreamableHTTPClientTransport(
      new URL(this.config.url),
      this.config.headers
        ? { requestInit: { headers: this.config.headers } }
        : undefined,
    );
    await this.client.connect(transport);
    this.connected = true;
    console.error(
      `[toolchain-mcp] Connected to ${this.config.name} (${this.config.url})`,
    );
  }

  async listTools(): Promise<{ name: string; [key: string]: unknown }[]> {
    if (!this.connected) return [];
    try {
      const result = await this.client.listTools();
      return result.tools as { name: string; [key: string]: unknown }[];
    } catch (err) {
      console.error(
        `[toolchain-mcp] Failed to list tools from ${this.config.name}:`,
        err,
      );
      return [];
    }
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    return this.client.callTool({ name, arguments: args });
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
    }
  }
}

export class McpProxy {
  private connections = new Map<string, RemoteConnection>();
  private toolMap = new Map<string, ToolOrigin>();

  constructor(private configs: RemoteServerConfig[]) {}

  async connectAll(): Promise<void> {
    const results = await Promise.allSettled(
      this.configs.map(async (config) => {
        const conn = new RemoteConnection(config);
        await conn.connect();
        this.connections.set(config.id, conn);
      }),
    );
    for (const [i, result] of results.entries()) {
      if (result.status === "rejected") {
        console.error(
          `[toolchain-mcp] Failed to connect to ${this.configs[i].name}:`,
          result.reason,
        );
      }
    }
  }

  async listTools(): Promise<unknown[]> {
    this.toolMap.clear();
    const allTools: unknown[] = [];

    for (const [serverId, conn] of this.connections) {
      const tools = await conn.listTools();
      const namespaced = conn.config.namespaced !== false;

      for (const tool of tools) {
        const originalName = tool.name;
        const exposedName = namespaced
          ? `${serverId}/${originalName}`
          : originalName;

        this.toolMap.set(exposedName, { serverId, originalName });
        allTools.push({ ...tool, name: exposedName });
      }
    }

    return allTools;
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const origin = this.toolMap.get(name);
    if (!origin) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    const conn = this.connections.get(origin.serverId);
    if (!conn) {
      return {
        content: [
          {
            type: "text",
            text: `Server ${origin.serverId} is not connected`,
          },
        ],
        isError: true,
      };
    }

    try {
      return await conn.callTool(origin.originalName, args);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[toolchain-mcp] Error calling ${name}:`, message);
      return {
        content: [
          {
            type: "text",
            text: `Error calling ${origin.originalName} on ${origin.serverId}: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async disconnectAll(): Promise<void> {
    for (const conn of this.connections.values()) {
      await conn.disconnect();
    }
  }
}
