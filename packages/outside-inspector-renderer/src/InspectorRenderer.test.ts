import { describe, expect, it } from 'vitest';
import React, { isValidElement, type ReactElement, type ReactNode } from 'react';
import { InspectorPrimitivesLayer } from './components/InspectorPrimitivesLayer';
import type { InspectorFrame } from './frame';

function flattenElements(node: ReactNode, out: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) {
    for (const child of node) {
      flattenElements(child, out);
    }
    return out;
  }

  if (!isValidElement(node)) {
    return out;
  }

  out.push(node);
  flattenElements(node.props.children, out);
  return out;
}

const BASE_FRAME: InspectorFrame = {
  tiles: [
    {
      eid: 1,
      x: 0,
      y: 0,
      size: 1,
      kind: 'wall',
      inCollidedCooldown: true,
      collidedTicksRemaining: 2,
    },
  ],
  entities: [
    {
      eid: 2,
      prefabName: 'actor.bot',
      x: 1,
      y: 1,
      diameter: 1,
      physicsShape: 'circle',
      physicsDiameter: 0.6,
      kind: 'bot',
      directionRad: 0,
      speedTilesPerSec: 1,
      targetSpeedTilesPerSec: 2,
      targetPaceLabel: 'running',
      inCollidedCooldown: true,
      collidedTicksRemaining: 2,
      zLiftTiles: 0.5,
      isAirborne: true,
    },
  ],
  followLinks: [
    {
      followerEid: 2,
      targetEid: 3,
      fromX: 1,
      fromY: 1,
      toX: 3,
      toY: 1,
    },
  ],
  pathfindingPaths: [
    {
      eid: 2,
      points: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
      ],
    },
  ],
  collisionEntityCount: 1,
  collisionTileCount: 1,
  followLinkCount: 1,
  pathfindingPathCount: 1,
  unknownCount: 0,
};

describe('InspectorPrimitivesLayer', () => {
  it('renders follow links, velocity vectors, and collision tint by default', () => {
    const tree = InspectorPrimitivesLayer({
      frame: BASE_FRAME,
      tileSize: 16,
      toScreenX: (x) => x * 16,
      toScreenY: (y) => y * 16,
    });
    const elements = flattenElements(tree);

    const followLines = elements.filter(
      (element) =>
        element.type === 'line' &&
        element.props.stroke === '#1e90ff' &&
        element.props.strokeDasharray == null
    );
    expect(followLines.length).toBeGreaterThan(0);

    const vectorArrows = elements.filter(
      (element) => element.type === 'polygon' && element.props.fill === '#1e90ff'
    );
    expect(vectorArrows.length).toBeGreaterThan(0);

    const wallTile = elements.find(
      (element) =>
        element.type === 'rect' &&
        element.props['data-inspector-kind'] === 'wall' &&
        element.props.fill === '#6af'
    );
    expect(wallTile).toBeDefined();

    const botEntity = elements.find(
      (element) =>
        element.type === 'circle' &&
        element.props['data-inspector-kind'] === 'bot' &&
        element.props.fill === '#44f'
    );
    expect(botEntity).toBeDefined();
  });

  it('hides optional diagnostics when toggles are disabled', () => {
    const tree = InspectorPrimitivesLayer({
      frame: BASE_FRAME,
      tileSize: 16,
      toScreenX: (x) => x * 16,
      toScreenY: (y) => y * 16,
      showFollowLinks: false,
      showVelocityVectors: false,
      showCollisionTint: false,
      showPathfindingPaths: false,
      showPhysicsShapes: false,
    });
    const elements = flattenElements(tree);

    const followLines = elements.filter(
      (element) =>
        element.type === 'line' &&
        element.props.stroke === '#1e90ff' &&
        element.props.strokeDasharray == null
    );
    expect(followLines).toHaveLength(0);

    const vectorArrows = elements.filter(
      (element) => element.type === 'polygon' && element.props.fill === '#1e90ff'
    );
    expect(vectorArrows).toHaveLength(0);

    const wallTile = elements.find(
      (element) =>
        element.type === 'rect' && element.props['data-inspector-kind'] === 'wall'
    );
    expect(wallTile?.props.fill).toBe('#888');

    const botEntity = elements.find(
      (element) =>
        element.type === 'circle' && element.props['data-inspector-kind'] === 'bot'
    );
    expect(botEntity?.props.fill).toBe('#4a4');
  });

  it('uses outline-only shapes in overlay mode', () => {
    const tree = InspectorPrimitivesLayer({
      frame: BASE_FRAME,
      tileSize: 16,
      toScreenX: (x) => x * 16,
      toScreenY: (y) => y * 16,
      overlayMode: true,
    });
    const elements = flattenElements(tree);

    const wallTile = elements.find(
      (element) =>
        element.type === 'rect' && element.props['data-inspector-kind'] === 'wall'
    );
    expect(wallTile?.props.fill).toBe('none');

    const botEntity = elements.find(
      (element) =>
        element.type === 'circle' && element.props['data-inspector-kind'] === 'bot'
    );
    expect(botEntity?.props.fill).toBe('none');

    const vectorArrowHead = elements.find(
      (element) => element.type === 'polygon' && element.props.stroke === '#1e90ff'
    );
    expect(vectorArrowHead?.props.fill).toBe('none');
  });

  it('renders pathfinding lines and physics overlays when enabled', () => {
    const tree = InspectorPrimitivesLayer({
      frame: BASE_FRAME,
      tileSize: 16,
      toScreenX: (x) => x * 16,
      toScreenY: (y) => y * 16,
      showPathfindingPaths: true,
      showPhysicsShapes: true,
    });
    const elements = flattenElements(tree);

    const pathLine = elements.find(
      (element) => element.type === 'polyline' && element.props.stroke === '#fc0'
    );
    expect(pathLine).toBeDefined();

    const physicsShape = elements.find(
      (element) => (element.type === 'circle' || element.type === 'rect') && element.props.stroke === '#1e90ff'
    );
    expect(physicsShape).toBeDefined();
  });

  it('renders ordered pathfinding in yellow with checkpoint squares', () => {
    const orderedPathFrame: InspectorFrame = {
      ...BASE_FRAME,
      pathfindingPaths: [
        {
          eid: 7,
          style: 'ordered',
          points: [
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 3, y: 2 },
          ],
          checkpoints: [
            { x: 2, y: 1 },
            { x: 3, y: 2 },
          ],
        },
      ],
      pathfindingPathCount: 1,
    };
    const tree = InspectorPrimitivesLayer({
      frame: orderedPathFrame,
      tileSize: 16,
      toScreenX: (x) => x * 16,
      toScreenY: (y) => y * 16,
      showPathfindingPaths: true,
      showPhysicsShapes: false,
    });
    const elements = flattenElements(tree);

    const orderedPathLine = elements.find(
      (element) => element.type === 'polyline' && element.props.stroke === '#fc0'
    );
    expect(orderedPathLine).toBeDefined();

    const checkpointRects = elements.filter(
      (element) => element.type === 'rect' && element.props.stroke === '#fc0'
    );
    expect(checkpointRects.length).toBeGreaterThan(0);
  });

  it('shows z-lift vector and airborne physics shape even without physics toggle', () => {
    const tree = InspectorPrimitivesLayer({
      frame: BASE_FRAME,
      tileSize: 16,
      toScreenX: (x) => x * 16,
      toScreenY: (y) => y * 16,
      showPhysicsShapes: false,
    });
    const elements = flattenElements(tree);

    const zLiftVector = elements.find(
      (element) => element.type === 'line' && element.props.stroke === '#ffd400' && element.props.strokeWidth === 3
    );
    expect(zLiftVector).toBeDefined();

    const physicsCircle = elements.find(
      (element) => element.type === 'circle' && element.props.stroke === '#1e90ff' && element.props.strokeDasharray === '2 2'
    );
    expect(physicsCircle).toBeDefined();
  });

  it('renders target pace in mini debug panel and no standalone pace label', () => {
    const tree = InspectorPrimitivesLayer({
      frame: BASE_FRAME,
      tileSize: 16,
      toScreenX: (x) => x * 16,
      toScreenY: (y) => y * 16,
    });
    const elements = flattenElements(tree);

    const miniPanelState = elements.find(
      (element) =>
        element.type === 'tspan' &&
        element.props.children === 'running' &&
        typeof element.props.x !== 'undefined'
    );
    expect(miniPanelState).toBeDefined();

    const standalonePaceLabel = elements.find(
      (element) => element.type === 'text' && element.props.fill === '#ffe26a'
    );
    expect(standalonePaceLabel).toBeUndefined();
  });
});
