import type { SharedRenderStreamPacket } from './use-scenario-render-stream';

export type StreamConsumerId = 'pixi' | 'inspector';

type StreamEntry = {
  seq: number;
  packet: SharedRenderStreamPacket;
};

type ConsumerState = {
  ready: boolean;
  lastDeliveredSeq: number;
  handler: ((packet: SharedRenderStreamPacket, seq: number) => void) | null;
};

export interface StreamController {
  push: (packet: SharedRenderStreamPacket) => void;
  setReady: (id: StreamConsumerId, ready: boolean) => void;
  replay: (id: StreamConsumerId) => void;
  subscribe: (
    id: StreamConsumerId,
    handler: (packet: SharedRenderStreamPacket, seq: number) => void
  ) => () => void;
  reset: (streamKey: string) => void;
}

function createConsumerState(): ConsumerState {
  return {
    ready: false,
    lastDeliveredSeq: -1,
    handler: null,
  };
}

/**
 * Creates a per-story packet controller that decouples stream production from consumer readiness.
 */
export function createStreamController(): StreamController {
  let nextSeq = 0;
  let entries: StreamEntry[] = [];
  const consumers = new Map<StreamConsumerId, ConsumerState>([
    ['pixi', createConsumerState()],
    ['inspector', createConsumerState()],
  ]);

  const flushConsumer = (id: StreamConsumerId): void => {
    const consumer = consumers.get(id);
    if (!consumer || !consumer.ready || !consumer.handler) return;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.seq <= consumer.lastDeliveredSeq) continue;
      consumer.handler(entry.packet, entry.seq);
      consumer.lastDeliveredSeq = entry.seq;
    }
  };

  const flushAll = (): void => {
    flushConsumer('pixi');
    flushConsumer('inspector');
  };

  return {
    push(packet) {
      const entry: StreamEntry = {
        seq: ++nextSeq,
        packet,
      };

      if (packet.kind === 'snapshot') {
        entries = [entry];
        for (const consumer of consumers.values()) {
          consumer.lastDeliveredSeq = -1;
        }
      } else {
        entries.push(entry);
      }

      flushAll();
    },

    setReady(id, ready) {
      const consumer = consumers.get(id);
      if (!consumer) return;
      consumer.ready = ready;
      if (ready) {
        flushConsumer(id);
      }
    },

    replay(id) {
      const consumer = consumers.get(id);
      if (!consumer) return;
      consumer.lastDeliveredSeq = -1;
      flushConsumer(id);
    },

    subscribe(id, handler) {
      const consumer = consumers.get(id);
      if (!consumer) {
        return () => undefined;
      }

      consumer.handler = handler;
      flushConsumer(id);

      return () => {
        const current = consumers.get(id);
        if (!current) return;
        if (current.handler === handler) {
          current.handler = null;
        }
      };
    },

    reset(_nextStreamKey) {
      entries = [];
      for (const consumer of consumers.values()) {
        consumer.lastDeliveredSeq = -1;
      }
    },
  };
}
