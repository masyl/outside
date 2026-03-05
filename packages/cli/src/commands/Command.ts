import { Command } from "jsr:@cliffy/command@^1.0.0";
import * as colors from "jsr:@std/fmt@1/colors";

/**
 * Metadata for autocomplete suggestions.
 */
export interface CommandSuggestions {
  arguments?: Record<string, string[]>;
  options?: Record<string, string[]>;
}

/**
 * Common configuration for Outside CLI commands.
 */
export interface OutsideCommandConfig {
  name: string;
  description: string;
  suggestions?: CommandSuggestions;
  setup?: (cmd: any) => void;
  action: (options: any, ...args: any[]) => Promise<void> | void;
}

/**
 * Wraps a Cliffy Command to inject generic JSON flags and standardization.
 */
export function buildCommand(config: OutsideCommandConfig): Command<any> {
  const cmd = new Command()
    .name(config.name)
    .description(config.description)
    .globalOption("--json", "Output results in structured JSON format.")
    .globalOption("--help-json", "Output command metadata and help in JSON format.", {
      action: () => {
        printHelpJson(cmd);
        Deno.exit(0);
      }
    })
    .globalOption("--suggest-json", "Output autocomplete suggestions in JSON format.", {
      action: () => {
        console.log(JSON.stringify(config.suggestions || {}, null, 2));
        Deno.exit(0);
      }
    })
    .action(async (options: any, ...args: any[]) => {
      try {
        await config.action(options, ...args);
      } catch (error: any) {
        if (options.json) {
           console.log(JSON.stringify({ error: error.message }, null, 2));
        } else {
           console.error(colors.red(`Error: ${error.message}`));
        }
        Deno.exit(1);
      }
    });

  if (config.setup) {
    config.setup(cmd as any);
  }

  return cmd as any;
}

function printHelpJson(cmd: any) {
  const payload = {
    name: cmd.getName(),
    description: cmd.getDescription(),
    arguments: cmd.getArguments().map((arg: any) => ({
      name: arg.name,
      optional: arg.optional,
      variadic: arg.variadic
    })),
    options: cmd.getOptions(false).map((opt: any) => ({
      name: opt.name,
      aliases: opt.aliases,
      description: opt.description,
      type: opt.type,
      required: !!opt.required
    }))
  };
  console.log(JSON.stringify(payload, null, 2));
}

/**
 * Utility to print results considering the --json flag.
 */
export function printResult(data: any, options: any, formatText?: (data: any) => string) {
  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    if (formatText) {
      console.log(formatText(data));
    } else {
      console.dir(data, { depth: null });
    }
  }
}

/**
 * Utility to emit structured progress events.
 */
export function emitProgress(phase: string, progress: number, message?: string) {
  console.log(JSON.stringify({ type: "progress", phase, progress, message }));
}
