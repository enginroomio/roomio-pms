'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusInlineInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import type { ConfigParamRow } from '@/lib/server/config-params';

export function ConfigParamsSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [params, setParams] = useState<ConfigParamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/config-params');
      const j = (await res.json()) as { params?: ConfigParamRow[] };
      setParams(j.params ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(key: string) {
    await roomioFetch('/api/config-params', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: editValue }),
    });
    setEditingKey(null);
    await load();
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.config.title')} ({t('kurulus.live')})</h2>
      </div>
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('kurulus.config.col.param')}</th>
              <th>{t('kurulus.col.value')}</th>
              <th>{t('kurulus.col.description')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>{t('kurulus.loading')}</td></tr>
            ) : params.map((row) => (
              <tr key={row.key}>
                <td><strong>{row.key}</strong></td>
                <td>
                  {editingKey === row.key ? (
                    <KurulusInlineInput canAdmin={canAdmin} value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                  ) : (
                    row.value
                  )}
                </td>
                <td>{row.description}</td>
                <td>
                  {editingKey === row.key ? (
                    <KurulusAdminGate>
                      <Button onClick={() => void save(row.key)}>{t('kurulus.save')}</Button>
                    </KurulusAdminGate>
                  ) : (
                    <KurulusAdminGate fallback={<span className="roomio-page-desc">—</span>}>
                      <Button variant="secondary" onClick={() => { setEditingKey(row.key); setEditValue(row.value); }}>{t('kurulus.edit')}</Button>
                    </KurulusAdminGate>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
