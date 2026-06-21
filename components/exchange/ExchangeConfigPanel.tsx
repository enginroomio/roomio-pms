'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { ExchangeConfig } from '@/lib/exchange/config';

export function ExchangeConfigPanel({ onSaved }: { onSaved?: () => void }) {
  const [config, setConfig] = useState<ExchangeConfig>({ exchangeDiscountPct: 2 });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await roomioFetch('/api/exchange/config');
    const j = (await r.json()) as { config?: ExchangeConfig };
    if (j.config) setConfig(j.config);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    setMsg(null);
    const r = await roomioFetch('/api/exchange/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    if (r.ok) {
      setMsg('Kur bozdurma ayarı kaydedildi.');
      onSaved?.();
      void load();
    } else {
      setMsg('Kayıt başarısız.');
    }
  }

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <div>
          <h2 className="roomio-card-title" style={{ margin: 0 }}>Kur Bozdurma Ayarı</h2>
          <p className="roomio-page-desc" style={{ margin: '4px 0 0' }}>
            Tüm hesaplamalar <strong>TCMB alış</strong> kuruyla yapılır. Misafir döviz bozdururken TCMB alış kurundan belirli bir oran düşülür.
          </p>
        </div>
        <Button onClick={() => void save()}>Kaydet</Button>
      </div>
      {msg ? <p className="roomio-page-desc">{msg}</p> : null}
      {loading ? <p className="roomio-page-desc">Yükleniyor…</p> : (
        <div className="roomio-form-grid" style={{ marginTop: 12, maxWidth: 420 }}>
          <label className="roomio-field">
            <span>Kur bozdurma indirimi (%)</span>
            <input
              className="roomio-input"
              type="number"
              min={0}
              max={50}
              step={0.1}
              value={config.exchangeDiscountPct}
              onChange={(e) => setConfig({ exchangeDiscountPct: Number(e.target.value) })}
            />
          </label>
          <p className="roomio-page-desc roomio-field--full">
            Örnek: TCMB USD alış 34,10 ve indirim %2 ise bozdurma kuru = 34,10 × 0,98 = <strong>33,42</strong> TRY/USD
          </p>
        </div>
      )}
    </div>
  );
}
