'use client';

import { ChevronDown } from 'lucide-react';
import { useProperty } from '@/components/property/PropertyProvider';

export function PropertySwitcher() {
  const { properties, activeProperty, propertyId, setPropertyId, loading } = useProperty();

  if (loading && properties.length <= 1) {
    return (
      <div className="roomio-header-hotel">
        <span className="roomio-header-hotel-name">{activeProperty?.name ?? '…'}</span>
        <ChevronDown size={14} />
      </div>
    );
  }

  return (
    <label className="roomio-header-hotel roomio-header-hotel--select">
      <select
        className="roomio-header-hotel-select"
        value={propertyId}
        onChange={(e) => setPropertyId(e.target.value)}
        aria-label="Otel seçimi"
      >
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}{p.city ? ` — ${p.city}` : ''}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden />
    </label>
  );
}
