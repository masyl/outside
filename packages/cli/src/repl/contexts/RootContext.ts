import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class RootContext extends BaseContext {
  getContextCommands(): string[] {
    return [];
  }

  async getListData(routeParams: Record<string, string>): Promise<Record<string, string[]>> {
    const base = await super.getListData(routeParams);
    return { ...base, "Directories": ["dev", "mesh"] };
  }

  translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    return null;
  }
}
