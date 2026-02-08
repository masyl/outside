import { hasComponent } from 'bitecs';
import {
  FloorTile,
  Food,
  Hero,
  Obstacle,
  Size,
} from '@outside/simulator';
import type { RenderWorldState } from './render-world';

export type RenderKind = 'floor' | 'wall' | 'bot' | 'hero' | 'food';

export function classifyRenderKind(world: RenderWorldState['world'], eid: number): RenderKind {
  if (hasComponent(world, eid, FloorTile)) {
    return hasComponent(world, eid, Obstacle) ? 'wall' : 'floor';
  }
  if (hasComponent(world, eid, Food)) return 'food';
  if (hasComponent(world, eid, Hero)) return 'hero';
  if (hasComponent(world, eid, Size)) {
    const diameter = Size.diameter[eid];
    if (Number.isFinite(diameter) && Math.abs(diameter - 1) < 0.01) {
      return hasComponent(world, eid, Obstacle) ? 'wall' : 'floor';
    }
  }
  return 'bot';
}
