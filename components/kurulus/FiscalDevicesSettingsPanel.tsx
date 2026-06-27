'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import type { FiscalDeviceRow } from '@/lib/server/fiscal-devices';

export function FiscalDevicesSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [devices, setDevices] = useState<FiscalDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', serial: '', active: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/fiscal-devices');
      const j = (await res.json()) as { devices?: FiscalDeviceRow[] };
      setDevices(j.devices ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/fiscal-devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ code: '', name: '', serial: '', active: true });
    setShowForm(false);
    await load();
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.fiscal.title')} ({t('kurulus.live')})</h2>
        <KurulusAdminGate>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('kurulus.cancel') : t('kurulus.newDevice')}</Button>
        </KurulusAdminGate>
      </div>
      {showForm ? (
        <KurulusAdminGate>
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.code')} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('accounting.fiscal.col.name')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.serial')} value={form.serial} onChange={(e) => setForm((p) => ({ ...p, serial: e.target.value }))} />
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('kurulus.save')}</Button></div>
        </form>
        </KurulusAdminGate>
      ) : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>{t('kurulus.col.code')}</th><th>{t('accounting.fiscal.col.name')}</th><th>{t('kurulus.col.serial')}</th><th>{t('kurulus.col.status')}</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>{t('kurulus.loading')}</td></tr>
            ) : devices.map((row) => (
              <tr key={row.code}>
                <td><strong>{row.code}</strong></td>
                <td>{row.name}</td>
                <td>{row.serial}</td>
                <td>{row.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
