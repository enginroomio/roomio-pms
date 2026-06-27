'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormGrid, FormSection } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_BANKING_CONFIG, type BankingConfig } from '@/lib/integrations/banking/types';

export default function BankingSettingsPage() {
  const [config, setConfig] = useState<BankingConfig>(DEFAULT_BANKING_CONFIG);
  const [saved, setSaved] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/banking/config')
      .then((r) => r.json())
      .then((j: BankingConfig) => setConfig({ ...DEFAULT_BANKING_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/banking/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function sync() {
    const res = await roomioFetch('/api/integrations/banking/sync', { method: 'POST' });
    const j = (await res.json()) as { message?: string };
    setSyncMsg(j.message ?? 'Senkron tamamlandı');
    const cfg = await roomioFetch('/api/integrations/banking/config').then((r) => r.json());
    setConfig({ ...DEFAULT_BANKING_CONFIG, ...cfg });
  }

  return (
    <IntegrationPageLayout
      segment={"Banka Entegrasyonları"}
      title={"Banka Entegrasyonları"}
      description={"Hesap bakiyeleri ve otomatik mutabakat — Ziraat, İş Bankası ve diğerleri."}
      >
      <FormSection title="Hesaplar">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoReconcile} onChange={(e) => setConfig({ ...config, autoReconcile: e.target.checked })} />
            <span>Otomatik mutabakat</span>
          </label>
        </FormGrid>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Banka</th><th>IBAN</th><th>Para birimi</th><th>Bakiye</th></tr></thead>
            <tbody>
              {config.accounts.map((a) => (
                <tr key={a.id}><td>{a.bankName}</td><td>{a.iban}</td><td>{a.currency}</td><td>{a.balance.toLocaleString('tr-TR')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void sync()}>Bakiyeleri senkronize et</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {syncMsg ? <p className="roomio-page-desc">{syncMsg}</p> : null}
      </FormSection>
    </IntegrationPageLayout>
  );
}
