/**
 * Type declarations for wavefunctioncollapse (SimpleTiledModel).
 * After a successful generate(), model.observed[i] is the tile index at cell i (i = x + y * width).
 */
declare module 'wavefunctioncollapse' {
  export interface SimpleTiledModelInstance {
    generate(rng?: () => number): boolean;
    isGenerationComplete(): boolean;
    /** Flat array of tile indices; index = x + y * width. Set after successful generate(). */
    observed: number[] | null;
    FMX: number;
    FMY: number;
  }

  export interface SimpleTiledModelData {
    tilesize?: number;
    tiles: Array<{
      name: string;
      symmetry: string;
      bitmap: Uint8Array;
      weight?: number;
    }>;
    neighbors: Array<{ left: string; right: string }>;
    unique?: boolean;
    subsets?: Record<string, string[]>;
  }

  export const SimpleTiledModel: new (
    data: SimpleTiledModelData,
    subsetName: string | null,
    width: number,
    height: number,
    periodic: boolean
  ) => SimpleTiledModelInstance;
}
