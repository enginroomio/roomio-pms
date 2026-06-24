'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';

type Check = {
  id: string;
  category: string;
  label: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
  count?: number;
};

type Props = {
  businessDate: string;
  onReadyChange?: (ready: boolean) => void;
};

export function NightAuditPreClosePanel({ businessDate, onReadyChange }: Props) {
  const { t } = useI18n();
  const [checks, setChecks] = useState<Check[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/eod/pre-close');
      const json = (await res.json()) as { ready?: boolean; checks?: Check[] };
      setChecks(json.checks ?? []);
      setReady(Boolean(json.ready));
      onReadyChange?.(Boolean(json.ready));
    } finally {
      setLoading(false);
    }
  }, [onReadyChange]);

  useEffect(() => {
    void load();
  }, [load, businessDate]);

  const statusLabel = (status: Check['status']) => {
    if (status === 'ok') return t('eod.preclose.status.ok');
    if (status === 'warn') return t('eod.preclose.status.warn');
    return t('eod.preclose.status.fail');
  };

  return (
    <div className="roomio-card" style={{ marginTop: 16, marginBottom: 16 }}>
      <h3 className="roomio-card-title">{t('eod.preclose.title')}</h3>
      <p className="roomio-page-desc">
        {ready ? t('eod.preclose.descriptionReady') : t('eod.preclose.descriptionBlocked')}
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Button variant="secondary" disabled={loading} onClick={() => void load()}>
          {loading ? t('eod.preclose.checking') : t('eod.preclose.recheck')}
        </Button>
      </div>
      <div className="roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('eod.preclose.col.category')}</th>
              <th>{t('eod.preclose.col.check')}</th>
              <th>{t('eod.preclose.col.status')}</th>
              <th>{t('eod.preclose.col.detail')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>{t('reception.loading')}</td></tr>
            ) : (
              checks.map((c) => (
                <tr key={c.id}>
                  <td>{c.category}</td>
                  <td>{c.label}</td>
                  <td>
                    <span className={`roomio-badge roomio-badge--${c.status === 'ok' ? 'ok' : c.status === 'warn' ? 'warn' : 'err'}`}>
                      {statusLabel(c.status)}
                    </span>
                  </td>
                  <td>{c.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
