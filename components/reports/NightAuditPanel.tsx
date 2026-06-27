'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';

type AuditRow = {
  id: string;
  businessDate: string;
  createdAt: string;
  module: string;
  action: string;
  user: string;
  detail?: string;
  entityType?: string;
  entityId?: string;
};

const MODULE_KEYS: Record<string, string> = {
  eod: 'eod.audit.module.eod',
  folio: 'eod.audit.module.folio',
  reception: 'eod.audit.module.reception',
  cash: 'eod.audit.module.cash',
  deposit: 'eod.audit.module.deposit',
  reservation: 'eod.audit.module.reservation',
  group: 'eod.audit.module.group',
};

type Props = {
  businessDate: string;
};

export function NightAuditPanel({ businessDate }: Props) {
  const { t } = useI18n();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [module, setModule] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ businessDate });
      if (module) params.set('module', module);
      const res = await roomioFetch(`/api/audit?${params}`);
      const json = (await res.json()) as { ok?: boolean; logs?: AuditRow[]; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Audit yüklenemedi');
      setLogs(json.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [businessDate, module]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ marginTop: 16 }}>
      <p className="roomio-page-desc">
        {t('eod.audit.description', { date: businessDate })}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
        <select className="roomio-select" value={module} onChange={(e) => setModule(e.target.value)}>
          <option value="">{t('eod.audit.allModules')}</option>
          {Object.entries(MODULE_KEYS).map(([k, key]) => (
            <option key={k} value={k}>{t(key)}</option>
          ))}
        </select>
        <Button variant="secondary" disabled={loading} onClick={() => void load()}>
          {loading ? t('reception.loading') : t('eod.audit.refresh')}
        </Button>
        <Button
          variant="secondary"
          href={`/api/audit?businessDate=${encodeURIComponent(businessDate)}${module ? `&module=${encodeURIComponent(module)}` : ''}&format=pdf`}
        >
          {t('eod.audit.tracePdf')}
        </Button>
        <Button
          variant="secondary"
          href="/api/eod/night-audit-package?format=pdf"
        >
          {t('eod.audit.packagePdf')}
        </Button>
        <Button
          variant="secondary"
          disabled={loading}
          onClick={() => void roomioFetch('/api/eod/night-audit-package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: 'Gece Audit', email: 'muhasebe@hotelsapphire.com' }),
          }).then(async (res) => {
            const j = (await res.json()) as { mailStatus?: string; mailError?: string; queued?: boolean };
            if (j.mailStatus === 'sent') setNotifyMsg('Gece denetim paketi gönderildi');
            else if (j.queued) setNotifyMsg(`Kuyruğa alındı${j.mailError ? `: ${j.mailError}` : ' (ROOMIO_MAIL_WEBHOOK tanımlayın)'}`);
            else setNotifyMsg('Gönderim tamamlandı');
          })}
        >
          {t('eod.audit.sendPackage')}
        </Button>
      </div>
      {notifyMsg ? <p className="roomio-page-desc">{notifyMsg}</p> : null}
      {error ? <p className="roomio-page-desc roomio-text-warn" style={{ marginTop: 12 }}>{error}</p> : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('eod.audit.col.time')}</th>
              <th>{t('eod.audit.col.module')}</th>
              <th>{t('eod.audit.col.action')}</th>
              <th>{t('eod.audit.col.user')}</th>
              <th>{t('eod.audit.col.detail')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>{t('reception.loading')}</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5}>{t('eod.audit.noRecords')}</td></tr>
            ) : (
              logs.map((row) => (
                <tr key={row.id}>
                  <td>{row.createdAt}</td>
                  <td>{MODULE_KEYS[row.module] ? t(MODULE_KEYS[row.module]) : row.module}</td>
                  <td><code>{row.action}</code></td>
                  <td>{row.user}</td>
                  <td>{row.detail ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
