import { describe, expect, it } from 'vitest';
import { Container, Graphics } from 'pixi.js';
import { addComponent, addEntity } from 'bitecs';
import { DefaultSpriteKey, MinimapPixel, Observed, Position } from '@outside/simulator';
import { createRenderWorld } from '../render-world';
import type { RenderKind } from '../render-classify';
import { runMinimapRenderPass } from './minimap-render-pass';

describe('runMinimapRenderPass', () => {
  it('renders minimap entities and pointer, snapping when enabled', () => {
    const renderWorld = createRenderWorld();
    const { world } = renderWorld;
    const layer = new Container();

    const floor = addEntity(world);
    addComponent(world, floor, Observed);
    addComponent(world, floor, Position);
    addComponent(world, floor, MinimapPixel);
    addComponent(world, floor, DefaultSpriteKey);
    Position.x[floor] = 4;
    Position.y[floor] = -2;
    DefaultSpriteKey.value[floor] = 'tile.floor';
    MinimapPixel.r[floor] = 10;
    MinimapPixel.g[floor] = 20;
    MinimapPixel.b[floor] = 30;

    const bot = addEntity(world);
    addComponent(world, bot, Observed);
    addComponent(world, bot, Position);
    addComponent(world, bot, MinimapPixel);
    addComponent(world, bot, DefaultSpriteKey);
    Position.x[bot] = 1.8;
    Position.y[bot] = 3.2;
    DefaultSpriteKey.value[bot] = 'actor.bot';
    MinimapPixel.r[bot] = 200;
    MinimapPixel.g[bot] = 210;
    MinimapPixel.b[bot] = 220;

    const food = addEntity(world);
    addComponent(world, food, Observed);
    addComponent(world, food, Position);
    addComponent(world, food, DefaultSpriteKey);
    Position.x[food] = 5.5;
    Position.y[food] = 5.5;
    DefaultSpriteKey.value[food] = 'pickup.food';

    const pointer = addEntity(world);
    addComponent(world, pointer, Observed);
    addComponent(world, pointer, Position);
    addComponent(world, pointer, DefaultSpriteKey);
    Position.x[pointer] = 7.6;
    Position.y[pointer] = 1.4;
    DefaultSpriteKey.value[pointer] = 'ui.cursor.r0c0';

    const state = {
      displayIndex: new Map<number, Graphics>(),
      displayKinds: new Map<number, RenderKind>(),
    };

    runMinimapRenderPass(renderWorld, 4, layer, state, 'renderer#test', true);

    expect(state.displayIndex.size).toBe(3);
    expect(state.displayIndex.has(floor)).toBe(true);
    expect(state.displayIndex.has(bot)).toBe(true);
    expect(state.displayIndex.has(pointer)).toBe(true);
    expect(state.displayIndex.has(food)).toBe(false);

    const floorPixel = state.displayIndex.get(floor);
    const botPixel = state.displayIndex.get(bot);
    const pointerPixel = state.displayIndex.get(pointer);
    expect(floorPixel?.x).toBe(16);
    expect(floorPixel?.y).toBe(4);
    expect(botPixel?.x).toBe(4);
    expect(botPixel?.y).toBe(-16);
    expect(pointerPixel?.x).toBe(28);
    expect(pointerPixel?.y).toBe(-8);
    expect((pointerPixel?.zIndex ?? 0) > (botPixel?.zIndex ?? 0)).toBe(true);
  });
});
