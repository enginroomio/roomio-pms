'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_DYNAMIC_PRICING_CONFIG,
  type DynamicPricingApplyResult,
  type DynamicPricingConfig,
} from '@/lib/dynamic-pricing/types';

export default function DynamicPricingSettingsPage() {
  const [config, setConfig] = useState<DynamicPricingConfig>(DEFAULT_DYNAMIC_PRICING_CONFIG);
  const [saved, setSaved] = useState(false);
  const [applyResult, setApplyResult] = useState<DynamicPricingApplyResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/dynamic-pricing/config')
      .then((r) => r.json())
      .then((j: DynamicPricingConfig) => setConfig({ ...DEFAULT_DYNAMIC_PRICING_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/dynamic-pricing/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function apply() {
    setBusy(true);
    setApplyResult(null);
    try {
      const res = await roomioFetch('/api/integrations/dynamic-pricing/apply', { method: 'POST' });
      setApplyResult((await res.json()) as DynamicPricingApplyResult);
    } finally {
      setBusy(false);
    }
  }

  return (
    <IntegrationPageLayout
      segment={"Dinamik Fiyatlandırma"}
      title={"Dinamik Fiyatlandırma"}
      description={"Doluluk, lead-time ve saat kuralları — kanal yöneticisine otomatik gönderim."}
      >
      <FormSection title="Genel">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.pushToChannelManager} onChange={(e) => setConfig({ ...config, pushToChannelManager: e.target.checked })} />
            <span>Uygulama sonrası kanallara gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoApplyOnSync} onChange={(e) => setConfig({ ...config, autoApplyOnSync: e.target.checked })} />
            <span>Kanal senkronundan önce otomatik uygula</span>
          </label>
          <FormField label="Rate plan"><Input value={config.defaultRatePlan} onChange={(e) => setConfig({ ...config, defaultRatePlan: e.target.value })} /></FormField>
        </FormGrid>
        {config.lastAppliedAt ? (
          <p className="roomio-page-desc">Son uygulama: {config.lastAppliedAt} ({config.lastAppliedCount ?? 0} hücre)</p>
        ) : null}
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" disabled={busy} onClick={() => void apply()}>Kuralları Uygula</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {applyResult ? <p className="roomio-page-desc">{applyResult.message}</p> : null}
      </FormSection>

      <FormSection title="Fiyat Kuralları" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead>
              <tr><th>Aktif</th><th>Kural</th><th>Tip</th><th>Ayar</th><th>%</th></tr>
            </thead>
            <tbody>
              {config.rules.map((rule, i) => (
                <tr key={rule.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => {
                        const rules = [...config.rules];
                        rules[i] = { ...rule, enabled: e.target.checked };
                        setConfig({ ...config, rules });
                      }}
                    />
                  </td>
                  <td>{rule.name}</td>
                  <td>{rule.type}</td>
                  <td>
                    {rule.type === 'occupancy' ? `≥${rule.occupancyThreshold}%` : null}
                    {rule.type === 'occupancy_below' ? `≤${rule.occupancyThreshold}%` : null}
                    {rule.type === 'lead_time' ? `≤${rule.daysBefore} gün` : null}
                    {rule.type === 'hourly' ? `≥${rule.hourFrom}:00` : null}
                    {rule.type === 'weekend' ? 'Cmt/Paz' : null}
                    {rule.type === 'competitor' ? `Endeks ${config.competitor?.marketIndex ?? 50}` : null}
                  </td>
                  <td>{rule.adjustmentPercent > 0 ? `+${rule.adjustmentPercent}` : rule.adjustmentPercent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </IntegrationPageLayout>
  );
}
