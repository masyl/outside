#!/usr/bin/env node
import { runFontCommand } from './commands/font.js';

const [, , subcommand, ...rest] = process.argv;

if (!subcommand || subcommand === '--help' || subcommand === '-h') {
  console.log(`
bixel – Asset conversion CLI for the Outside platform

Usage: bixel <subcommand> [options]

Subcommands:
  font    Convert a TTF bitmap font into individual PNG sprite files
`);
  process.exit(0);
}

switch (subcommand) {
  case 'font':
    runFontCommand(rest);
    break;
  default:
    console.error(`Unknown subcommand: ${subcommand}`);
    process.exit(1);
}
