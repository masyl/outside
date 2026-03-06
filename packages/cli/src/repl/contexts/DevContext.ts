import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class DevContext extends BaseContext {
  getContextCommands(): string[] {
    return [];
  }

  async getListData(routeParams: Record<string, string>): Promise<Record<string, string[]>> {
    const base = await super.getListData(routeParams);
    return { ...base, "Directories": ["tracks"] };
  }

  translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    return null;
  }
}
