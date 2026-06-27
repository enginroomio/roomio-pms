'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_FIXED_ASSETS_CONFIG, type FixedAssetsConfig } from '@/lib/integrations/fixed-assets/types';

const STATUS_LABELS: Record<FixedAssetsConfig['assets'][number]['status'], string> = {
  active: 'Aktif',
  maintenance: 'Bakımda',
  retired: 'Emekli',
};

export default function FixedAssetsSettingsPage() {
  const [config, setConfig] = useState<FixedAssetsConfig>(DEFAULT_FIXED_ASSETS_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/fixed-assets/config')
      .then((r) => r.json())
      .then((j: FixedAssetsConfig) => setConfig({ ...DEFAULT_FIXED_ASSETS_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/fixed-assets/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <IntegrationPageLayout
      segment={"Demirbaş Yönetimi"}
      title={"Demirbaş Yönetimi"}
      description={"Sabit kıymet envanteri, amortisman ve periyodik sayım."}
      >
      <FormSection title="Demirbaş">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Amortisman yöntemi">
            <select
              className="roomio-input"
              value={config.depreciationMethod}
              onChange={(e) => setConfig({ ...config, depreciationMethod: e.target.value as FixedAssetsConfig['depreciationMethod'] })}
            >
              <option value="linear">Doğrusal</option>
              <option value="declining">Azalan bakiye</option>
            </select>
          </FormField>
          <FormField label="Sayım aralığı (ay)"><Input type="number" value={config.auditIntervalMonths} onChange={(e) => setConfig({ ...config, auditIntervalMonths: Number(e.target.value) })} /></FormField>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          {config.assets.length} demirbaş · {config.assets.filter((a) => a.status === 'active').length} aktif
        </p>
      </FormSection>

      <FormSection title="Demirbaşlar" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead><tr><th>Etiket</th><th>Ad</th><th>Kategori</th><th>Konum</th><th>Değer</th><th>Durum</th></tr></thead>
            <tbody>
              {config.assets.map((a) => (
                <tr key={a.id}>
                  <td>{a.tag}</td>
                  <td>{a.name}</td>
                  <td>{a.category}</td>
                  <td>{a.location}</td>
                  <td>{a.value.toLocaleString('tr-TR')} {a.currency}</td>
                  <td>{STATUS_LABELS[a.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </IntegrationPageLayout>
  );
}
