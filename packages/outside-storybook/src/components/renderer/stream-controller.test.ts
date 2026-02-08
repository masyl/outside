import { describe, expect, it } from 'vitest';
import { createStreamController } from './stream-controller';
import type { SharedRenderStreamPacket } from './useScenarioRenderStream';

function packet(kind: 'snapshot' | 'delta', tic: number): SharedRenderStreamPacket {
  return {
    kind,
    tic,
    buffer: new ArrayBuffer(1),
  };
}

describe('createStreamController', () => {
  it('replays snapshot and deltas to a late-ready consumer', () => {
    const controller = createStreamController();
    const seen: Array<string> = [];

    controller.subscribe('pixi', (nextPacket, seq) => {
      seen.push(`${seq}:${nextPacket.kind}:${nextPacket.tic}`);
    });
    controller.setReady('pixi', false);

    controller.push(packet('snapshot', 0));
    controller.push(packet('delta', 1));
    controller.push(packet('delta', 2));

    controller.setReady('pixi', true);

    expect(seen).toEqual(['1:snapshot:0', '2:delta:1', '3:delta:2']);
  });

  it('delivers the same ordered packet sequence to both consumers', () => {
    const controller = createStreamController();
    const pixiSeen: Array<string> = [];
    const inspectorSeen: Array<string> = [];

    controller.subscribe('pixi', (nextPacket, seq) => {
      pixiSeen.push(`${seq}:${nextPacket.kind}:${nextPacket.tic}`);
    });
    controller.subscribe('inspector', (nextPacket, seq) => {
      inspectorSeen.push(`${seq}:${nextPacket.kind}:${nextPacket.tic}`);
    });

    controller.setReady('pixi', true);
    controller.setReady('inspector', true);

    controller.push(packet('snapshot', 0));
    controller.push(packet('delta', 1));
    controller.push(packet('delta', 2));

    expect(pixiSeen).toEqual(inspectorSeen);
  });

  it('resets stream state and prevents replay of packets from previous stream', () => {
    const controller = createStreamController();
    const seen: Array<string> = [];

    controller.subscribe('inspector', (nextPacket, seq) => {
      seen.push(`${seq}:${nextPacket.kind}:${nextPacket.tic}`);
    });
    controller.setReady('inspector', true);
    controller.push(packet('snapshot', 0));
    controller.push(packet('delta', 1));

    controller.setReady('inspector', false);
    controller.reset('stream:two');
    controller.setReady('inspector', true);
    controller.push(packet('snapshot', 100));

    expect(seen).toEqual(['1:snapshot:0', '2:delta:1', '3:snapshot:100']);
  });

  it('does not drop a static single snapshot packet for a late-ready consumer', () => {
    const controller = createStreamController();
    const seenKinds: Array<string> = [];

    controller.subscribe('pixi', (nextPacket) => {
      seenKinds.push(nextPacket.kind);
    });

    controller.push(packet('snapshot', 0));
    controller.setReady('pixi', true);

    expect(seenKinds).toEqual(['snapshot']);
  });
});

