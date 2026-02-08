/**
 * Render stream helpers for renderer sync.
 * @packageDocumentation
 */

import { createObserverSerializer } from './serialization';
import type { SimulatorWorld } from './world';
import Observed from './components/Observed';
import { RENDER_COMPONENTS } from './render-schema';

export function createRenderObserverSerializer(world: SimulatorWorld) {
  return createObserverSerializer(world, Observed, [...RENDER_COMPONENTS]);
}
