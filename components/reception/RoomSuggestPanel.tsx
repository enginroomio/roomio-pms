'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';

type Suggestion = {
  roomNo: string;
  floor: number;
  hkStatus: string;
  routeCode?: string;
  score: number;
  reason: string;
};

type Props = {
  reservationId: string;
  roomType: string;
  selectedRoom: string;
  onSelect: (roomNo: string) => void;
};

export function RoomSuggestPanel({ reservationId, roomType, selectedRoom, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void roomioFetch(`/api/reception/room-suggest?reservationId=${encodeURIComponent(reservationId)}`)
      .then((r) => r.json())
      .then((j: { suggestions?: Suggestion[] }) => {
        setSuggestions(j.suggestions ?? []);
      })
      .finally(() => setLoading(false));
  }, [reservationId]);

  useEffect(() => {
    if (!selectedRoom && suggestions[0]) onSelect(suggestions[0].roomNo);
  }, [suggestions, selectedRoom, onSelect]);

  if (loading) return <p className="roomio-page-desc">Oda routing önerileri yükleniyor…</p>;

  return (
    <div className="roomio-card" style={{ padding: 12, marginBottom: 16 }}>
      <h3 className="roomio-card-title">Fidelio oda routing — {roomType}</h3>
      <p className="roomio-page-desc">HK durumu, route yükü ve kat dengesine göre sıralı öneriler.</p>
      <div className="roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr><th>Oda</th><th>Kat</th><th>HK</th><th>Route</th><th>Skor</th><th>Neden</th><th /></tr>
          </thead>
          <tbody>
            {suggestions.length === 0 ? (
              <tr><td colSpan={7}>Uygun oda bulunamadı</td></tr>
            ) : (
              suggestions.map((s) => (
                <tr key={s.roomNo} className={selectedRoom === s.roomNo ? 'is-selected' : undefined}>
                  <td><strong>{s.roomNo}</strong></td>
                  <td>{s.floor}</td>
                  <td>{s.hkStatus}</td>
                  <td>{s.routeCode ?? '—'}</td>
                  <td>{s.score}</td>
                  <td>{s.reason}</td>
                  <td>
                    <Button variant="secondary" onClick={() => onSelect(s.roomNo)}>Seç</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
