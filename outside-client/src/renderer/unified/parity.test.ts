import { describe, expect, it } from 'vitest';

import { computeParitySummary } from './parity';

describe('computeParitySummary', () => {
  it('reports ok when counts match and positions are within tolerance', () => {
    const legacyBotPositions = new Map([
      ['b1', { x: 10, y: 20 }],
      ['b2', { x: 30, y: 40 }],
    ]);
    const unifiedBotPositions = new Map([
      ['b1', { x: 10.2, y: 19.9 }],
      ['b2', { x: 29.9, y: 40.1 }],
    ]);

    const summary = computeParitySummary({
      expectedBotIds: ['b1', 'b2'],
      expectedTerrainCount: 2,
      legacyBotPositions,
      unifiedBotPositions,
      legacyTerrainCount: 2,
      unifiedTerrainCount: 2,
      tolerancePx: 0.5,
    });

    expect(summary.ok).toBe(true);
    expect(summary.bot.missingInLegacy).toEqual([]);
    expect(summary.bot.missingInUnified).toEqual([]);
    expect(summary.bot.positionMismatches).toEqual([]);
  });

  it('flags missing bots and position mismatches', () => {
    const legacyBotPositions = new Map([['b1', { x: 10, y: 20 }]]);
    const unifiedBotPositions = new Map([
      ['b1', { x: 999, y: 20 }],
      ['b2', { x: 30, y: 40 }],
    ]);

    const summary = computeParitySummary({
      expectedBotIds: ['b1', 'b2'],
      expectedTerrainCount: 1,
      legacyBotPositions,
      unifiedBotPositions,
      legacyTerrainCount: 1,
      unifiedTerrainCount: 1,
      tolerancePx: 0.5,
    });

    expect(summary.ok).toBe(false);
    expect(summary.bot.missingInLegacy).toEqual(['b2']);
    expect(summary.bot.missingInUnified).toEqual([]);
    expect(summary.bot.positionMismatches).toEqual([
      { id: 'b1', legacy: { x: 10, y: 20 }, unified: { x: 999, y: 20 } },
    ]);
  });
});

