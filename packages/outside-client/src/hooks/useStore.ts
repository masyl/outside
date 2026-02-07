import { useSyncExternalStore } from 'react';
import { Store } from '../store/store';
import { WorldState } from '@outside/core';

export function useWorldState(store: Store): WorldState {
  return useSyncExternalStore(
    (callback) => {
      const unsubscribe = store.subscribe(() => {
        callback();
      });
      return unsubscribe;
    },
    () => store.getState()
  );
}
