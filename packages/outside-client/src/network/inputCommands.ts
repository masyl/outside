/**
 * Abstract input command types that clients send to the host
 */
export type InputCommandType =
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'SELECT_NEXT_BOT'
  | 'SELECT_PREV_BOT'
  | 'CLICK_TILE';

export interface InputCommand {
  type: 'INPUT_COMMAND';
  clientId: string;
  command: InputCommandType;
  selectedBotId?: string; // Bot the client wants to control (for movement commands)
  data?: {
    x?: number;
    y?: number;
  };
}

/**
 * Serialize input command to JSON
 */
export function serializeInputCommand(command: InputCommand): string {
  return JSON.stringify(command);
}

/**
 * Deserialize input command from JSON
 */
export function deserializeInputCommand(data: string): InputCommand {
  const parsed = JSON.parse(data);
  if (parsed.type !== 'INPUT_COMMAND') {
    throw new Error('Invalid input command type');
  }
  return parsed as InputCommand;
}
