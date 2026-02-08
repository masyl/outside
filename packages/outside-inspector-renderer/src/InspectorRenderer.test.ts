import { describe, expect, it } from 'vitest';
import React, { isValidElement, type ReactElement, type ReactNode } from 'react';
import { InspectorRenderer } from './InspectorRenderer';
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
      x: 1,
      y: 1,
      diameter: 1,
      kind: 'bot',
      directionRad: 0,
      speedTilesPerSec: 1,
      inCollidedCooldown: true,
      collidedTicksRemaining: 2,
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
  collisionEntityCount: 1,
  collisionTileCount: 1,
  followLinkCount: 1,
  unknownCount: 0,
};

describe('InspectorRenderer', () => {
  it('renders follow links, velocity vectors, and collision tint by default', () => {
    const tree = InspectorRenderer({
      frame: BASE_FRAME,
      width: 800,
      height: 600,
      tileSize: 16,
      centerX: 0,
      centerY: 0,
    });
    const elements = flattenElements(tree);

    const followLines = elements.filter(
      (element) => element.type === 'line' && element.props.stroke === '#6af'
    );
    expect(followLines.length).toBeGreaterThan(0);

    const vectorArrows = elements.filter(
      (element) => element.type === 'polygon' && element.props.fill === '#fc6'
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
        element.props.fill === '#f44'
    );
    expect(botEntity).toBeDefined();
  });

  it('hides optional diagnostics when toggles are disabled', () => {
    const tree = InspectorRenderer({
      frame: BASE_FRAME,
      width: 800,
      height: 600,
      tileSize: 16,
      centerX: 0,
      centerY: 0,
      showFollowLinks: false,
      showVelocityVectors: false,
      showCollisionTint: false,
    });
    const elements = flattenElements(tree);

    const followLines = elements.filter(
      (element) => element.type === 'line' && element.props.stroke === '#6af'
    );
    expect(followLines).toHaveLength(0);

    const vectorArrows = elements.filter(
      (element) => element.type === 'polygon' && element.props.fill === '#fc6'
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
});

