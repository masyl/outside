export function computeWalkFrameIndex(args: {
  timeMs: number;
  speedTilesPerSec: number;
  frames: number;
}): number {
  const { timeMs, speedTilesPerSec, frames } = args;
  if (!(frames > 0)) return 0;
  if (!(speedTilesPerSec > 0)) return 0;

  // 1 cycle per tile traveled:
  // cyclesPerSec = speedTilesPerSec (tiles/sec)
  // framesPerSec = cyclesPerSec * frames
  const framesPerSec = speedTilesPerSec * frames;
  const idx = Math.floor((timeMs / 1000) * framesPerSec) % frames;
  return idx < 0 ? idx + frames : idx;
}

