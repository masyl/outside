import { buildCommand, printResult, emitProgress } from "../Command.ts";
import { createMachine } from "../../core/orb.ts";
import { createTrackWorktree } from "../../core/git.ts";
import { createTrackProxy } from "../../core/docker.ts";

export const createCommand = buildCommand({
  name: "create",
  description: "Create a new development track, spinning up a worktree, OrbStack machine, and Docker proxy.",
  suggestions: {
    arguments: {
      "track-name": [] // In the future, could suggest from Jira/Linear integration
    },
    options: {}
  },
  setup: (cmd) => {
    cmd.arguments("<track-name:string>");
  },
  action: async (options, trackName: string) => {
    emitProgress("create", 0, `Initializing track creation for '${trackName}'...`);
    
    emitProgress("create", 10, `Setting up git worktree for '${trackName}'...`);
    const worktreeOk = await createTrackWorktree(trackName);
    if (!worktreeOk) {
      throw new Error(`Failed to create worktree for track '${trackName}'`);
    }

    emitProgress("create", 40, `Setting up OrbStack machine for '${trackName}'...`);
    const orbOk = await createMachine(trackName);
    if (!orbOk) {
      throw new Error(`Failed to create OrbStack machine for track '${trackName}'`);
    }

    emitProgress("create", 70, `Starting Docker proxy for '${trackName}'...`);
    const proxyOk = await createTrackProxy(trackName);
    if (!proxyOk) {
      throw new Error(`Failed to start Docker proxy for track '${trackName}'`);
    }

    emitProgress("create", 100, `Track '${trackName}' created successfully.`);
    printResult({ success: true, track: trackName }, options, (data) => `Track '${data.track}' is fully operational.`);
  }
});

if (import.meta.main) {
  await createCommand.parse(Deno.args);
}
