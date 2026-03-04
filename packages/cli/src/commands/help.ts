import { buildCommand, printResult } from "./Command.ts";

export const helpCommand = buildCommand({
  name: "help",
  description: "Display help information for the interactive REPL and available commands.",
  suggestions: {
    arguments: {},
    options: {}
  },
  action: async (options) => {
    // In a full implementation, we could dynamically load routers or context to show relevant help.
    // For now, we return static help text.
    const helpText = `
Outside CLI REPL Help

Available Contexts:
  /               - Root context
  /track          - Track management context
  /track/:name    - Specific track context

Available Global Commands:
  track           - Manage development tracks (list, create, destroy)
  help            - Show this help message
  clear           - Clear the screen
  quit / exit     - Exit the REPL

Navigation:
  cd <path>       - Change context 
  cd ..           - Go up one level

Use Tab for autocompletion and Up/Down arrows for command history.
`;
    printResult({ text: helpText }, options, () => helpText.trim());
  }
});

if (import.meta.main) {
  await helpCommand.parse(Deno.args);
}
