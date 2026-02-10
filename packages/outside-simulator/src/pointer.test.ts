import { describe, expect, it } from 'vitest';
import { hasComponent } from 'bitecs';
import {
  addComponent,
  addEntity,
  clearPointerTile,
  createWorld,
  DefaultSpriteKey,
  getPointerTile,
  getPointerSpriteKey,
  getPointerWorld,
  Observed,
  Pointer,
  PointerKind,
  Position,
  query,
  runTics,
  setPointerTile,
  setPointerSpriteKey,
  setPointerWorld,
  VariantSpriteKey,
} from './index';

describe('pointer ECS state', () => {
  it('creates pointer entity hidden by default with sprite key configured', () => {
    const world = createWorld({ seed: 123 });
    const pointerEids = query(world, [Pointer]);
    expect(pointerEids.length).toBe(1);
    const pointerEid = pointerEids[0];

    expect(DefaultSpriteKey.value[pointerEid]).toBe('ui.cursor.r0c0');
    expect(getPointerTile(world)).toEqual({ x: Number.NaN, y: Number.NaN });
    expect(getPointerWorld(world)).toEqual({ x: Number.NaN, y: Number.NaN });
    expect(hasComponent(world, pointerEid, Position)).toBe(false);
    expect(hasComponent(world, pointerEid, Observed)).toBe(false);
  });

  it('syncs world pointer position and tile through the pointer system', () => {
    const world = createWorld({ seed: 456 });
    const pointerEid = query(world, [Pointer])[0];

    setPointerWorld(world, 4.25, -1.75);
    expect(getPointerWorld(world)).toEqual({ x: 4.25, y: -1.75 });
    expect(getPointerTile(world)).toEqual({ x: 4, y: -2 });
    expect(hasComponent(world, pointerEid, Observed)).toBe(true);

    runTics(world, 1);
    expect(getPointerTile(world)).toEqual({ x: 4, y: -2 });
  });

  it('supports tile setters and clear hiding semantics', () => {
    const world = createWorld({ seed: 789 });
    const pointerEid = query(world, [Pointer])[0];

    setPointerTile(world, 2, 3);
    expect(getPointerTile(world)).toEqual({ x: 2, y: 3 });
    expect(getPointerWorld(world)).toEqual({ x: 2.5, y: 3.5 });
    expect(hasComponent(world, pointerEid, Observed)).toBe(true);

    clearPointerTile(world);
    expect(getPointerTile(world)).toEqual({ x: Number.NaN, y: Number.NaN });
    expect(getPointerWorld(world)).toEqual({ x: Number.NaN, y: Number.NaN });
    expect(hasComponent(world, pointerEid, Observed)).toBe(false);
  });

  it('allows swapping pointer sprite variants while keeping pointer state', () => {
    const world = createWorld({ seed: 321 });
    const pointerEid = query(world, [Pointer])[0];

    setPointerWorld(world, 1.5, 2.5);
    setPointerSpriteKey(world, 'ui.cursor.r3c4');
    expect(getPointerSpriteKey(world)).toBe('ui.cursor.r3c4');
    expect(DefaultSpriteKey.value[pointerEid]).toBe('ui.cursor.r3c4');
    expect(getPointerWorld(world)).toEqual({ x: 1.5, y: 2.5 });

    setPointerSpriteKey(world, 'invalid.sprite.key');
    expect(getPointerSpriteKey(world)).toBe('ui.cursor.r0c0');
    expect(DefaultSpriteKey.value[pointerEid]).toBe('ui.cursor.r0c0');
  });

  it('overrides pointer style while hovering pointerKind entities and restores afterward', () => {
    const world = createWorld({ seed: 654 });
    const pointerEid = query(world, [Pointer])[0];
    const swatchEid = addEntity(world);
    addComponent(world, swatchEid, Position);
    addComponent(world, swatchEid, Observed);
    addComponent(world, swatchEid, PointerKind);
    Position.x[swatchEid] = 4.5;
    Position.y[swatchEid] = -2.5;
    PointerKind.value[swatchEid] = 'ui.cursor.r2c3';

    setPointerSpriteKey(world, 'ui.cursor.r0c1');
    setPointerWorld(world, 4.5, -2.5);
    expect(getPointerSpriteKey(world)).toBe('ui.cursor.r0c1');
    expect(hasComponent(world, pointerEid, VariantSpriteKey)).toBe(true);
    expect(VariantSpriteKey.value[pointerEid]).toBe('ui.cursor.r2c3');

    setPointerWorld(world, 0.5, 0.5);
    expect(hasComponent(world, pointerEid, VariantSpriteKey)).toBe(false);
    expect(getPointerSpriteKey(world)).toBe('ui.cursor.r0c1');
  });

  it('updates hover override when pointed entity moves during simulation tics', () => {
    const world = createWorld({ seed: 987 });
    const pointerEid = query(world, [Pointer])[0];
    const swatchEid = addEntity(world);
    addComponent(world, swatchEid, Position);
    addComponent(world, swatchEid, Observed);
    addComponent(world, swatchEid, PointerKind);
    Position.x[swatchEid] = 2.5;
    Position.y[swatchEid] = 2.5;
    PointerKind.value[swatchEid] = 'ui.cursor.r6c6';

    setPointerWorld(world, 2.5, 2.5);
    expect(VariantSpriteKey.value[pointerEid]).toBe('ui.cursor.r6c6');

    Position.x[swatchEid] = 10.5;
    Position.y[swatchEid] = 10.5;
    runTics(world, 1);
    expect(hasComponent(world, pointerEid, VariantSpriteKey)).toBe(false);
  });
});
