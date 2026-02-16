import { describe, expect, it } from 'vitest';
import {
  Hero,
  Position,
  RENDER_SNAPSHOT_COMPONENTS,
  createSnapshotSerializer,
  createWorld,
  query,
  removeEntity,
  spawnBot,
  spawnFloorRect,
  spawnHero,
} from '@outside/simulator';
import { hasComponent } from 'bitecs';
import { applyRenderStream, createRenderWorld } from './render-world';

describe('render world eid mapping', () => {
  it('does not assume snapshot deserializer preserves simulator eids', () => {
    const sim = createWorld({ seed: 99, ticDurationMs: 1000 / 30 });
    spawnFloorRect(sim, -8, -8, 8, 8, true);

    const disposable: number[] = [];
    for (let i = 0; i < 40; i++) {
      disposable.push(
        spawnBot(sim, {
          x: -6 + (i % 10),
          y: -6 + Math.floor(i / 10),
          urge: 'none',
          tilesPerSec: 0,
        })
      );
    }
    // Force sparse id space so remapping is observable.
    for (let i = 0; i < disposable.length; i += 2) {
      removeEntity(sim, disposable[i]);
    }
    const heroEid = spawnHero(sim, { x: 0.5, y: 0.5 });

    const snapshot = createSnapshotSerializer(sim, [...RENDER_SNAPSHOT_COMPONENTS]);
    const render = createRenderWorld();
    applyRenderStream(render, { kind: 'snapshot', buffer: snapshot(), tic: 0 });

    const renderHeroes = query(render.world, [Hero, Position]);
    expect(renderHeroes.length).toBeGreaterThan(0);
    const renderHeroEid = renderHeroes[0];

    expect(hasComponent(render.world, heroEid, Hero)).toBe(false);
    expect(renderHeroEid).not.toBe(heroEid);
  });
});
