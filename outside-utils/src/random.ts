/**
 * Seeded pseudo-random number generator.
 * Implementation of a Linear Congruential Generator (LCG).
 * Parameters from Numerical Recipes.
 *
 * @packageDocumentation
 */

export class Random {
  private seed: number;

  private static readonly A = 1664525;
  private static readonly C = 1013904223;
  private static readonly M = 4294967296; // 2^32

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Returns a pseudo-random integer between 0 and 2^32 - 1
   */
  next(): number {
    this.seed = (Random.A * this.seed + Random.C) % Random.M;
    return this.seed;
  }

  /**
   * Returns a pseudo-random floating point number between 0 (inclusive) and 1 (exclusive)
   */
  nextFloat(): number {
    return this.next() / Random.M;
  }

  /**
   * Returns a pseudo-random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min)) + min;
  }

  /**
   * Returns true with probability p (0 ≤ p ≤ 1).
   */
  chance(p: number): boolean {
    return this.nextFloat() < p;
  }

  /**
   * Returns a random element from an array, or undefined if empty.
   */
  choice<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[this.nextInt(0, array.length)];
  }
}
