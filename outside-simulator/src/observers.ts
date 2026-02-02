/**
 * Observer helper for getComponent/setComponent and IsA inheritance.
 * Registers onSet/onGet only for components that have state properties (SoA columns).
 * Pipeline components register via registerComponentForPipelineObserver; registerPipelineObservers iterates over them.
 *
 * @packageDocumentation
 */

import { observe, onGet, onSet } from 'bitecs';
import type { SimulatorWorld } from './world';

/** SoA component shape: record of number arrays keyed by property name. */
type SoAComponent = Record<string, number[]>;

/** Components that need pipeline observers (get/set for IsA inheritance). Mods can add via registerComponentForPipelineObserver. */
const pipelineObserverComponents: Record<string, unknown>[] = [];

/**
 * Returns the keys of component that are state properties (array-valued, SoA columns).
 * Tag-only components (e.g. RandomWalk) have no state keys.
 */
function getStateKeys(component: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const key in component) {
    if (Object.prototype.hasOwnProperty.call(component, key) && Array.isArray(component[key])) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * If the component has state properties (SoA columns), registers onSet and onGet
 * observers so getComponent/setComponent read/write the SoA arrays and IsA inheritance works.
 * No-op for tag-only components (no enumerable array-valued properties).
 */
export function applyInheritanceForStatefulComponents(
  world: SimulatorWorld,
  component: Record<string, unknown>
): void {
  const stateKeys = getStateKeys(component);
  if (stateKeys.length === 0) return;

  const soa = component as SoAComponent;
  observe(world, onSet(component), (eid: number, params: Record<string, number>) => {
    for (const key of stateKeys) {
      if (key in params) soa[key][eid] = params[key];
    }
  });
  observe(world, onGet(component), (eid: number) => {
    const result: Record<string, number> = {};
    for (const key of stateKeys) {
      result[key] = soa[key][eid];
    }
    return result;
  });
}

/**
 * Registers a component for pipeline observers. Called at load time by core components or mods.
 * registerPipelineObservers(world) will call applyInheritanceForStatefulComponents for each registered component.
 */
export function registerComponentForPipelineObserver(
  component: Record<string, unknown>
): void {
  pipelineObserverComponents.push(component);
}

/**
 * Registers observers for all components in the pipeline observer registry.
 * Called from createWorld so getComponent/setComponent and IsA inheritance work.
 */
export function registerPipelineObservers(world: SimulatorWorld): void {
  for (const comp of pipelineObserverComponents) {
    applyInheritanceForStatefulComponents(world, comp);
  }
}
