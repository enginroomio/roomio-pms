'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';

type Company = {
  id: string;
  code: string;
  name: string;
  branch?: string;
  taxNo?: string;
  creditLimit?: number;
  active: boolean;
};

export function CompaniesSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    branch: '',
    taxNo: '',
    creditLimit: 50000,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/companies?all=1');
      const json = (await res.json()) as { companies?: Company[] };
      setCompanies(json.companies ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCompany() {
    if (!form.code.trim() || !form.name.trim()) {
      setMsg(t('kurulus.companies.required'));
      return;
    }
    setMsg(null);
    try {
      const res = await roomioFetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? t('kurulus.companies.saveError'));
      setForm({ code: '', name: '', branch: '', taxNo: '', creditLimit: 50000 });
      setMsg(t('kurulus.companies.saved'));
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('kurulus.companies.saveError'));
    }
  }

  return (
    <div>
      <div className="roomio-form-grid roomio-form-grid--2" style={{ marginBottom: 16 }}>
        <KurulusFormInput
          canAdmin={canAdmin}
          label={t('kurulus.companies.companyCode')}
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        />
        <KurulusFormInput
          canAdmin={canAdmin}
          label={t('kurulus.companies.legalName')}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <KurulusFormInput
          canAdmin={canAdmin}
          label={t('kurulus.companies.branch')}
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
        />
        <KurulusFormInput
          canAdmin={canAdmin}
          label={t('kurulus.companies.taxNo')}
          value={form.taxNo}
          onChange={(e) => setForm({ ...form, taxNo: e.target.value })}
        />
      </div>
      <KurulusAdminGate>
        <Button onClick={() => void createCompany()}>{t('kurulus.companies.save')}</Button>
      </KurulusAdminGate>

      <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('kurulus.col.code')}</th>
              <th>{t('kurulus.companies.col.company')}</th>
              <th>{t('kurulus.companies.branch')}</th>
              <th>{t('kurulus.companies.taxNo')}</th>
              <th>{t('kurulus.companies.col.creditLimit')}</th>
              <th>{t('kurulus.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>{t('kurulus.loading')}</td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.code}</strong>
                  </td>
                  <td>{c.name}</td>
                  <td>{c.branch ?? '—'}</td>
                  <td>{c.taxNo ?? '—'}</td>
                  <td>{c.creditLimit?.toLocaleString('tr-TR') ?? '—'}</td>
                  <td>{c.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {msg ? <p className="roomio-page-desc" style={{ marginTop: 12 }}>{msg}</p> : null}
    </div>
  );
}
