import { describe, it, expect, vi } from 'vitest';

describe('Client Environment Setup', () => {
  it('should have Canvas API mocked', () => {
    expect(typeof window.requestAnimationFrame).toBe('function');
    expect(typeof window.cancelAnimationFrame).toBe('function');
  });

  it('should create mock canvas context', () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl');

    expect(context).toBeDefined();
    expect(typeof context?.getExtension).toBe('function');
  });

  it('should mock PIXI.js imports', async () => {
    const pixi = await import('pixi.js');

    expect(pixi.Application).toBeDefined();
    expect(pixi.Container).toBeDefined();
    expect(pixi.Sprite).toBeDefined();
  });
});
