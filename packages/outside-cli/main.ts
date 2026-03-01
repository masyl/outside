import { Command } from '@cliffy/command';
import { createMachine, destroyMachine, listMachines } from './orb.ts';
import { createTrackProxy, destroyTrackProxy } from './docker.ts';

// Create
const createCommand = new Command()
  .description('Create a new native OrbStack tracking environment for a track')
  .arguments('<name:string>')
  .action(async (_options: void | Record<string, unknown>, name: string) => {
    console.log(`Creating track environment for '${name}'...`);
    const success = await createMachine(name);
    if (!success) {
      console.error(`Failed to create machine '${name}'`);
      Deno.exit(1);
    }
    const proxySuccess = await createTrackProxy(name);
    if (!proxySuccess) {
      console.error(`Failed to create proxy container for '${name}'`);
      // Warning: machine was created but proxy failed
      Deno.exit(1);
    }
    console.log(`Track environment '${name}' created successfully.`);
  });

// Destroy
const destroyCommand = new Command()
  .description('Destroy the native OrbStack tracking environment for a track')
  .arguments('<name:string>')
  .action(async (_options: void | Record<string, unknown>, name: string) => {
    console.log(`Destroying track environment for '${name}'...`);
    
    // Destroy proxy first
    await destroyTrackProxy(name);

    const success = await destroyMachine(name);
    if (!success) {
      console.error(`Failed to destroy machine '${name}'`);
      Deno.exit(1);
    }
    console.log(`Track environment '${name}' destroyed successfully.`);
  });

// List
const listCommand = new Command()
  .description('List all active native OrbStack track environments')
  .action(async () => {
    console.log('Listing active track environments...');
    try {
      const machines = await listMachines();
      console.table(machines);
    } catch (error) {
      console.error(error);
      Deno.exit(1);
    }
  });

// Track
const trackCommand = new Command()
  .description('Manage development tracks (provisioning, destruction, Caddy routing)')
  .action(function (this: Command) {
    this.showHelp();
  })
  .command('create', createCommand)
  .command('destroy', destroyCommand)
  .command('list', listCommand);

// Main CLI
if (import.meta.main) {
  await new Command()
    .name('outside-cli')
    .version('0.1.0')
    .description('Outside project orchestration CLI')
    .action(function (this: Command) {
      this.showHelp();
    })
    .command('track', trackCommand)
    .parse(Deno.args);
}
