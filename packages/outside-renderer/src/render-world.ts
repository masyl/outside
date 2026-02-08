import { createWorld, type World } from 'bitecs';
import {
  createObserverDeserializer,
  createSnapshotDeserializer,
  RENDER_COMPONENTS,
  Observed,
} from '@outside/simulator';

/**
 * Local renderer state used to deserialize and replay simulator render packets.
 */
export interface RenderWorldState {
  world: World;
  observerDeserializer: ReturnType<typeof createObserverDeserializer>;
  snapshotDeserializer: ReturnType<typeof createSnapshotDeserializer>;
  lastTic: number;
}

/**
 * Packet format sent by simulator-to-renderer stream.
 */
export type RenderStreamPacket = {
  kind: 'snapshot' | 'delta';
  buffer: Uint8Array;
  tic: number;
};

/**
 * Creates a fresh render world with deserializers bound to simulator render components.
 */
export function createRenderWorld(): RenderWorldState {
  const world = createWorld();
  const observerDeserializer = createObserverDeserializer(world, Observed, RENDER_COMPONENTS);
  const snapshotDeserializer = createSnapshotDeserializer(world, RENDER_COMPONENTS);
  return {
    world,
    observerDeserializer,
    snapshotDeserializer,
    lastTic: 0,
  };
}

/**
 * Applies one snapshot or delta packet and updates local tick tracking.
 */
export function applyRenderStream(renderWorld: RenderWorldState, packet: RenderStreamPacket): void {
  if (packet.kind === 'snapshot') {
    renderWorld.snapshotDeserializer(packet.buffer);
  } else {
    renderWorld.observerDeserializer(packet.buffer);
  }
  renderWorld.lastTic = packet.tic;
}
