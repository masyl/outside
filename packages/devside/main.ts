import { Command } from '@cliffy/command';
import { Input } from '@cliffy/prompt';
import { Table } from '@cliffy/table';
import { colors } from '@cliffy/ansi/colors';
import { createMachine, destroyMachine, listMachines } from './orb.ts';
import { createTrackProxy, destroyTrackProxy } from './docker.ts';
import { createTrackWorktree, fixWorktree, fixBranch } from './git.ts';

declare global {
  var __DEVSIDE_REPL_ACTIVE__: boolean | undefined;
}

function buildApp() {
  const createCommand = new Command()
    .description('Create a new native OrbStack tracking environment for a track')
    .arguments('<name:string>')
    .action(async (_options: void | Record<string, unknown>, name: string) => {
      console.log(`Setting up git worktree and branch for '${name}'...`);
      const gitSuccess = await createTrackWorktree(name);
      if (!gitSuccess) {
        throw new Error(`Failed to create git worktree for '${name}'`);
      }

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
      
      function formatAndon(label: string, color: string): string {
        switch (color) {
          case 'red': return colors.bgRed.white(` ${label} `);
          case 'green': return colors.bgGreen.white(` ${label} `);
          case 'yellow': return colors.bgYellow.black(` ${label} `);
          case 'blue': return colors.bgBlue.white(` ${label} `);
          default: return ` ${label} `;
        }
      }

      const table = new Table()
        .header(['Name', 'Andon', 'Branch', 'Status'])
        .body(
          machines.map((m) => {
            const andonStr = [
              formatAndon('Tr', m.andon.tr),
              formatAndon('Co', m.andon.co),
              formatAndon('Br', m.andon.br),
              formatAndon('Wt', m.andon.wt),
            ].join(' ');

            return [m.name, andonStr, m.branch, m.status];
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

  const trackStatusCommand = new Command()
    .description('Hidden contextual status command')
    .arguments('<name:string>')
    .hidden()
    .action(async (_options: void | Record<string, unknown>, name: string) => {
      const machines = await listMachines();
      const m = machines.find(x => x.name === name);
      if (!m) {
        console.log(`Track '${name}' not found.`);
        return;
      }

      function formatAndon(label: string, color: string): string {
        switch (color) {
          case 'red': return colors.bgRed.white(` ${label} `);
          case 'green': return colors.bgGreen.white(` ${label} `);
          case 'yellow': return colors.bgYellow.black(` ${label} `);
          case 'blue': return colors.bgBlue.white(` ${label} `);
          default: return ` ${label} `;
        }
      }

      const andons = [
        formatAndon('Tr', m.andon.tr),
        formatAndon('Co', m.andon.co),
        formatAndon('Br', m.andon.br),
        formatAndon('Wt', m.andon.wt)
      ].join(' ');

      console.log(`\nTrack: ${m.name}`);
      console.log(`Status: ${m.status}`);
      console.log(`Andons: ${andons}\n`);
    });

  const trackFixWorktreeCommand = new Command()
    .description('Hidden contextual fix worktree command')
    .arguments('<name:string>')
    .hidden()
    .action(async (_options: void | Record<string, unknown>, name: string) => {
      await fixWorktree(name);
    });

  const trackFixBranchCommand = new Command()
    .description('Hidden contextual fix branch command')
    .arguments('<name:string>')
    .hidden()
    .action(async (_options: void | Record<string, unknown>, name: string) => {
      await fixBranch(name);
    });

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
    .command('track', trackCommand)
    .command('track-status', trackStatusCommand)
    .command('track-fix-worktree', trackFixWorktreeCommand)
    .command('track-fix-branch', trackFixBranchCommand);
}

async function runRepl() {
  globalThis.__DEVSIDE_REPL_ACTIVE__ = true;
  console.log("Welcome to the devside REPL! Type 'exit' to quit or 'help' for commands.");
  
  let context: string[] = [];

  while (true) {
    let promptMsg = 'devside';
    if (context.length > 0) {
      promptMsg += ' ' + context.join('/');
    }
    promptMsg += '>';

    let suggestions: string[] = [];
    if (context.length === 0) {
        suggestions = ['tracks', 'help', 'exit'];
    } else if (context.length === 1 && context[0] === 'tracks') {
        const machines = await listMachines();
        suggestions = ['create', 'destroy', 'list', ...machines.map(m => m.name), '..'];
    } else if (context.length === 2 && context[0] === 'tracks') {
        suggestions = ['status', 'fix', '..'];
    } else if (context.length === 3 && context[2] === 'fix') {
        const machines = await listMachines();
        const m = machines.find(x => x.name === context[1]);
        if (m) {
            if (m.andon.wt !== 'green') suggestions.push('worktree');
            if (m.andon.br !== 'green') suggestions.push('branch');
        }
        suggestions.push('..');
    }

    let input: string;
    try {
      input = await Input.prompt({
        message: promptMsg,
        suggestions,
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

    // Context Navigation
    if (args.length === 1 && args[0] === '..') {
        context.pop();
        continue;
    }
    if (args.length === 1 && args[0] === 'tracks') {
        context = ['tracks'];
        continue;
    }
    
    // Changing context within tracks
    if (context.length === 1 && context[0] === 'tracks' && args.length === 1) {
        // If it's a known subcommand, don't change context
        if (!['create', 'destroy', 'list', 'status', 'help'].includes(args[0])) {
            context.push(args[0]);
            continue;
        }
    }

    // Changing context to fix mode
    if (context.length === 2 && context[0] === 'tracks' && args.length === 1 && args[0] === 'fix') {
        context.push('fix');
        continue;
    }

    // Map contextual args to root commands
    let mappedArgs = [...args];
    if (context.length === 1 && context[0] === 'tracks') {
       mappedArgs = ['track', ...args];
    } else if (context.length >= 2 && context[0] === 'tracks') {
       const trackName = context[1];
       if (context.length === 2 && args[0] === 'status') {
           mappedArgs = ['track-status', trackName];
       } else if (context.length === 3 && context[2] === 'fix' && args.length === 1) {
           if (args[0] === 'worktree') mappedArgs = ['track-fix-worktree', trackName];
           else if (args[0] === 'branch') mappedArgs = ['track-fix-branch', trackName];
       } else {
           // Provide fallback for unexpected commands in context
           mappedArgs = [args[0], trackName, ...args.slice(1)];
       }
    }

    try {
      await buildApp().parse(mappedArgs);
    } catch (error: any) {
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
