'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';

export function ProgramDateSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [businessDate, setBusinessDate] = useState('');
  const [systemDate, setSystemDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/business-date');
      const j = (await res.json()) as { businessDate?: string; systemDate?: string };
      setBusinessDate(j.businessDate ?? '');
      setSystemDate(j.systemDate ?? '');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/business-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessDate, user: 'Kuruluş' }),
      });
      const j = (await res.json()) as { ok?: boolean; previousDate?: string; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error ?? t('kurulus.programDate.saveError'));
      setMsg(t('kurulus.programDate.updated').replace('{from}', j.previousDate ?? '').replace('{to}', businessDate));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('kurulus.programDate.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.programDate.title')} ({t('kurulus.live')})</h2>
      </div>
      {loading ? (
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>{t('kurulus.loading')}</p>
      ) : (
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 16, maxWidth: 420 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput
              canAdmin={canAdmin}
              label={t('kurulus.programDate.businessDate')}
              type="date"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
              required
            />
            <label className="roomio-field">
              <span>{t('kurulus.programDate.systemDate')}</span>
              <input className="roomio-input" value={systemDate} readOnly />
            </label>
          </div>
          <p className="roomio-page-desc" style={{ marginTop: 8 }}>
            {t('kurulus.programDate.hint')}
          </p>
          <div className="roomio-form-actions" style={{ marginTop: 12 }}>
            <KurulusAdminGate>
              <Button type="submit" disabled={saving}>{saving ? t('kurulus.saving') : t('kurulus.save')}</Button>
            </KurulusAdminGate>
          </div>
          {msg ? <p className="roomio-page-desc" style={{ marginTop: 12 }}>{msg}</p> : null}
        </form>
      )}
    </div>
  );
}
