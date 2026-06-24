'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusInlineInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { formatMoney } from '@/lib/exchange/money';
import { roomioFetch } from '@/lib/client/api';

type RatePlan = {
  id: string;
  code: string;
  name: string;
  market: string;
  baseRate: number;
  currency: string;
  active: boolean;
};

type CalendarCell = {
  date: string;
  ratePlanCode: string;
  roomType?: string;
  rate: number;
  currency: string;
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function RatePlansSettingsPanel() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'plans' | 'calendar'>('plans');
  const [plans, setPlans] = useState<RatePlan[]>([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [roomType, setRoomType] = useState('DBL');
  const [calendar, setCalendar] = useState<CalendarCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    const res = await roomioFetch('/api/rate-plans?all=1');
    const json = (await res.json()) as { plans?: RatePlan[] };
    const list = json.plans ?? [];
    setPlans(list);
    if (!selectedCode && list[0]) setSelectedCode(list[0].code);
  }, [selectedCode]);

  const loadCalendar = useCallback(async () => {
    if (!selectedCode) return;
    const from = new Date().toISOString().slice(0, 10);
    const to = addDays(from, 13);
    const params = new URLSearchParams({
      view: 'calendar',
      from,
      to,
      code: selectedCode,
      roomType,
    });
    const res = await roomioFetch(`/api/rate-plans?${params}`);
    const json = (await res.json()) as { calendar?: CalendarCell[] };
    setCalendar(json.calendar ?? []);
  }, [selectedCode, roomType]);

  useEffect(() => {
    setLoading(true);
    void loadPlans().finally(() => setLoading(false));
  }, [loadPlans]);

  useEffect(() => {
    if (tab !== 'calendar') return;
    void loadCalendar();
  }, [tab, loadCalendar]);

  async function saveCell(date: string, rate: number) {
    if (!selectedCode) return;
    setMsg(null);
    try {
      const res = await roomioFetch('/api/rate-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calendar',
          code: selectedCode,
          date,
          roomType,
          rate,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? t('kurulus.ratePlans.saveError'));
      setMsg(t('kurulus.ratePlans.updated').replace('{date}', date));
      await loadCalendar();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    }
  }

  return (
    <div>
      <nav className="roomio-tabs" style={{ marginBottom: 16 }}>
        <button type="button" className={`roomio-tab${tab === 'plans' ? ' is-active' : ''}`} onClick={() => setTab('plans')}>
          {t('kurulus.ratePlans.tab.plans')}
        </button>
        <button type="button" className={`roomio-tab${tab === 'calendar' ? ' is-active' : ''}`} onClick={() => setTab('calendar')}>
          {t('kurulus.ratePlans.tab.calendar')}
        </button>
      </nav>

      {tab === 'plans' ? (
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead>
              <tr><th>{t('kurulus.col.code')}</th><th>{t('kurulus.col.name')}</th><th>{t('kurulus.ratePlans.col.market')}</th><th>{t('kurulus.ratePlans.col.baseRate')}</th><th>{t('kurulus.ratePlans.col.currency')}</th><th>{t('kurulus.col.status')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>{t('kurulus.loading')}</td></tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.code}</strong></td>
                    <td>{p.name}</td>
                    <td>{p.market}</td>
                    <td>{formatMoney(p.baseRate, p.currency)}</td>
                    <td>{p.currency}</td>
                    <td>{p.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <select className="roomio-select" value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}>
              {plans.map((p) => (
                <option key={p.id} value={p.code}>{p.code} — {p.name}</option>
              ))}
            </select>
            <select className="roomio-select" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              <option value="DBL">DBL</option>
              <option value="SUI">SUI</option>
              <option value="TRP">TRP</option>
            </select>
            <Button variant="secondary" onClick={() => void loadCalendar()}>{t('kurulus.users.refresh')}</Button>
          </div>
          <div className="roomio-table-wrap">
            <table className="roomio-table">
              <thead>
                <tr><th>{t('kurulus.ratePlans.col.date')}</th><th>{t('kurulus.ratePlans.col.rate')}</th><th>{t('kurulus.ratePlans.col.currency')}</th><th>{t('kurulus.ratePlans.col.update')}</th></tr>
              </thead>
              <tbody>
                {calendar.length === 0 ? (
                  <tr><td colSpan={4}>{t('kurulus.ratePlans.noCalendar')}</td></tr>
                ) : (
                  calendar.map((c) => (
                    <CalendarRow key={`${c.date}-${c.roomType}`} cell={c} onSave={saveCell} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {msg ? <p className="roomio-page-desc" style={{ marginTop: 12 }}>{msg}</p> : null}
    </div>
  );
}

function CalendarRow({
  cell,
  onSave,
}: {
  cell: CalendarCell;
  onSave: (date: string, rate: number) => void;
}) {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [rate, setRate] = useState(String(cell.rate));
  return (
    <tr>
      <td>{cell.date}</td>
      <td>
        <KurulusInlineInput
          canAdmin={canAdmin}
          type="number"
          style={{ width: 100 }}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
      </td>
      <td>{cell.currency}</td>
      <td>
        <KurulusAdminGate>
          <Button variant="ghost" onClick={() => onSave(cell.date, Number(rate))}>{t('kurulus.save')}</Button>
        </KurulusAdminGate>
      </td>
    </tr>
  );
}
