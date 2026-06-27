'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { roomioFetch } from '@/lib/client/api';
import type { DailyActivity } from '@/lib/data/guest-relations';

const ACTIVITY_TYPES = [
  'Karşılama', 'Bilgilendirme', 'Özel İstek', 'Şikayet', 'Teşekkür',
  'Rezervasyon', 'Doğum Günü', 'Ulaşım',
] as const;

export function DailyActivitiesPanel() {
  const [businessDate, setBusinessDate] = useState('');
  const [type, setType] = useState('Tümü');
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: ACTIVITY_TYPES[0] as string,
    guest: '',
    roomNo: '',
    description: '',
    staff: 'Misafir İlişkileri',
    department: 'Misafir İlişkileri',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statsRes = await roomioFetch('/api/guest-activities?view=stats');
      const statsJ = (await statsRes.json()) as { stats?: { businessDate?: string } };
      const date = statsJ.stats?.businessDate ?? '';
      setBusinessDate(date);

      const params = new URLSearchParams({ view: 'daily' });
      if (date) params.set('date', date);
      if (type !== 'Tümü') params.set('type', type);

      const res = await roomioFetch(`/api/guest-activities?${params}`);
      const j = (await res.json()) as { activities?: DailyActivity[] };
      setActivities(j.activities ?? []);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  const typeOptions = useMemo(() => {
    const fromData = new Set(activities.map((a) => a.type));
    return ['Tümü', ...ACTIVITY_TYPES, ...fromData];
  }, [activities]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.guest.trim() || !form.roomNo.trim()) return;
    await roomioFetch('/api/guest-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        view: 'daily',
        date: businessDate,
        ...form,
      }),
    });
    setShowForm(false);
    await load();
  }

  return (
    <>
      <div className="roomio-card roomio-filter-panel">
        <div className="roomio-form-grid">
          <label className="roomio-field"><span>İş günü</span><input className="roomio-input" value={businessDate} readOnly /></label>
          <label className="roomio-field"><span>Aktivite türü</span>
            <select className="roomio-select" value={type} onChange={(e) => setType(e.target.value)}>
              {typeOptions.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button onClick={() => void load()}>Yenile</Button>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'İptal' : '+ Günlük kayıt'}</Button>
        </div>
      </div>

      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 16 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field"><span>Tür</span>
              <select className="roomio-select" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="roomio-field"><span>Misafir</span><input className="roomio-input" value={form.guest} onChange={(e) => setForm((p) => ({ ...p, guest: e.target.value }))} /></label>
            <label className="roomio-field"><span>Oda</span><input className="roomio-input" value={form.roomNo} onChange={(e) => setForm((p) => ({ ...p, roomNo: e.target.value }))} /></label>
            <label className="roomio-field roomio-field--full"><span>Açıklama</span><input className="roomio-input" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">Kaydet</Button></div>
        </form>
      ) : null}

      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
        <table className="roomio-table">
          <thead><tr><th>Saat</th><th>Tür</th><th>Açıklama</th><th>Misafir</th><th>Oda</th><th>Personel</th><th>Departman</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Yükleniyor…</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={7}>Bu iş günü için aktivite yok.</td></tr>
            ) : (
              activities.map((r) => (
                <tr key={r.id}>
                  <td>{r.time}</td>
                  <td>{r.type}</td>
                  <td>{r.description}</td>
                  <td>{r.guest}</td>
                  <td>{r.roomNo}</td>
                  <td>{r.staff}</td>
                  <td>{r.department}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TableFooter total={activities.length} />
      </div>
    </>
  );
}
