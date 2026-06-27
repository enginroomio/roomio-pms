'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormCheckbox, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';

export function MarketRequiredSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [required, setRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/market-required');
      const j = (await res.json()) as { required?: boolean };
      setRequired(Boolean(j.required));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/market-required', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ required }),
      });
      const j = (await res.json()) as { ok?: boolean };
      if (!res.ok || !j.ok) throw new Error(t('kurulus.programDate.saveError'));
      setMsg(required ? t('kurulus.marketRequired.requiredMsg') : t('kurulus.marketRequired.optionalMsg'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('kurulus.programDate.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.marketRequired.title')} ({t('kurulus.live')})</h2>
      </div>
      {loading ? (
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>{t('kurulus.loading')}</p>
      ) : (
        <>
          <div style={{ marginTop: 16 }}>
          <KurulusFormCheckbox
            canAdmin={canAdmin}
            label={t('kurulus.marketRequired.checkbox')}
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            fieldClassName="roomio-field roomio-field--checkbox"
          />
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 12 }}>
            <KurulusAdminGate>
              <Button onClick={() => void save()} disabled={saving}>{saving ? t('kurulus.saving') : t('kurulus.save')}</Button>
            </KurulusAdminGate>
          </div>
          {msg ? <p className="roomio-page-desc" style={{ marginTop: 8 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
