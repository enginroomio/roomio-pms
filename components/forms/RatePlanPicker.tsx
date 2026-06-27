'use client';

import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/exchange/money';
import { roomioFetch } from '@/lib/client/api';

type RatePlan = {
  id: string;
  code: string;
  name: string;
  market: string;
  roomType?: string;
  baseRate: number;
  currency: string;
  mealPlan?: string;
};

type Props = {
  roomType: string;
  checkIn: string;
  selectedCode: string;
  onApply: (plan: RatePlan) => void;
  compact?: boolean;
};

export function RatePlanPicker({ roomType, checkIn, selectedCode, onApply, compact = false }: Props) {
  const [plans, setPlans] = useState<RatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void roomioFetch('/api/rate-plans')
      .then((r) => r.json())
      .then((j: { plans?: RatePlan[] }) => {
        if (!cancelled) setPlans(j.plans ?? []);
      })
      .catch(() => {
        if (!cancelled) setMsg('Fiyat listeleri yüklenemedi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function selectPlan(code: string) {
    if (!code || !checkIn) return;
    setMsg(null);
    try {
      const params = new URLSearchParams({ code, roomType, checkIn });
      const res = await roomioFetch(`/api/rate-plans?${params}`);
      const json = (await res.json()) as { quote?: RatePlan | null; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Fiyat çözümlenemedi');
      if (!json.quote) {
        setMsg(`${code} bu oda tipi / tarih için geçerli değil`);
        return;
      }
      onApply(json.quote);
      setMsg(`${json.quote.name} uygulandı — ${formatMoney(json.quote.baseRate, json.quote.currency)}/gece`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    }
  }

  return (
    <div className={`roomio-rate-plan-picker${compact ? ' roomio-rate-plan-picker--compact' : ''}`}>
      <label className="roomio-field">
        <span>{compact ? 'Rate plan' : 'Rate plan (Fidelio rate code)'}</span>
        <select
          className="roomio-select"
          value={selectedCode}
          disabled={loading || !checkIn}
          onChange={(e) => void selectPlan(e.target.value)}
        >
          <option value="">{loading ? 'Yükleniyor…' : 'Rate plan seçin…'}</option>
          {plans.map((p) => (
            <option key={p.id} value={p.code}>
              {p.code} — {p.name} ({formatMoney(p.baseRate, p.currency)})
            </option>
          ))}
        </select>
      </label>
      {msg ? <p className="roomio-rate-plan-picker__msg">{msg}</p> : null}
    </div>
  );
}
