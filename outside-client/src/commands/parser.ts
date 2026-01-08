import { Direction } from '@outside/core';

export type ParsedCommand =
  | { type: 'create'; objectType: 'bot'; id: string }
  | { type: 'place'; id: string; x: number; y: number }
  | { type: 'move'; id: string; direction: Direction; distance: number }
  | { type: 'unknown'; raw: string };

/**
 * Parse a command string into a structured command
 * Simple browser-compatible parser (replaces commander for browser use)
 */
export function parseCommand(commandString: string): ParsedCommand {
  // Remove leading/trailing whitespace
  const trimmed = commandString.trim();
  
  if (!trimmed) {
    return { type: 'unknown', raw: trimmed };
  }

  try {
    // Parse the command
    const args = trimmed.split(/\s+/);
    const cmd = args[0];
    
    // Handle create bot command: "create bot <id>"
    if (cmd === 'create' && args.length === 3 && args[1] === 'bot') {
      return { type: 'create', objectType: 'bot', id: args[2] };
    }
    
    // Handle place command: "place <id> <x> <y>"
    if (cmd === 'place' && args.length === 4) {
      const x = parseInt(args[2], 10);
      const y = parseInt(args[3], 10);
      if (!isNaN(x) && !isNaN(y)) {
        return { type: 'place', id: args[1], x, y };
      }
    }
    
    // Handle move command: "move <id> <direction> <distance>"
    if (cmd === 'move' && args.length === 4) {
      const direction = args[2] as Direction;
      const distance = parseInt(args[3], 10);
      const validDirections: Direction[] = ['left', 'right', 'up', 'down'];
      if (validDirections.includes(direction) && !isNaN(distance)) {
        return { type: 'move', id: args[1], direction, distance };
      }
    }
    
    return { type: 'unknown', raw: trimmed };
  } catch (error) {
    console.error('Error parsing command:', error);
    return { type: 'unknown', raw: trimmed };
  }
}
