import { describe, expect, it } from 'vitest';
import { addComponent, addEntity, createWorld } from 'bitecs';
import { ObstacleSize, PositionZ, Size } from '@outside/simulator';
import { getVerticalLiftTiles } from './sprite-render';

describe('getVerticalLiftTiles', () => {
  it('should return zero when z is missing', () => {
    const world = createWorld();
    const eid = addEntity(world);
    expect(getVerticalLiftTiles(world, eid)).toBe(0);
  });

  it('should subtract obstacle half-height baseline', () => {
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, eid, PositionZ);
    PositionZ.z[eid] = 0.7;
    addComponent(world, eid, ObstacleSize);
    ObstacleSize.diameter[eid] = 0.8;
    expect(getVerticalLiftTiles(world, eid)).toBeCloseTo(0.3, 6);
  });

  it('should clamp to zero below baseline', () => {
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, eid, PositionZ);
    PositionZ.z[eid] = 0.2;
    addComponent(world, eid, Size);
    Size.diameter[eid] = 1;
    expect(getVerticalLiftTiles(world, eid)).toBe(0);
  });
});
