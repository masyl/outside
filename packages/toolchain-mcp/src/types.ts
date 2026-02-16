export interface RemoteServerConfig {
  /** Unique id used as namespace prefix for tools */
  id: string;
  /** Human-readable name */
  name: string;
  /** URL of the remote MCP server (Streamable HTTP) */
  url: string;
  /** Optional extra headers (e.g. for auth) */
  headers?: Record<string, string>;
  /** Whether to prefix tool names with `{id}/`. Default: true */
  namespaced?: boolean;
}

export interface ToolOrigin {
  serverId: string;
  originalName: string;
}
