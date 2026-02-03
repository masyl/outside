/**
 * Outside Utils - Shared utilities for the Outside game project.
 * 
 * Contains utilities for:
 * - Random number generation
 * - Movement and time
 *
 * @packageDocumentation
 */

export const VERSION = '0.1.0';

export { Random } from './random';
export {
  distancePerTic,
  stepPosition,
  type Position,
} from './movement';
export { snapToGrid } from './grid';
