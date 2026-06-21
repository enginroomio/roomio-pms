'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PROPERTY_ID, type PropertyInfo } from '@/lib/server/property-context';
import { getActivePropertyId, roomioFetch, setActivePropertyId } from '@/lib/client/api';

type PropertyContextValue = {
  properties: PropertyInfo[];
  activeProperty: PropertyInfo | null;
  propertyId: string;
  setPropertyId: (id: string) => void;
  loading: boolean;
};

const PropertyContext = createContext<PropertyContextValue | null>(null);

const FALLBACK: PropertyInfo = {
  id: DEFAULT_PROPERTY_ID,
  code: 'SAPPHIRE-IST',
  name: 'Hotel Sapphire İstanbul',
  city: 'İstanbul',
  totalRooms: 77,
  isDefault: true,
};

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<PropertyInfo[]>([FALLBACK]);
  const [propertyId, setPropertyIdState] = useState(DEFAULT_PROPERTY_ID);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getActivePropertyId();
    setPropertyIdState(stored);
    void roomioFetch('/api/properties')
      .then((r) => r.json())
      .then((j: { properties?: PropertyInfo[] }) => {
        if (j.properties?.length) setProperties(j.properties);
      })
      .finally(() => setLoading(false));
  }, []);

  const setPropertyId = useCallback((id: string) => {
    setActivePropertyId(id);
    setPropertyIdState(id);
  }, []);

  const activeProperty = useMemo(
    () => properties.find((p) => p.id === propertyId) ?? properties[0] ?? FALLBACK,
    [properties, propertyId],
  );

  const value = useMemo(
    () => ({ properties, activeProperty, propertyId, setPropertyId, loading }),
    [properties, activeProperty, propertyId, setPropertyId, loading],
  );

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

export function useProperty(): PropertyContextValue {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error('useProperty requires PropertyProvider');
  return ctx;
}
