import { Command } from '@cliffy/command';
import { Input } from '@cliffy/prompt';
import { Table } from '@cliffy/table';
import { colors } from '@cliffy/ansi/colors';
import { createMachine, destroyMachine, listMachines } from './orb.ts';
import { createTrackProxy, destroyTrackProxy } from './docker.ts';

declare global {
  var __DEVSIDE_REPL_ACTIVE__: boolean | undefined;
}

function buildApp() {
  const createCommand = new Command()
    .description('Create a new native OrbStack tracking environment for a track')
    .arguments('<name:string>')
    .action(async (_options: void | Record<string, unknown>, name: string) => {
      console.log(`Creating track environment for '${name}'...`);
      const success = await createMachine(name);
      if (!success) {
        throw new Error(`Failed to create machine '${name}'`);
      }
      const proxySuccess = await createTrackProxy(name);
      if (!proxySuccess) {
        throw new Error(`Failed to create proxy container for '${name}'`);
      }
      console.log(`Track environment '${name}' created successfully.`);
    });

  const destroyCommand = new Command()
    .description('Destroy the native OrbStack tracking environment for a track')
    .arguments('<name:string>')
    .action(async (_options: void | Record<string, unknown>, name: string) => {
      console.log(`Destroying track environment for '${name}'...`);
      
      // Destroy proxy first
      await destroyTrackProxy(name);

      const success = await destroyMachine(name);
      if (!success) {
        throw new Error(`Failed to destroy machine '${name}'`);
      }
      console.log(`Track environment '${name}' destroyed successfully.`);
    });

  const listCommand = new Command()
    .description('List all active native OrbStack track environments')
    .action(async () => {
      console.log('Listing active track environments...');
      const machines = await listMachines();
      
      const table = new Table()
        .header(['State', 'Name', 'Branch', 'Status'])
        .body(
          machines.map((m) => {
            let stateStr = m.state;
            if (m.state === 'ontrack') stateStr = colors.green(m.state);
            else if (m.state === 'offtrack') stateStr = colors.yellow(m.state);
            else if (m.state === 'stopped') stateStr = colors.gray(m.state);

            return [stateStr, m.name, m.branch, m.status];
          })
        )
        .padding(2)
        .border(true);
      table.render();
    });

  const trackCommand = new Command()
    .description('Manage development tracks (provisioning, destruction, Caddy routing)')
    .action(function (this: Command) {
      this.showHelp();
    })
    .command('create', createCommand)
    .command('destroy', destroyCommand)
    .command('list', listCommand);

  return new Command()
    .name('devside')
    .version('0.1.0')
    .description('Outside project orchestration CLI')
    .noExit()
    .action(async function (this: Command) {
      if (!globalThis.__DEVSIDE_REPL_ACTIVE__) {
        await runRepl();
      } else {
        this.showHelp();
      }
    })
    .command('track', trackCommand);
}

async function runRepl() {
  globalThis.__DEVSIDE_REPL_ACTIVE__ = true;
  console.log("Welcome to the devside REPL! Type 'exit' to quit or 'help' for commands.");
  
  while (true) {
    let input: string;
    try {
      input = await Input.prompt({
        message: 'devside>',
        suggestions: ['track create', 'track destroy', 'track list', 'help', 'exit']
      });
    } catch (e) {
      // User likely pressed Ctrl+C or similar
      console.log();
      break;
    }

    const trimmed = input.trim();
    if (!trimmed) continue;
    if (trimmed === 'exit' || trimmed === 'quit') break;

    const args = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(arg => {
        return arg.startsWith('"') && arg.endsWith('"') ? arg.slice(1, -1) : arg;
    }) || [];
    
    try {
      await buildApp().parse(args);
    } catch (error: any) {
      // Ignore ValidationError "Unknown command" if user explicitly tries to get help and fails, 
      // but log it otherwise to give feedback in REPL instead of exiting.
      if (error.message) {
        console.error(`Error: ${error.message}`);
      }
    }
  }
}

// Main CLI
if (import.meta.main) {
  try {
    await buildApp().parse(Deno.args);
  } catch (error: any) {
    if (error.message) {
      console.error(`Error: ${error.message}`);
    }
    Deno.exit(1);
  }
}
