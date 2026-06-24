'use client';

import { useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';

type Agency = { code: string; name: string; commission: number };

type Props = {
  senderType: string;
  agencyCode: string;
  onSelect: (code: string, name: string, commission: number) => void;
};

export function AgencyPicker({ senderType, agencyCode, onSelect }: Props) {
  const [agencies, setAgencies] = useState<Agency[]>([]);

  useEffect(() => {
    if (senderType !== 'Acenta') return;
    void roomioFetch('/api/agencies')
      .then((r) => r.json())
      .then((j: { agencies?: Agency[] }) => setAgencies(j.agencies ?? []));
  }, [senderType]);

  if (senderType !== 'Acenta') return null;

  return (
    <label className="roomio-field roomio-field--full" style={{ marginBottom: 12 }}>
      <span>Acenta kontratı</span>
      <select
        className="roomio-select"
        value={agencyCode}
        onChange={(e) => {
          const a = agencies.find((x) => x.code === e.target.value);
          if (a) onSelect(a.code, a.name, a.commission);
        }}
      >
        <option value="">Acenta seçin…</option>
        {agencies.map((a) => (
          <option key={a.code} value={a.code}>{a.code} — {a.name} (%{a.commission})</option>
        ))}
      </select>
    </label>
  );
}
