export interface Position2D {
  x: number;
  y: number;
}

export interface BotParitySummary {
  expectedCount: number;
  legacyCount: number;
  unifiedCount: number;
  missingInLegacy: string[];
  missingInUnified: string[];
  positionMismatches: Array<{
    id: string;
    legacy: Position2D;
    unified: Position2D;
  }>;
}

export interface TerrainParitySummary {
  expectedCount: number;
  legacyCount: number;
  unifiedCount: number;
}

export interface ParitySummary {
  ok: boolean;
  bot: BotParitySummary;
  terrain: TerrainParitySummary;
}

export function computeBotParitySummary(args: {
  expectedBotIds: string[];
  legacyBotPositions: Map<string, Position2D>;
  unifiedBotPositions: Map<string, Position2D>;
  tolerancePx: number;
}): BotParitySummary {
  const expected = new Set(args.expectedBotIds);

  const missingInLegacy: string[] = [];
  const missingInUnified: string[] = [];
  const positionMismatches: BotParitySummary['positionMismatches'] = [];

  for (const id of expected) {
    const legacy = args.legacyBotPositions.get(id);
    const unified = args.unifiedBotPositions.get(id);

    if (!legacy) {
      missingInLegacy.push(id);
      continue;
    }
    if (!unified) {
      missingInUnified.push(id);
      continue;
    }

    const dx = Math.abs(legacy.x - unified.x);
    const dy = Math.abs(legacy.y - unified.y);
    if (dx > args.tolerancePx || dy > args.tolerancePx) {
      positionMismatches.push({ id, legacy, unified });
    }
  }

  missingInLegacy.sort();
  missingInUnified.sort();
  positionMismatches.sort((a, b) => a.id.localeCompare(b.id));

  return {
    expectedCount: expected.size,
    legacyCount: args.legacyBotPositions.size,
    unifiedCount: args.unifiedBotPositions.size,
    missingInLegacy,
    missingInUnified,
    positionMismatches,
  };
}

export function computeParitySummary(args: {
  expectedBotIds: string[];
  expectedTerrainCount: number;
  legacyBotPositions: Map<string, Position2D>;
  unifiedBotPositions: Map<string, Position2D>;
  legacyTerrainCount: number;
  unifiedTerrainCount: number;
  tolerancePx: number;
}): ParitySummary {
  const bot = computeBotParitySummary({
    expectedBotIds: args.expectedBotIds,
    legacyBotPositions: args.legacyBotPositions,
    unifiedBotPositions: args.unifiedBotPositions,
    tolerancePx: args.tolerancePx,
  });

  const terrain: TerrainParitySummary = {
    expectedCount: args.expectedTerrainCount,
    legacyCount: args.legacyTerrainCount,
    unifiedCount: args.unifiedTerrainCount,
  };

  const ok =
    bot.missingInLegacy.length === 0 &&
    bot.missingInUnified.length === 0 &&
    bot.positionMismatches.length === 0 &&
    terrain.expectedCount === terrain.legacyCount &&
    terrain.expectedCount === terrain.unifiedCount;

  return { ok, bot, terrain };
}

