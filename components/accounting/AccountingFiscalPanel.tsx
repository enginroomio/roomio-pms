'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';

type FiscalDeviceStatus = {
  id: string;
  code: string;
  name: string;
  serial: string;
  active: boolean;
  connection: 'ok' | 'offline';
  zReportNo: number;
};

export function AccountingFiscalPanel() {
  const { t } = useI18n();
  const [devices, setDevices] = useState<FiscalDeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/fiscal-devices?view=status');
      const j = (await res.json()) as { devices?: FiscalDeviceStatus[] };
      setDevices(j.devices ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runConnectionTest() {
    setTesting(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/fiscal-devices?view=ping');
      const j = (await res.json()) as { ok?: boolean; online?: number; total?: number };
      if (res.ok && j.ok) {
        setMsg(t('accounting.fiscal.pingOk', { online: j.online ?? 0, total: j.total ?? 0 }));
        await load();
      } else {
        setMsg(t('accounting.fiscal.pingFail'));
      }
    } catch {
      setMsg(t('accounting.fiscal.pingFail'));
    } finally {
      setTesting(false);
    }
  }

  async function toggleActive(device: FiscalDeviceStatus) {
    await roomioFetch('/api/fiscal-devices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: device.id, active: !device.active }),
    });
    await load();
  }

  const activeCount = devices.filter((d) => d.active).length;
  const maxZ = devices.reduce((m, d) => Math.max(m, d.zReportNo), 0);

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <div className="roomio-card-head-row">
        <h2 className="roomio-card-title">{t('accounting.fiscal.title')}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" disabled={loading || testing} onClick={() => void runConnectionTest()}>
            {testing ? t('accounting.fiscal.testing') : t('accounting.fiscal.testConnection')}
          </Button>
          <Button variant="ghost" disabled={loading} onClick={() => void load()}>
            {t('reception.refresh')}
          </Button>
        </div>
      </div>

      <div className="roomio-kpi-grid" style={{ marginTop: 12 }}>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">{t('accounting.fiscal.deviceCount')}</span>
          <strong className="roomio-kpi-value">{devices.length}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">{t('accounting.fiscal.activeCount')}</span>
          <strong className="roomio-kpi-value">{activeCount}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">{t('accounting.fiscal.zReport')}</span>
          <strong className="roomio-kpi-value">{maxZ || '—'}</strong>
        </div>
      </div>

      {msg ? <p className="roomio-page-desc" style={{ marginTop: 12 }}>{msg}</p> : null}

      <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('accounting.fiscal.col.code')}</th>
              <th>{t('accounting.fiscal.col.name')}</th>
              <th>{t('accounting.fiscal.col.serial')}</th>
              <th>{t('accounting.fiscal.col.z')}</th>
              <th>{t('accounting.fiscal.col.connection')}</th>
              <th>{t('accounting.fiscal.col.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>{t('reception.loading')}</td></tr>
            ) : devices.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.code}</strong></td>
                <td>{d.name}</td>
                <td>{d.serial}</td>
                <td>{d.zReportNo}</td>
                <td>
                  <span className={`roomio-badge roomio-badge--${d.connection === 'ok' ? 'ok' : 'muted'}`}>
                    {d.connection === 'ok' ? t('accounting.fiscal.connectionOk') : t('accounting.fiscal.connectionOff')}
                  </span>
                </td>
                <td>{d.active ? t('accounting.fiscal.active') : t('accounting.fiscal.inactive')}</td>
                <td>
                  <PermissionGate permission="accounting.write">
                    <Button variant="ghost" onClick={() => void toggleActive(d)}>
                      {d.active ? t('accounting.fiscal.deactivate') : t('accounting.fiscal.activate')}
                    </Button>
                  </PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
