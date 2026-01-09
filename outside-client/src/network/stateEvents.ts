import { GameObject, TerrainObject } from '@outside/core';

/**
 * Partial grid data sent in state change events
 */
export interface PartialGridData {
  width: number;
  height: number;
  objects: GameObject[];
  terrain?: TerrainObject[]; // Included in initial state, not in state change events
}

/**
 * State change event sent from host to clients
 */
export interface StateChangeEvent {
  type: 'STATE_CHANGE_EVENT';
  step: number;
  gridData: PartialGridData;
}

/**
 * Initial state snapshot sent to late-joining clients
 */
export interface InitialState {
  type: 'INITIAL_STATE';
  gridData: PartialGridData;
}

/**
 * Bot assignment message
 */
export interface BotAssignment {
  type: 'BOT_ASSIGNMENT';
  clientId: string;
  botId: string | null; // null means unassigned
}

export type NetworkMessage = StateChangeEvent | InitialState | BotAssignment;

/**
 * Serialize network message to JSON
 */
export function serializeNetworkMessage(message: NetworkMessage): string {
  return JSON.stringify(message);
}

/**
 * Deserialize network message from JSON
 */
export function deserializeNetworkMessage(data: string): NetworkMessage {
  const parsed = JSON.parse(data);
  if (!['STATE_CHANGE_EVENT', 'INITIAL_STATE', 'BOT_ASSIGNMENT'].includes(parsed.type)) {
    throw new Error(`Invalid network message type: ${parsed.type}`);
  }
  return parsed as NetworkMessage;
}
