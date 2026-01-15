import { describe, it, expect } from 'vitest';
import { Random } from './random';

describe('Random', () => {
  it('should produce consistent results with same seed', () => {
    const random1 = new Random(42);
    const random2 = new Random(42);

    expect(random1.next()).toBe(random2.next());
    expect(random1.next()).toBe(random2.next());
  });

  it('should produce different results with different seeds', () => {
    const random1 = new Random(42);
    const random2 = new Random(123);

    expect(random1.next()).not.toBe(random2.next());
  });

  it('should produce numbers in expected range for next()', () => {
    const random = new Random(42);

    for (let i = 0; i < 100; i++) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(4294967296); // 2^32
    }
  });

  it('should produce numbers in expected range for nextFloat()', () => {
    const random = new Random(42);

    for (let i = 0; i < 100; i++) {
      const value = random.nextFloat();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should produce numbers in expected range for nextInt()', () => {
    const random = new Random(42);

    for (let i = 0; i < 100; i++) {
      const value = random.nextInt(0, 10);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(10);
    }
  });

  it('should be deterministic', () => {
    const random = new Random(42);
    const sequence = Array.from({ length: 10 }, () => random.next());

    const random2 = new Random(42);
    const sequence2 = Array.from({ length: 10 }, () => random2.next());

    expect(sequence).toEqual(sequence2);
  });
});
