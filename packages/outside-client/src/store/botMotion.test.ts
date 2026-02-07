import { describe, expect, it } from 'vitest';

import { initBotMotion, stepBotMotion } from './botMotion';

describe('botMotion', () => {
  it('is deterministic for the same seed/botId/time', () => {
    const key = { seed: 42, botId: 'bot-1' };

    const a = stepBotMotion({ key, timeMs: 1000, dtMs: 50 });
    const b = stepBotMotion({ key, timeMs: 1000, dtMs: 50 });

    expect(a).toEqual(b);
  });

  it('keeps speed within [0.5, 2.0] tiles/sec', () => {
    const key = { seed: 42, botId: 'bot-1' };
    let prev = initBotMotion(key);

    for (let i = 0; i < 400; i++) {
      const t = i * 50;
      const next = stepBotMotion({
        key,
        timeMs: t,
        dtMs: 50,
        previousMotion: prev.motion,
        previousFacing: prev.facing,
      });
      const speed = Math.hypot(next.velocity.x, next.velocity.y);
      expect(speed).toBeGreaterThanOrEqual(0.5 - 1e-6);
      expect(speed).toBeLessThanOrEqual(2.0 + 1e-6);
      prev = next;
    }
  });
});

