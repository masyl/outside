import { vi } from 'vitest';

// Mock Canvas API for browser environment
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn((cb) => setTimeout(cb, 16)),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn(),
});

// Mock WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: vi.fn(() => ({
    getExtension: vi.fn(() => null),
    getParameter: vi.fn(() => 1),
    getShaderPrecisionFormat: vi.fn(() => ({ precision: 1, rangeMin: 1, rangeMax: 1 })),
  })),
});

// Global test utilities
export const testUtils = {
  createMockCanvas: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    return canvas;
  },
};
