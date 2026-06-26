'use client';

import { Button } from '@/components/ui';

const DEMO_DISCOUNTS = [
  { code: 'STAFF', desc: 'Personel indirimi', rate: '%15' },
  { code: 'LOYAL', desc: 'Sadakat üyesi', rate: '%10' },
  { code: 'COMP', desc: 'İkram', rate: '%100' },
  { code: 'HAPPY', desc: 'Happy hour', rate: '%20' },
] as const;

export function PosDiscountsPanel() {
  return (
    <div className="roomio-card" style={{ padding: 20 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">POS İndirim Tanımları</h2>
        <Button variant="ghost" href="/settings?section=extras">Ekstra tanımları</Button>
      </div>
      <p className="roomio-page-desc" style={{ marginTop: 8 }}>
        Restoran ve bar POS indirim kodları — Elektra ARKA BÜRO menüsü.
      </p>
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead><tr><th>Kod</th><th>Açıklama</th><th>Oran</th></tr></thead>
          <tbody>
            {DEMO_DISCOUNTS.map((d) => (
              <tr key={d.code}>
                <td><strong>{d.code}</strong></td>
                <td>{d.desc}</td>
                <td>{d.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
