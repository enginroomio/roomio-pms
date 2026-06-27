'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { INVENTORY_HYDRATED_EVENT, dispatchPropertyChanged } from '@/lib/client/inventory-events';
import { DEFAULT_PROPERTY_ID, type PropertyInfo } from '@/lib/server/property-context';
import { getActivePropertyId, roomioFetch, setActivePropertyId } from '@/lib/client/api';

type PropertyContextValue = {
  properties: PropertyInfo[];
  activeProperty: PropertyInfo | null;
  propertyId: string;
  setPropertyId: (id: string) => void;
  loading: boolean;
  refreshProperties: () => Promise<void>;
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

  const refreshProperties = useCallback(async () => {
    const res = await roomioFetch('/api/properties');
    const j = (await res.json()) as { properties?: PropertyInfo[] };
    if (j.properties?.length) setProperties(j.properties);
  }, []);

  useEffect(() => {
    const stored = getActivePropertyId();
    setPropertyIdState(stored);
    setLoading(true);
    void refreshProperties().finally(() => setLoading(false));
  }, [propertyId, refreshProperties]);

  useEffect(() => {
    const onInventory = () => {
      void refreshProperties();
    };
    window.addEventListener(INVENTORY_HYDRATED_EVENT, onInventory);
    return () => window.removeEventListener(INVENTORY_HYDRATED_EVENT, onInventory);
  }, [refreshProperties]);

  const setPropertyId = useCallback((id: string) => {
    setActivePropertyId(id);
    setPropertyIdState(id);
    dispatchPropertyChanged(id);
  }, []);

  const activeProperty = useMemo(
    () => properties.find((p) => p.id === propertyId) ?? properties[0] ?? FALLBACK,
    [properties, propertyId],
  );

  const value = useMemo(
    () => ({ properties, activeProperty, propertyId, setPropertyId, loading, refreshProperties }),
    [properties, activeProperty, propertyId, setPropertyId, loading, refreshProperties],
  );

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

export function useProperty(): PropertyContextValue {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error('useProperty requires PropertyProvider');
  return ctx;
}
