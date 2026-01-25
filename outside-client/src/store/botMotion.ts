import type { BotMotionState, Direction, Velocity } from '@outside/core';

import { directionFromVelocity } from '../utils/direction';

type SeededKey = {
  seed: number;
  botId: string;
};

function fnv1a32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample01(key: SeededKey, secondIndex: number, stream: number): number {
  // Mix seed, botId hash, secondIndex, and stream into one 32-bit seed.
  const botHash = fnv1a32(key.botId);
  const mixed =
    (key.seed ^ botHash ^ Math.imul(secondIndex | 0, 0x9e3779b9) ^ Math.imul(stream | 0, 0x85ebca6b)) >>>
    0;
  return mulberry32(mixed)();
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function wrapAngleRad(angle: number): number {
  // Wrap into [-π, π] for numerical stability.
  const twoPi = Math.PI * 2;
  let a = angle % twoPi;
  if (a > Math.PI) a -= twoPi;
  if (a < -Math.PI) a += twoPi;
  return a;
}

export type BotMotionUpdate = {
  motion: BotMotionState;
  velocity: Velocity;
  facing: Direction;
  isMoving: boolean;
};

export function initBotMotion(key: SeededKey): BotMotionUpdate {
  const headingRad = sample01(key, 0, 10) * Math.PI * 2 - Math.PI;
  const speedTilesPerSec = 1.25;
  const velocity = {
    x: Math.cos(headingRad) * speedTilesPerSec,
    y: Math.sin(headingRad) * speedTilesPerSec,
  };

  return {
    motion: {
      headingRad,
      angularVelocityRadPerSec: 0,
      speedTilesPerSec,
    },
    velocity,
    facing: directionFromVelocity(velocity, 'down'),
    isMoving: true,
  };
}

export function stepBotMotion(args: {
  key: SeededKey;
  timeMs: number;
  dtMs: number;
  previousFacing?: Direction;
  previousMotion?: BotMotionState;
}): BotMotionUpdate {
  const dtSec = args.dtMs / 1000;
  const timeSec = args.timeMs / 1000;
  const secondIndex = Math.floor(timeSec);

  const prev =
    args.previousMotion ??
    initBotMotion(args.key).motion;

  // --- Targets (updated ~once per second, but approached smoothly) ---
  // Speed oscillation between 0.5 and 2.0 tiles/sec.
  const speedMin = 0.5;
  const speedMax = 2.0;
  const speedBase = 1.25;
  const speedAmp = 0.75;
  const speedPeriodSec = 6;
  const speedPhaseOffset = sample01(args.key, 0, 20) * Math.PI * 2;
  const speedJitter = (sample01(args.key, secondIndex, 21) - 0.5) * 0.2; // ±0.1
  const targetSpeed = clamp(
    speedBase + speedAmp * Math.sin((2 * Math.PI * timeSec) / speedPeriodSec + speedPhaseOffset) + speedJitter,
    speedMin,
    speedMax
  );

  // Direction rotation with momentum, around ~15°/sec average magnitude.
  const baseTurnRate = (15 * Math.PI) / 180; // rad/sec
  const sign = sample01(args.key, secondIndex, 30) < 0.5 ? -1 : 1;
  const mag = 0.5 + sample01(args.key, secondIndex, 31); // 0.5..1.5
  const targetAngularVelocity = sign * baseTurnRate * mag;

  // --- Smoothly approach targets ---
  const turnResponse = 2.5;
  const speedResponse = 1.5;

  const angularVelocityRadPerSec =
    prev.angularVelocityRadPerSec +
    (targetAngularVelocity - prev.angularVelocityRadPerSec) * turnResponse * dtSec;

  const speedTilesPerSec =
    clamp(
      prev.speedTilesPerSec + (targetSpeed - prev.speedTilesPerSec) * speedResponse * dtSec,
      speedMin,
      speedMax
    );

  const headingRad = wrapAngleRad(prev.headingRad + angularVelocityRadPerSec * dtSec);

  const velocity: Velocity = {
    x: Math.cos(headingRad) * speedTilesPerSec,
    y: Math.sin(headingRad) * speedTilesPerSec,
  };

  const facing = directionFromVelocity(velocity, args.previousFacing ?? 'down');

  return {
    motion: { headingRad, angularVelocityRadPerSec, speedTilesPerSec },
    velocity,
    facing,
    isMoving: speedTilesPerSec > 0.001,
  };
}

