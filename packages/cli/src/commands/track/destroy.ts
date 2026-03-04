import { buildCommand, printResult, emitProgress } from "../Command.ts";
import { destroyMachine, listMachines } from "../../core/orb.ts";
// Assuming we might eventually want to remove the worktree as well, 
// but for now mirroring the basic destroy of the Orb machine.

export const destroyCommand = buildCommand({
  name: "destroy",
  description: "Destroy a development track and its associated OrbStack machine.",
  suggestions: {
    arguments: {
      "track-name": [] // In a real implementation we'd read this dynamically or the REPL context would
    }
  },
  setup: (cmd) => {
    cmd.arguments("<track-name:string>");
  },
  action: async (options, trackName: string) => {
    emitProgress("destroy", 0, `Initiating destruction of track '${trackName}'...`);
    
    // First safely fetch if it exists
    const machines = await listMachines();
    const exists = machines.some(m => m.name === trackName);
    
    if (!exists) {
      throw new Error(`Track '${trackName}' does not exist or is already destroyed.`);
    }

    emitProgress("destroy", 50, `Destroying OrbStack machine for '${trackName}'...`);
    const destroyOk = await destroyMachine(trackName);

    if (!destroyOk) {
      throw new Error(`Failed to destroy OrbStack machine for track '${trackName}'`);
    }

    emitProgress("destroy", 100, `Track '${trackName}' destroyed successfully.`);
    printResult({ success: true, track: trackName }, options, (data) => `Track '${data.track}' was successfully destroyed.`);
  }
});

if (import.meta.main) {
  await destroyCommand.parse(Deno.args);
}
