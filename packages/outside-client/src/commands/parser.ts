import { Direction, TerrainType } from '@outside/core';

export type ParsedCommand =
  | { type: 'create'; objectType: 'bot'; id: string; raw?: string }
  | {
      type: 'create';
      objectType: 'terrain';
      id: string;
      terrainType: TerrainType;
      x: number;
      y: number;
      width: number;
      height: number;
      raw?: string;
    }
  | { type: 'place'; id: string; x: number; y: number; raw?: string }
  | { type: 'move'; id: string; direction: Direction; distance: number; raw?: string }
  | { type: 'wander'; id: string; raw?: string }
  | { type: 'wait'; id: string; raw?: string }
  | { type: 'follow'; id: string; targetId: string; tightness?: number; raw?: string }
  | { type: 'set-world-size'; width: number; height: number; raw?: string }
  | { type: 'set-seed'; seed: number; raw?: string }
  | { type: 'reset-world'; raw?: string }
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
      return { type: 'create', objectType: 'bot', id: args[2], raw: trimmed };
    }

    // Handle create terrain command: "create terrain <type> <id> <x> <y> <width> <height>"
    if (cmd === 'create' && args.length === 8 && args[1] === 'terrain') {
      const terrainType = args[2] as TerrainType;
      const validTerrainTypes: TerrainType[] = ['grass', 'dirt', 'water', 'sand', 'hole'];
      const id = args[3];
      const x = parseInt(args[4], 10);
      const y = parseInt(args[5], 10);
      const width = parseInt(args[6], 10);
      const height = parseInt(args[7], 10);
      if (
        validTerrainTypes.includes(terrainType) &&
        !isNaN(x) &&
        !isNaN(y) &&
        !isNaN(width) &&
        !isNaN(height)
      ) {
        return {
          type: 'create',
          objectType: 'terrain',
          id,
          terrainType,
          x,
          y,
          width,
          height,
          raw: trimmed,
        };
      }
    }

    // Handle place command: "place <id> <x> <y>"
    if (cmd === 'place' && args.length === 4) {
      const x = parseInt(args[2], 10);
      const y = parseInt(args[3], 10);
      if (!isNaN(x) && !isNaN(y)) {
        return { type: 'place', id: args[1], x, y, raw: trimmed };
      }
    }

    // Handle move command: "move <id> <direction> <distance>"
    if (cmd === 'move' && args.length === 4) {
      const direction = args[2] as Direction;
      const distance = parseInt(args[3], 10);
      const validDirections: Direction[] = [
        'left',
        'right',
        'up',
        'down',
        'up-left',
        'up-right',
        'down-left',
        'down-right',
      ];
      if (validDirections.includes(direction) && !isNaN(distance)) {
        return { type: 'move', id: args[1], direction, distance, raw: trimmed };
      }
    }

    // Handle wander command: "wander <id>"
    if (cmd === 'wander' && args.length === 2) {
      return { type: 'wander', id: args[1], raw: trimmed };
    }

    // Handle wait command: "wait <id>"
    if (cmd === 'wait' && args.length === 2) {
      return { type: 'wait', id: args[1], raw: trimmed };
    }

    // Handle follow command: "follow <id> <targetId> [tightness]"
    if (cmd === 'follow' && (args.length === 3 || args.length === 4)) {
      const id = args[1];
      const targetId = args[2];
      if (args.length === 3) {
        return { type: 'follow', id, targetId, raw: trimmed };
      }
      const tightness = Number(args[3]);
      if (!Number.isFinite(tightness)) {
        return { type: 'unknown', raw: trimmed };
      }
      return { type: 'follow', id, targetId, tightness, raw: trimmed };
    }

    // Handle set-world-size command: "set-world-size <width> <height>"
    if (cmd === 'set-world-size' && args.length === 3) {
      const width = parseInt(args[1], 10);
      const height = parseInt(args[2], 10);
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { type: 'set-world-size', width, height, raw: trimmed };
      }
    }

    // Handle set-seed command: "set-seed <seed>"
    if (cmd === 'set-seed' && args.length === 2) {
      const seed = parseInt(args[1], 10);
      if (!isNaN(seed)) {
        return { type: 'set-seed', seed, raw: trimmed };
      }
    }

    // Handle reset-world command: "reset-world"
    if (cmd === 'reset-world' && args.length === 1) {
      return { type: 'reset-world', raw: trimmed };
    }

    return { type: 'unknown', raw: trimmed };
  } catch (error) {
    console.error('Error parsing command:', error);
    return { type: 'unknown', raw: trimmed };
  }
}
