'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_PROCUREMENT_CONFIG, type ProcurementConfig } from '@/lib/integrations/procurement/types';

export default function ProcurementSettingsPage() {
  const [config, setConfig] = useState<ProcurementConfig>(DEFAULT_PROCUREMENT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/procurement/config')
      .then((r) => r.json())
      .then((j: ProcurementConfig) => setConfig({ ...DEFAULT_PROCUREMENT_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/procurement/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <IntegrationPageLayout
      segment={"Satın Alma"}
      title={"Satın Alma"}
      description={"Departman talepleri, onay eşiği ve tedarikçi yönlendirme."}
      >
      <FormSection title="Satın Alma">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Onay eşiği">
            <Input type="number" value={config.approvalThreshold} onChange={(e) => setConfig({ ...config, approvalThreshold: Number(e.target.value) })} />
          </FormField>
          <FormField label="Para birimi"><Input value={config.currency} onChange={(e) => setConfig({ ...config, currency: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoRouteToSupplier} onChange={(e) => setConfig({ ...config, autoRouteToSupplier: e.target.checked })} />
            <span>Onay sonrası tedarikçiye yönlendir</span>
          </label>
          <FormField label="Departmanlar (virgülle)">
            <Input
              value={config.departments.join(', ')}
              onChange={(e) => setConfig({ ...config, departments: e.target.value.split(',').map((d) => d.trim()).filter(Boolean) })}
            />
          </FormField>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          {config.approvalThreshold.toLocaleString('tr-TR')} {config.currency} altındaki talepler otomatik onaylanır.
        </p>
      </FormSection>

      <FormSection title="Departmanlar" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead><tr><th>Departman</th></tr></thead>
            <tbody>
              {config.departments.length ? config.departments.map((d) => (
                <tr key={d}><td>{d}</td></tr>
              )) : (
                <tr><td>Henüz departman tanımlı değil.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </FormSection>
    </IntegrationPageLayout>
  );
}
