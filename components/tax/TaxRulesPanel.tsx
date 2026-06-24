'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import type { TaxRule } from '@/lib/tax/types';

export function TaxRulesPanel() {
  const { t } = useI18n();
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await roomioFetch('/api/tax/rules');
    const j = (await r.json()) as { rules?: TaxRule[] };
    if (j.rules) setRules(j.rules);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function updateRule(index: number, patch: Partial<TaxRule>) {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRule() {
    const n = rules.length + 1;
    setRules((prev) => [...prev, {
      id: '',
      code: `ek-${Date.now()}`,
      name: t('kurulus.taxRules.newRuleName'),
      rate: 0,
      base: 'subtotal',
      appliesTo: 'accommodation',
      active: true,
      sortOrder: n,
    }]);
  }

  async function save() {
    setMsg(null);
    const r = await roomioFetch('/api/tax/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules }),
    });
    if (r.ok) {
      setMsg(t('kurulus.taxRules.saved'));
      void load();
    } else {
      setMsg(t('kurulus.taxRules.saveError'));
    }
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <div>
          <h2 className="roomio-card-title" style={{ margin: 0 }}>{t('nav.kurulus.tax-rules')}</h2>
          <p className="roomio-page-desc" style={{ margin: '4px 0 0' }}>
            {t('kurulus.taxRules.desc')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={addRule}>{t('kurulus.taxRules.add')}</Button>
          <Button onClick={() => void save()}>{t('kurulus.save')}</Button>
        </div>
      </div>
      {msg ? <p className="roomio-page-desc">{msg}</p> : null}
      {loading ? <p className="roomio-page-desc">{t('kurulus.loading')}</p> : (
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead>
              <tr>
                <th>{t('kurulus.col.code')}</th>
                <th>{t('kurulus.col.name')}</th>
                <th>{t('kurulus.taxRules.col.rate')}</th>
                <th>{t('kurulus.taxRules.col.base')}</th>
                <th>{t('kurulus.taxRules.col.scope')}</th>
                <th>{t('kurulus.active')}</th>
                <th>{t('kurulus.taxRules.col.sort')}</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => (
                <tr key={rule.code}>
                  <td><input className="roomio-input roomio-input--sm" value={rule.code} onChange={(e) => updateRule(i, { code: e.target.value })} /></td>
                  <td><input className="roomio-input" value={rule.name} onChange={(e) => updateRule(i, { name: e.target.value })} /></td>
                  <td><input className="roomio-input roomio-input--sm" type="number" min={0} max={100} step={0.1} value={rule.rate} onChange={(e) => updateRule(i, { rate: Number(e.target.value) })} /></td>
                  <td>
                    <select className="roomio-select roomio-select--sm" value={rule.base} onChange={(e) => updateRule(i, { base: e.target.value as TaxRule['base'] })}>
                      <option value="subtotal">{t('kurulus.taxRules.base.subtotal')}</option>
                      <option value="running">{t('kurulus.taxRules.base.running')}</option>
                    </select>
                  </td>
                  <td>
                    <select className="roomio-select roomio-select--sm" value={rule.appliesTo} onChange={(e) => updateRule(i, { appliesTo: e.target.value as TaxRule['appliesTo'] })}>
                      <option value="accommodation">{t('kurulus.taxRules.scope.accommodation')}</option>
                      <option value="extras">{t('kurulus.taxRules.scope.extras')}</option>
                      <option value="all">{t('kurulus.taxRules.scope.all')}</option>
                    </select>
                  </td>
                  <td><input type="checkbox" checked={rule.active} onChange={(e) => updateRule(i, { active: e.target.checked })} aria-label={t('kurulus.active')} /></td>
                  <td><input className="roomio-input roomio-input--sm" type="number" value={rule.sortOrder} onChange={(e) => updateRule(i, { sortOrder: Number(e.target.value) })} style={{ width: 56 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
