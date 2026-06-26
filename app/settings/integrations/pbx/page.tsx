'use client';

import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { FormActions, FormField, FormGrid, FormSection, Input, Textarea } from '@/components/kit';
import { Button } from '@/components/ui';
import { SistemIntegrationActions } from '@/components/sistem/SistemIntegrationActions';
import { SistemModuleLayout } from '@/components/sistem/SistemModuleLayout';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_PBX_CONFIG,
  UCM6301_DEFAULTS,
  UCM_ROOM_STATUS,
  type PbxConfig,
} from '@/lib/integrations/pbx/types';

export default function PbxIntegrationPage() {
  const [config, setConfig] = useState<PbxConfig>(DEFAULT_PBX_CONFIG);
  const [conn, setConn] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/pbx/config')
      .then((r) => r.json())
      .then((j: PbxConfig) => setConfig({ ...DEFAULT_PBX_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/pbx/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/pbx/test');
    const j = (await res.json()) as { connection: { ok: boolean; message: string; simulated?: boolean } };
    setConn(j.connection.message + (j.connection.simulated ? ' (simülasyon)' : ''));
  }

  return (
    <SistemModuleLayout
      segment={['Entegrasyonlar', 'Grandstream Santral']}
      title={`Grandstream ${UCM6301_DEFAULTS.model}`}
      description="UCM6301 HTTPS API (port 8089) + PMS API — check-in/out, oda durumu, uyandırma."
      menuSearch=""
      actions={<SistemIntegrationActions />}
    >
      <div className="roomio-inline-panel" style={{ marginBottom: 16, padding: 12 }}>
        <Phone size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        <strong>Cihaz:</strong> {config.model} · MAC {config.macAddress || '—'} · S/N {config.serialNumber || '—'}
      </div>

      <FormSection title="UCM6301 Bağlantı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            <span>Santral entegrasyonu aktif</span>
          </label>
          <FormField label="UCM IP adresi">
            <Input value={config.host} onChange={(e) => setConfig({ ...config, host: e.target.value })} />
          </FormField>
          <FormField label={`HTTPS API port (varsayılan ${UCM6301_DEFAULTS.apiPort})`}>
            <Input type="number" value={config.port} onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })} />
          </FormField>
          <FormField label="HTTPS API kullanıcı">
            <Input value={config.apiUsername} onChange={(e) => setConfig({ ...config, apiUsername: e.target.value })} />
          </FormField>
          <FormField label="HTTPS API şifre">
            <Input type="password" value={config.apiPassword} onChange={(e) => setConfig({ ...config, apiPassword: e.target.value })} />
          </FormField>
          <FormField label="PMS API kullanıcı">
            <Input value={config.pmsUsername} onChange={(e) => setConfig({ ...config, pmsUsername: e.target.value })} />
          </FormField>
          <FormField label="PMS API şifre">
            <Input type="password" value={config.pmsPassword} onChange={(e) => setConfig({ ...config, pmsPassword: e.target.value })} />
          </FormField>
          <FormField label="Seri no (S/N)">
            <Input value={config.serialNumber} onChange={(e) => setConfig({ ...config, serialNumber: e.target.value })} placeholder="351021E52F1F" />
          </FormField>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.simulateWhenOffline}
              onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })}
            />
            <span>UCM erişilemezse simülasyon (geliştirme)</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.syncDisplayName}
              onChange={(e) => setConfig({ ...config, syncDisplayName: e.target.checked })}
            />
            <span>Check-in&apos;de dahili ekran adını güncelle</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.enableExtensionOnCheckIn}
              onChange={(e) => setConfig({ ...config, enableExtensionOnCheckIn: e.target.checked })}
            />
            <span>Check-in&apos;de oda hattını aktif et (COS)</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.autoOnCheckIn}
              onChange={(e) => setConfig({ ...config, autoOnCheckIn: e.target.checked })}
            />
            <span>Resepsiyon check-in&apos;de otomatik santral güncelle</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.autoOnCheckOut}
              onChange={(e) => setConfig({ ...config, autoOnCheckOut: e.target.checked })}
            />
            <span>Resepsiyon check-out&apos;ta otomatik santral güncelle</span>
          </label>
        </FormGrid>
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          UCM web arayüzü: Value-Added Features → API Configuration → HTTPS API Settings (Enable).
          PMS modülü: Value-Added Features → PMS → Basic Settings → PMSAPI.
        </p>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı Testi</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {conn ? <p className="roomio-page-desc">{conn}</p> : null}
      </FormSection>

      <FormSection title="Oda → Extension eşlemesi" className="roomio-form roomio-form-section--spaced">
        <p className="roomio-page-desc">
          Oda numaraları UCM extension ile birebir değilse eşleyin (ör. Oda 101 → ext 2101).
        </p>
        <Textarea
          rows={6}
          value={Object.entries(config.extensionMappings).map(([k, v]) => `${k}=${v}`).join('\n')}
          onChange={(e) => {
            const mappings: Record<string, string> = {};
            for (const line of e.target.value.split('\n')) {
              const [k, v] = line.split('=');
              if (k?.trim() && v?.trim()) mappings[k.trim()] = v.trim();
            }
            setConfig({ ...config, extensionMappings: mappings });
          }}
        />
      </FormSection>

      <FormSection title="Oda durum kodları (UCM6300)">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead><tr><th>Durum</th><th>Kod</th></tr></thead>
            <tbody>
              {Object.entries(UCM_ROOM_STATUS).map(([name, code]) => (
                <tr key={name}><td>{name}</td><td>{code}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </SistemModuleLayout>
  );
}
