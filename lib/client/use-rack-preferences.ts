'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  DEFAULT_RACK_PREFERENCES,
  getRackPreferences,
  subscribeRackPreferences,
  updateRackPreferences,
  type RackPreferences,
} from '@/lib/client/rack-preferences';

export function useRackPreferences() {
  const prefs = useSyncExternalStore(
    subscribeRackPreferences,
    getRackPreferences,
    () => DEFAULT_RACK_PREFERENCES,
  );

  const update = useCallback((patch: Partial<RackPreferences>) => {
    updateRackPreferences(patch);
  }, []);

  return { prefs, update };
}
