/**
 * Simple seeded pseudo-random number generator
 * Uses a linear congruential generator (LCG)
 */
export class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive)
   */
  next(): number {
    // LCG parameters (using values from Numerical Recipes)
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  /**
   * Returns a pseudo-random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Returns true with probability p
   */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /**
   * Returns a random element from an array
   */
  choice<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[this.nextInt(0, array.length)];
  }
}
