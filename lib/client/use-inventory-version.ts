'use client';

import { useEffect, useState } from 'react';
import { INVENTORY_HYDRATED_EVENT } from '@/lib/client/inventory-events';

/** Rack ve oda listelerinin DB hydrate sonrası yeniden hesaplanması için sürüm sayacı */
export function useInventoryVersion(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onHydrated = () => setVersion((v) => v + 1);
    window.addEventListener(INVENTORY_HYDRATED_EVENT, onHydrated);
    return () => window.removeEventListener(INVENTORY_HYDRATED_EVENT, onHydrated);
  }, []);

  return version;
}
