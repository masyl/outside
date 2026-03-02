import { Command } from '@cliffy/command';
import { Input } from '@cliffy/prompt';
import { Table } from '@cliffy/table';
import { colors } from '@cliffy/ansi/colors';
import { createMachine, destroyMachine, listMachines, ANDON_COMPONENTS, ANDON_COLORS } from './orb.ts';
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

      console.log(`\nTrack: ${m.name}`);
      console.log(`Status: ${m.status}`);
      console.log(`Andons:`);
      
      const components = [
        { key: 'tr', comp: ANDON_COMPONENTS.tr, color: m.andon.tr },
        { key: 'co', comp: ANDON_COMPONENTS.co, color: m.andon.co },
        { key: 'br', comp: ANDON_COMPONENTS.br, color: m.andon.br },
        { key: 'wt', comp: ANDON_COMPONENTS.wt, color: m.andon.wt },
      ];

      for (const { comp, color } of components) {
        const symbolStr = formatAndon(comp.symbol, color);
        const colorData = ANDON_COLORS[color];
        
        let colorLabel = colorData.label;
        if (color === 'green') colorLabel = colors.green(colorLabel);
        else if (color === 'red') colorLabel = colors.red(colorLabel);
        else if (color === 'yellow') colorLabel = colors.yellow(colorLabel);
        else if (color === 'blue') colorLabel = colors.blue(colorLabel);

        console.log(`  ${symbolStr}  ${comp.label.padEnd(10)} : ${colorLabel.padEnd(20)} - ${colorData.description}`);
      }
      console.log();
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
        suggestions = ['create', 'destroy', 'list', ...machines.map(m => m.name), 'help', '..'];
    } else if (context.length === 2 && context[0] === 'tracks') {
        suggestions = ['status', 'fix', 'help', '..'];
    } else if (context.length === 3 && context[2] === 'fix') {
        const machines = await listMachines();
        const m = machines.find(x => x.name === context[1]);
        if (m) {
            if (m.andon.wt !== 'green') suggestions.push('worktree');
            if (m.andon.br !== 'green') suggestions.push('branch');
        }
        suggestions.push('help', '..');
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

    // Global Help Command Interception
    if (args[0] === 'help' || args[0] === '?') {
        console.log(`\nCurrent Context: ${context.length === 0 ? 'Root' : context.join('/')}`);
        console.log(`Available commands and autocompletions:`);
        for (const s of suggestions) {
            console.log(`  - ${s}`);
        }
        console.log();
        continue;
    }

    // Context Navigation and Mapping
    let mappedArgs: string[] | null = null;

    if (args[0] === '..') {
        context.pop();
        continue;
    }

    if (context.length === 0) {
        if (args[0] === 'tracks') {
            context = ['tracks'];
            if (args.length > 1) {
                mappedArgs = ['track', ...args.slice(1)];
            } else {
                continue;
            }
        } else {
            mappedArgs = [...args];
        }
    } else if (context.length === 1 && context[0] === 'tracks') {
        if (['create', 'destroy', 'list', 'status', 'help'].includes(args[0])) {
            mappedArgs = ['track', ...args];
        } else {
            // It's a track name
            context.push(args[0]);
            if (args.length > 1) {
                const subCmd = args[1];
                if (subCmd === 'status') {
                    mappedArgs = ['track-status', args[0]];
                } else if (subCmd === 'fix') {
                    context.push('fix');
                    if (args.length > 2) {
                        if (args[2] === 'worktree') mappedArgs = ['track-fix-worktree', args[0]];
                        else if (args[2] === 'branch') mappedArgs = ['track-fix-branch', args[0]];
                        else mappedArgs = [args[2], args[0], ...args.slice(3)]; // fallback
                    } else {
                        continue;
                    }
                } else {
                    mappedArgs = [subCmd, args[0], ...args.slice(2)];
                }
            } else {
                continue;
            }
        }
    } else if (context.length === 2 && context[0] === 'tracks') {
        const trackName = context[1];
        if (args[0] === 'status') {
            mappedArgs = ['track-status', trackName];
        } else if (args[0] === 'fix') {
            context.push('fix');
            if (args.length > 1) {
                if (args[1] === 'worktree') mappedArgs = ['track-fix-worktree', trackName];
                else if (args[1] === 'branch') mappedArgs = ['track-fix-branch', trackName];
                else mappedArgs = [args[1], trackName, ...args.slice(2)];
            } else {
                continue;
            }
        } else {
            mappedArgs = [args[0], trackName, ...args.slice(1)];
        }
    } else if (context.length === 3 && context[2] === 'fix') {
        const trackName = context[1];
        if (args[0] === 'worktree') mappedArgs = ['track-fix-worktree', trackName];
        else if (args[0] === 'branch') mappedArgs = ['track-fix-branch', trackName];
        else mappedArgs = [args[0], trackName, ...args.slice(1)];
    }

    if (!mappedArgs) {
        mappedArgs = [...args];
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
