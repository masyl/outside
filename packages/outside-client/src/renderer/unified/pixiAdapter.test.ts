import { Container, Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { setCurrentZoomScale } from '../../zoom/zoomScaleService';
import { createPixiDisplayAdapter } from './pixiAdapter';
import type { Renderable } from './renderables';

describe('createPixiDisplayAdapter (bot zoom scaling)', () => {
  it('scales bot placeholder by global zoom', () => {
    setCurrentZoomScale(2);

    const root = new Container();
    const adapter = createPixiDisplayAdapter(root, {
      getBotTexture: () => undefined,
      getBotWalkTexture: () => undefined,
      getBotFacing: () => 'down',
      getBotIsMoving: () => false,
      getBotWalkFrameIndex: () => 0,
      getTerrainTexture: () => undefined,
      // Canvas placeholder path does not require a real Pixi renderer.
      renderer: undefined as any,
    });

    const display = adapter.create({
      id: 'b-1',
      kind: 'bot',
      position: { x: 0, y: 0 },
      sprite: { textureKey: 'bot' },
      z: 1,
    });

    adapter.update(display, {
      id: 'b-1',
      kind: 'bot',
      position: { x: 0, y: 0 },
      sprite: { textureKey: 'bot' },
      z: 1,
    });

    const container = display as Container;
    const child = container.children[0] as any;
    expect(child.scale.x).toBe(2);
    expect(child.scale.y).toBe(2);
  });

  it('scales textured bot by baseScale * zoom', () => {
    setCurrentZoomScale(1.5);

    const root = new Container();
    const adapter = createPixiDisplayAdapter(root, {
      getBotTexture: () => Texture.EMPTY,
      getBotWalkTexture: () => Texture.EMPTY,
      getBotFacing: () => 'right',
      getBotIsMoving: () => false,
      getBotWalkFrameIndex: () => 0,
      getTerrainTexture: () => undefined,
      renderer: undefined as any,
    });

    const renderable: Renderable = {
      id: 'b-2',
      kind: 'bot',
      position: { x: 0, y: 0 },
      sprite: { textureKey: 'bot' },
      z: 1,
    };

    const display = adapter.create(renderable);
    adapter.update(display, renderable);

    const container = display as Container;
    const child = container.children[0] as any;

    // Base scale is 64/16 = 4, then multiplied by zoom 1.5 => 6.
    expect(child.scale.x).toBeCloseTo(6);
    expect(child.scale.y).toBeCloseTo(6);
  });
});

