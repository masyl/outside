import { runTics } from './run';
import { createWorld, type Physics3dRuntimeMode } from './world';
import { spawnBot } from './prefabs/bot';
import { drainEventQueue } from './events-api';

export interface Physics3dRuntimeBenchmarkOptions {
  rounds: number;
  ticsPerRound: number;
  seed: number;
  botCount: number;
  worldRadius: number;
}

export interface Physics3dRuntimeBenchmarkSummary {
  runtimeMode: Physics3dRuntimeMode;
  rounds: number;
  totalMs: number;
  averageMsPerRound: number;
  averageMsPerTic: number;
  totalCollisionEvents: number;
}

export interface Physics3dRuntimeBenchmarkResult {
  options: Physics3dRuntimeBenchmarkOptions;
  summaries: Record<Physics3dRuntimeMode, Physics3dRuntimeBenchmarkSummary>;
}

const DEFAULT_OPTIONS: Physics3dRuntimeBenchmarkOptions = {
  rounds: 10,
  ticsPerRound: 200,
  seed: 42,
  botCount: 32,
  worldRadius: 6,
};

function nowMs(): number {
  return Date.now();
}

function withDefaults(
  options?: Partial<Physics3dRuntimeBenchmarkOptions>
): Physics3dRuntimeBenchmarkOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...(options ?? {}),
  };
}

function createRoundWorld(
  runtimeMode: Physics3dRuntimeMode,
  options: Physics3dRuntimeBenchmarkOptions,
  round: number
) {
  const world = createWorld({
    seed: options.seed + round * 101,
    ticDurationMs: 50,
    physics3dRuntimeMode: runtimeMode,
  });

  const count = Math.max(2, options.botCount);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const x = Math.cos(angle) * options.worldRadius;
    const y = Math.sin(angle) * options.worldRadius;
    const towardCenter = Math.atan2(-y, -x);
    spawnBot(world, {
      x,
      y,
      diameter: 1.2,
      urge: 'none',
      directionRad: towardCenter,
      tilesPerSec: 1.8,
    });
  }

  return world;
}

function runMode(
  runtimeMode: Physics3dRuntimeMode,
  options: Physics3dRuntimeBenchmarkOptions
): Physics3dRuntimeBenchmarkSummary {
  let totalMs = 0;
  let totalCollisionEvents = 0;
  const rounds = Math.max(1, options.rounds);

  for (let round = 0; round < rounds; round++) {
    const world = createRoundWorld(runtimeMode, options, round);
    const start = nowMs();
    runTics(world, Math.max(1, options.ticsPerRound));
    totalMs += nowMs() - start;
    totalCollisionEvents += drainEventQueue(world).filter((e) => e.type === 'collision').length;
  }

  return {
    runtimeMode,
    rounds,
    totalMs,
    averageMsPerRound: totalMs / rounds,
    averageMsPerTic: totalMs / (rounds * Math.max(1, options.ticsPerRound)),
    totalCollisionEvents,
  };
}

/**
 * Runs a deterministic benchmark scenario in both physics runtime modes.
 * Returns timing and collision counts for side-by-side comparison.
 */
export function runPhysics3dRuntimeBenchmark(
  options?: Partial<Physics3dRuntimeBenchmarkOptions>
): Physics3dRuntimeBenchmarkResult {
  const resolved = withDefaults(options);
  return {
    options: resolved,
    summaries: {
      ts: runMode('ts', resolved),
      lua: runMode('lua', resolved),
    },
  };
}
