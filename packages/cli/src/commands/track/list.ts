import { buildCommand, printResult } from "../Command.ts";
import { listMachines } from "../../core/orb.ts";

export const listCommand = buildCommand({
  name: "list",
  description: "List all tracks, showing their active statuses and components.",
  suggestions: {
    arguments: {},
    options: {}
  },
  action: async (options) => {
    // Non-interactive command just fetches the list once
    const machines = await listMachines();
    
    // Convert to a structured object indexed by track name
    const result = {
      tracks: machines.map(m => ({
        name: m.name,
        state: m.state,
        branch: m.branch,
        status: m.status,
        andon: m.andon
      }))
    };

    printResult(result, options, (data) => {
      // Very basic text format for the CLI (if run without --json)
      // The REPL UI handles beautiful formatting.
      const lines = data.tracks.map((t: any) => {
        return `[${t.state === 'ontrack' ? '+' : ' '}] ${t.name.padEnd(20)} | Branch: ${t.branch.padEnd(20)} | Status: ${t.status}`;
      });
      return lines.length > 0 ? lines.join("\n") : "No tracks found.";
    });
  }
});

// To allow running this command directly
if (import.meta.main) {
  await listCommand.parse(Deno.args);
}
