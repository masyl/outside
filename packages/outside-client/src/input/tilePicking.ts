import { CoordinateConverter, type WorldPosition } from '../renderer/coordinateSystem';

export type ScreenPosition = { x: number; y: number };
export type TilePosition = { x: number; y: number };

export function pickWorldAndTileFromScreen(args: {
  screen: ScreenPosition;
  rootPos: ScreenPosition;
  zoomScale: number;
}): { world: WorldPosition; tile: TilePosition } {
  const world = CoordinateConverter.screenToWorld(args.screen, args.rootPos, args.zoomScale);
  return {
    world,
    tile: { x: Math.floor(world.x), y: Math.floor(world.y) },
  };
}

