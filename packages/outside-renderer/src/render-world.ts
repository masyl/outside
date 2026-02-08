import { createWorld, type World } from 'bitecs';
import {
  createObserverDeserializer,
  createSnapshotDeserializer,
  RENDER_COMPONENTS,
  Observed,
} from '@outside/simulator';

export interface RenderWorldState {
  world: World;
  observerDeserializer: ReturnType<typeof createObserverDeserializer>;
  snapshotDeserializer: ReturnType<typeof createSnapshotDeserializer>;
  lastTic: number;
}

export type RenderStreamPacket = {
  kind: 'snapshot' | 'delta';
  buffer: Uint8Array;
  tic: number;
};

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

export function applyRenderStream(renderWorld: RenderWorldState, packet: RenderStreamPacket): void {
  if (packet.kind === 'snapshot') {
    renderWorld.snapshotDeserializer(packet.buffer);
  } else {
    renderWorld.observerDeserializer(packet.buffer);
  }
  renderWorld.lastTic = packet.tic;
}
