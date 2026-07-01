'use client';

import { useCallback, useEffect, useState } from 'react';
import { TableFooter } from '@/components/ReportToolbar';
import { roomioFetch } from '@/lib/client/api';
import { ROOM_SERVICE_ORDER_STATUSES, type RoomServiceOrder, type RoomServiceOrderStatus } from '@/lib/integrations/room-service/types';

export function RoomServiceOrdersPanel() {
  const [orders, setOrders] = useState<RoomServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/room-service/orders');
      const j = (await res.json()) as { ok?: boolean; orders?: RoomServiceOrder[] };
      setOrders(j.orders ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: RoomServiceOrderStatus) {
    setUpdating(id);
    try {
      await roomioFetch('/api/room-service/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      await load();
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="roomio-card roomio-table-wrap">
      <table className="roomio-table">
        <thead>
          <tr>
            <th>Saat</th><th>Oda</th><th>Misafir</th><th>Ürünler</th><th>Toplam</th><th>Not</th><th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7}>Yükleniyor…</td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan={7}>Sipariş yok.</td></tr>
          ) : (
            orders.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.createdAt).toLocaleString('tr-TR')}</td>
                <td>{o.roomNo}</td>
                <td>{o.guestName}</td>
                <td>{o.items.map((l) => `${l.qty}× ${l.name}`).join(', ')}</td>
                <td>{o.totalAmount} {o.currency}</td>
                <td>{o.notes ?? '—'}</td>
                <td>
                  <select
                    className="roomio-select"
                    value={o.status}
                    disabled={updating === o.id}
                    onChange={(e) => void setStatus(o.id, e.target.value as RoomServiceOrderStatus)}
                  >
                    {ROOM_SERVICE_ORDER_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <TableFooter total={orders.length} />
    </div>
  );
}
