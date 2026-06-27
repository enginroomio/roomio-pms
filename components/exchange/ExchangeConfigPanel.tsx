'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import type { ExchangeConfig } from '@/lib/exchange/config';

export function ExchangeConfigPanel({ onSaved }: { onSaved?: () => void }) {
  const { t } = useI18n();
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
      setMsg(t('kurulus.exchangeConfig.saved'));
      onSaved?.();
      void load();
    } else {
      setMsg(t('kurulus.exchangeConfig.saveError'));
    }
  }

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <div>
          <h2 className="roomio-card-title" style={{ margin: 0 }}>{t('kurulus.exchangeConfig.title')}</h2>
          <p className="roomio-page-desc" style={{ margin: '4px 0 0' }}>
            {t('kurulus.exchangeConfig.desc')}
          </p>
        </div>
        <Button onClick={() => void save()}>{t('kurulus.save')}</Button>
      </div>
      {msg ? <p className="roomio-page-desc">{msg}</p> : null}
      {loading ? <p className="roomio-page-desc">{t('kurulus.loading')}</p> : (
        <div className="roomio-form-grid" style={{ marginTop: 12, maxWidth: 420 }}>
          <label className="roomio-field">
            <span>{t('kurulus.exchangeConfig.discount')}</span>
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
            {t('kurulus.exchangeConfig.example')}
          </p>
        </div>
      )}
    </div>
  );
}
