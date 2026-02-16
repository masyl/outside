import { createWorld, type World } from 'bitecs';
import {
  createObserverDeserializer,
  createSnapshotDeserializer,
  RENDER_COMPONENTS,
  RENDER_SNAPSHOT_COMPONENTS,
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
  lastAnimationTimeMs: number | null;
}

/**
 * Packet format sent by simulator-to-renderer stream.
 */
export type RenderStreamPacket = {
  kind: 'snapshot' | 'delta';
  buffer: ArrayBuffer;
  tic: number;
};

/**
 * Creates a fresh render world with deserializers bound to simulator render components.
 */
export function createRenderWorld(): RenderWorldState {
  const world = createWorld();
  const observerDeserializer = createObserverDeserializer(world, Observed, [...RENDER_COMPONENTS]);
  const snapshotDeserializer = createSnapshotDeserializer(world, [...RENDER_SNAPSHOT_COMPONENTS]);
  return {
    world,
    observerDeserializer,
    snapshotDeserializer,
    lastTic: 0,
    lastAnimationTimeMs: null,
  };
}

/**
 * Reinitializes the render world and deserializers in-place.
 * Snapshot packets are treated as full-state replacement, not merge updates.
 *
 * @param renderWorld - Render world state to reset.
 */
function resetRenderWorld(renderWorld: RenderWorldState): void {
  const world = createWorld();
  renderWorld.world = world;
  renderWorld.observerDeserializer = createObserverDeserializer(world, Observed, [...RENDER_COMPONENTS]);
  renderWorld.snapshotDeserializer = createSnapshotDeserializer(world, [...RENDER_SNAPSHOT_COMPONENTS]);
  renderWorld.lastTic = 0;
  renderWorld.lastAnimationTimeMs = null;
}

/**
 * Applies one snapshot or delta packet and updates local tick tracking.
 */
export function applyRenderStream(renderWorld: RenderWorldState, packet: RenderStreamPacket): void {
  if (packet.kind === 'snapshot') {
    resetRenderWorld(renderWorld);
    renderWorld.snapshotDeserializer(packet.buffer);
  } else {
    renderWorld.observerDeserializer(packet.buffer);
  }
  renderWorld.lastTic = packet.tic;
}
