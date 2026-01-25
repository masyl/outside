export function computeWalkFrameIndex(args: {
  timeMs: number;
  speedTilesPerSec: number;
  frames: number;
}): number {
  const { timeMs, speedTilesPerSec, frames } = args;
  if (!(frames > 0)) return 0;
  if (!(speedTilesPerSec > 0)) return 0;

  // 1.5 cycles per tile traveled (50% faster):
  // cyclesPerSec = speedTilesPerSec (tiles/sec)
  // framesPerSec = cyclesPerSec * frames * 1.5
  const framesPerSec = speedTilesPerSec * frames * 1.5;
  const idx = Math.floor((timeMs / 1000) * framesPerSec) % frames;
  return idx < 0 ? idx + frames : idx;
}

