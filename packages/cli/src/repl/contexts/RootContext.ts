import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class RootContext extends BaseContext {
  getContextCommands(): string[] {
    return [];
  }

  translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    return null;
  }
}
