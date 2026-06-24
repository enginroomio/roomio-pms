'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import type { CodeRow } from '@/lib/data/kurulus';

type CodeKind = 'market' | 'segment' | 'source' | 'department' | 'meal_plan' | 'nationality' | 'res_type' | 'revenue_group';
type ColKey = 'code' | 'name' | 'description' | 'status';

const COL_I18N: Record<ColKey, string> = {
  code: 'kurulus.col.code',
  name: 'kurulus.col.name',
  description: 'kurulus.col.description',
  status: 'kurulus.col.status',
};

type Props = {
  kind: CodeKind;
  titleKey: string;
  columns?: ColKey[];
};

export function MasterCodesPanel({ kind, titleKey, columns }: Props) {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch(`/api/master-codes?kind=${kind}&all=1`);
      const j = (await res.json()) as { codes?: CodeRow[] };
      setCodes(j.codes ?? []);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/master-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, ...form, active: true }),
    });
    setForm({ code: '', name: '', description: '' });
    setShowForm(false);
    await load();
  }

  const cols = columns ?? (kind === 'market' ? ['code', 'name', 'description', 'status'] as ColKey[] : ['code', 'name', 'status']);
  const hasDescription = cols.includes('description');

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t(titleKey)} ({t('kurulus.live')})</h2>
        <KurulusAdminGate>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('kurulus.cancel') : t('kurulus.newCode')}</Button>
        </KurulusAdminGate>
      </div>
      {showForm ? (
        <KurulusAdminGate>
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.code')} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.name')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            {kind === 'market' ? (
              <KurulusFormInput
                canAdmin={canAdmin}
                label={t('kurulus.col.description')}
                fieldClassName="roomio-field roomio-field--full"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            ) : null}
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('kurulus.save')}</Button></div>
        </form>
        </KurulusAdminGate>
      ) : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead><tr>{cols.map((c) => <th key={c}>{t(COL_I18N[c])}</th>)}</tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={cols.length}>{t('kurulus.loading')}</td></tr>
            ) : codes.map((row) => (
              <tr key={row.code}>
                <td><strong>{row.code}</strong></td>
                <td>{row.name}</td>
                {hasDescription ? <td>{row.description ?? '—'}</td> : null}
                <td>{row.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
