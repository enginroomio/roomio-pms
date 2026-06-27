'use client';

import { useEffect } from 'react';
import { reloadPropertyInventory } from '@/lib/client/reload-property-inventory';
import { useProperty } from '@/components/property/PropertyProvider';

export function PropertyInventoryHydrator() {
  const { propertyId } = useProperty();

  useEffect(() => {
    let cancelled = false;
    void reloadPropertyInventory().catch(() => undefined).finally(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return null;
}
