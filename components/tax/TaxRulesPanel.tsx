'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { TaxRule } from '@/lib/tax/types';

export function TaxRulesPanel() {
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
      name: 'Ek Vergi',
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
      setMsg('Vergi oranları kaydedildi.');
      void load();
    } else {
      setMsg('Kayıt başarısız.');
    }
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <div>
          <h2 className="roomio-card-title" style={{ margin: 0 }}>Vergi Oranları</h2>
          <p className="roomio-page-desc" style={{ margin: '4px 0 0' }}>
            KDV, konaklama vergisi ve ek vergiler — oranlar değiştiğinde buradan güncelleyin.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={addRule}>+ Ek vergi</Button>
          <Button onClick={() => void save()}>Kaydet</Button>
        </div>
      </div>
      {msg ? <p className="roomio-page-desc">{msg}</p> : null}
      {loading ? <p className="roomio-page-desc">Yükleniyor…</p> : (
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Ad</th>
                <th>Oran %</th>
                <th>Matrah</th>
                <th>Kapsam</th>
                <th>Aktif</th>
                <th>Sıra</th>
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
                      <option value="subtotal">Ara toplam</option>
                      <option value="running">Kümülatif</option>
                    </select>
                  </td>
                  <td>
                    <select className="roomio-select roomio-select--sm" value={rule.appliesTo} onChange={(e) => updateRule(i, { appliesTo: e.target.value as TaxRule['appliesTo'] })}>
                      <option value="accommodation">Konaklama</option>
                      <option value="extras">Ekstralar</option>
                      <option value="all">Tümü</option>
                    </select>
                  </td>
                  <td><input type="checkbox" checked={rule.active} onChange={(e) => updateRule(i, { active: e.target.checked })} aria-label="Aktif" /></td>
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
