import { describe, it, expect } from 'vitest';
import { createObserverDeserializer } from './serialization';
import { createRenderObserverSerializer } from './render-stream';
import { createWorld } from './world';
import { spawnFloorTile } from './prefabs/floor';
import { RENDER_COMPONENTS } from './render-schema';
import Observed from './components/Observed';
import { FloorTile, Position } from './components';
import { query } from 'bitecs';

describe('render stream observer', () => {
  it('includes tag components when Observed is added before tags', () => {
    const simWorld = createWorld({ seed: 1, ticDurationMs: 50 });
    const observer = createRenderObserverSerializer(simWorld);

    spawnFloorTile(simWorld, 0, 0, true);
    const delta = observer();

    const renderWorld = createWorld({ seed: 2, ticDurationMs: 50 });
    const deser = createObserverDeserializer(renderWorld, Observed, [...RENDER_COMPONENTS]);
    deser(delta);

    const floorEids = query(renderWorld, [FloorTile, Position]);
    expect(floorEids.length).toBeGreaterThan(0);
  });
});
