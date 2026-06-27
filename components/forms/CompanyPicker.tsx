'use client';

import { useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';

type Company = { code: string; name: string };

type Props = {
  senderType: string;
  companyCode: string;
  onSelect: (code: string, name: string) => void;
};

export function CompanyPicker({ senderType, companyCode, onSelect }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    if (senderType !== 'Şirket') return;
    void roomioFetch('/api/companies')
      .then((r) => r.json())
      .then((j: { companies?: Company[] }) => setCompanies(j.companies ?? []));
  }, [senderType]);

  if (senderType !== 'Şirket') return null;

  return (
    <label className="roomio-field roomio-field--full" style={{ marginBottom: 12 }}>
      <span>Şirket (master)</span>
      <select
        className="roomio-select"
        value={companyCode}
        onChange={(e) => {
          const c = companies.find((x) => x.code === e.target.value);
          if (c) onSelect(c.code, c.name);
        }}
      >
        <option value="">Şirket seçin…</option>
        {companies.map((c) => (
          <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
        ))}
      </select>
    </label>
  );
}
