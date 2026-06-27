'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';

type HkRoute = {
  id: string;
  code: string;
  name: string;
  floors: number[];
  staffName?: string;
  roomCount?: number;
};

export function HkRoutingPanel() {
  const [routes, setRoutes] = useState<HkRoute[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Array<{ roomNo: string; hkStatus: string; assignedTo: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/hk/routes');
      const json = (await res.json()) as { routes?: HkRoute[] };
      setRoutes(json.routes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRooms = useCallback(async (routeCode: string) => {
    const res = await roomioFetch(`/api/hk/routes?route=${encodeURIComponent(routeCode)}`);
    const json = (await res.json()) as { rooms?: Array<{ roomNo: string; hkStatus: string; assignedTo: string | null }> };
    setRooms(json.rooms ?? []);
  }, []);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  useEffect(() => {
    if (!selected) {
      setRooms([]);
      return;
    }
    void loadRooms(selected);
  }, [selected, loadRooms]);

  return (
    <div className="roomio-card" style={{ marginBottom: 16 }}>
      <h2 className="roomio-card-title">HK routing (kat rotaları)</h2>
      <p className="roomio-page-desc">Fidelio HK routing — odalar kata göre route A/B/C ataması.</p>
      {loading ? (
        <p className="roomio-page-desc">Yükleniyor…</p>
      ) : (
        <div className="roomio-table-wrap" style={{ marginBottom: 16 }}>
          <table className="roomio-table">
            <thead>
              <tr><th>Route</th><th>Ad</th><th>Katlar</th><th>Personel</th><th>Oda</th><th /></tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.code}</strong></td>
                  <td>{r.name}</td>
                  <td>{r.floors.join(', ')}</td>
                  <td>{r.staffName ?? '—'}</td>
                  <td>{r.roomCount ?? 0}</td>
                  <td><Button variant="secondary" onClick={() => setSelected(r.code)}>Odalar</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected ? (
        <div className="roomio-table-wrap">
          <h3 className="roomio-card-title">Route {selected} odaları</h3>
          <table className="roomio-table">
            <thead><tr><th>Oda</th><th>HK durum</th><th>Atanan</th></tr></thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.roomNo}>
                  <td>{r.roomNo}</td>
                  <td>{r.hkStatus}</td>
                  <td>{r.assignedTo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
