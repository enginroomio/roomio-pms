'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { useReservations } from '@/lib/client/use-reservations';
import { getInHouseGuests } from '@/lib/data/reception';
import { DEFAULT_PBX_CONFIG, type PbxConfig } from '@/lib/integrations/pbx/types';

function roomToExtension(roomNo: string, mappings: Record<string, string>) {
  return mappings[roomNo] ?? roomNo;
}

function extensionToRoom(ext: string, mappings: Record<string, string>) {
  const hit = Object.entries(mappings).find(([, v]) => v === ext);
  return hit?.[0] ?? ext;
}

export function PbxLookupPanel() {
  const { reservations, loading } = useReservations();
  const inhouse = useMemo(() => getInHouseGuests(reservations), [reservations]);
  const [config, setConfig] = useState<PbxConfig>(DEFAULT_PBX_CONFIG);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void roomioFetch('/api/integrations/pbx/config')
      .then((r) => r.json())
      .then((j: PbxConfig) => setConfig({ ...DEFAULT_PBX_CONFIG, ...j }));
  }, []);

  const mappings = useMemo(() => config.extensionMappings ?? {}, [config.extensionMappings]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inhouse
      .map((g) => ({
        ...g,
        extension: g.roomNo ? roomToExtension(g.roomNo, mappings) : '—',
      }))
      .filter((g) => {
        if (!q) return true;
        return (
          g.guestName.toLowerCase().includes(q)
          || (g.roomNo ?? '').includes(q)
          || String(g.extension).includes(q)
          || g.refNo.toLowerCase().includes(q)
        );
      });
  }, [inhouse, mappings, query]);

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Misafir — dahili eşleştirme</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Konaklayan misafirleri oda numarası, dahili veya isimle arayın. Eşleme tablosu{' '}
          <Link href="/settings/integrations/pbx" className="roomio-link">santral ayarları</Link>ndan gelir.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <input
            className="roomio-input"
            placeholder="Oda, dahili, misafir veya rez. no"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ minWidth: 280 }}
          />
          <Button variant="ghost" href="/settings/integrations/pbx">Extension tablosu</Button>
          <Button variant="ghost" href="/reception/inhouse">Konaklayanlar</Button>
        </div>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <span className="roomio-badge">{rows.length} eşleşme</span>
          <span className="roomio-badge">{inhouse.length} konaklayan</span>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Oda</th>
              <th>UCM dahili</th>
              <th>Misafir</th>
              <th>Rez. no</th>
              <th>Çıkış</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="roomio-table-empty">Yükleniyor…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="roomio-table-empty">Sonuç yok.</td></tr>
            ) : rows.map((g) => (
              <tr key={g.id}>
                <td><strong>{g.roomNo ?? '—'}</strong></td>
                <td>{g.extension}</td>
                <td>{g.guestName}</td>
                <td>{g.refNo}</td>
                <td>{g.checkOut}</td>
                <td>
                  <Link href={`/reception/guest/${g.id}`} className="roomio-link">Folyo</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {query.trim() && /^\d{2,4}$/.test(query.trim()) ? (
          <p className="roomio-page-desc" style={{ padding: '8px 16px' }}>
            Dahili {query.trim()} → oda {extensionToRoom(query.trim(), mappings)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
