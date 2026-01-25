import { describe, expect, it } from 'vitest';

import type { Renderable } from './renderables';
import { UnifiedRenderer } from './unifiedRenderer';

type Display = { id: string };

function r(partial: Partial<Renderable> & Pick<Renderable, 'id' | 'kind'>): Renderable {
  return {
    id: partial.id,
    kind: partial.kind,
    position: partial.position ?? { x: 0, y: 0 },
    sprite: partial.sprite ?? { textureKey: 'x' },
    z: partial.z ?? 0,
    size: partial.size,
  };
}

describe('UnifiedRenderer', () => {
  it('creates, updates, and destroys display objects based on Renderable[]', () => {
    const calls: string[] = [];

    const renderer = new UnifiedRenderer<Display>({
      create: (renderable) => {
        calls.push(`create:${renderable.id}`);
        return { id: renderable.id };
      },
      update: (display, renderable) => {
        calls.push(`update:${display.id}:${renderable.position.x},${renderable.position.y}`);
      },
      destroy: (display) => {
        calls.push(`destroy:${display.id}`);
      },
    });

    renderer.render([
      r({ id: 'a', kind: 'bot', position: { x: 1, y: 1 }, z: 10 }),
      r({ id: 'b', kind: 'terrain', position: { x: 2, y: 2 }, z: 0 }),
    ]);

    expect(Array.from(renderer.getIndex().keys()).sort()).toEqual(['a', 'b']);
    expect(calls).toContain('create:a');
    expect(calls).toContain('create:b');

    calls.length = 0;

    // Update A, remove B, add C
    renderer.render([
      r({ id: 'a', kind: 'bot', position: { x: 9, y: 9 }, z: 10 }),
      r({ id: 'c', kind: 'terrain', position: { x: 3, y: 3 }, z: 1 }),
    ]);

    expect(Array.from(renderer.getIndex().keys()).sort()).toEqual(['a', 'c']);
    expect(calls).toContain('update:a:9,9');
    expect(calls).toContain('create:c');
    expect(calls).toContain('destroy:b');
  });

  it('applies deterministic ordering (z then id) and can set zIndex via adapter', () => {
    const order: string[] = [];

    const renderer = new UnifiedRenderer<Display>({
      create: (renderable) => ({ id: renderable.id }),
      update: (display) => {
        order.push(`update:${display.id}`);
      },
      destroy: () => {},
      setZIndex: (display, z) => {
        order.push(`z:${display.id}:${z}`);
      },
    });

    renderer.render([
      r({ id: 'b', kind: 'bot', z: 5 }),
      r({ id: 'a', kind: 'bot', z: 5 }),
      r({ id: 't', kind: 'terrain', z: 0 }),
    ]);

    // Expected order: terrain first (z=0), then a/b (z=5, id tie-breaker).
    expect(order).toEqual(['z:t:0', 'update:t', 'z:a:5', 'update:a', 'z:b:5', 'update:b']);
  });
});

