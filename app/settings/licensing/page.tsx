'use client';

import { useState } from 'react';
import { FormActions, FormField, FormSection, Textarea } from '@/components/kit';
import { Button } from '@/components/ui';
import { AyarlarModuleShell } from '@/components/settings/AyarlarModuleShell';
import type { LicensePayload } from '@/lib/license/types';
import { clearLicense, getStoredLicense, storeLicense, validateLicenseRemote } from '@/lib/license/client';

export default function LicensingSettingsPage() {
  const [token, setToken] = useState(() => getStoredLicense() ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [info, setInfo] = useState<LicensePayload | null>(null);

  async function activate() {
    const result = await validateLicenseRemote(token);
    if (result.valid && result.payload) {
      storeLicense(token);
      setInfo(result.payload);
      setStatus(`Lisans aktif — ${result.daysRemaining} gün kaldı`);
    } else {
      setStatus(result.error ?? 'Geçersiz lisans');
      setInfo(result.payload ?? null);
    }
  }

  return (
    <AyarlarModuleShell
      segment="Lisans"
      title="Lisans Yönetimi"
      description="RSA-4096 imzalı profesyonel lisans — firma, oda sayısı ve modül yetkileri."
      actions={<Button variant="ghost" href="/settings?hub=ayarlar">← Ayarlar</Button>}
    >
      <FormSection title="Lisans Anahtarı">
        <FormField label="ROOMIO-LIC-v1 anahtarı" hint="Satıcıdan aldığınız tam anahtarı yapıştırın.">
          <Textarea
            rows={4}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ROOMIO-LIC-v1...."
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem' }}
          />
        </FormField>
        <FormActions>
          <Button onClick={() => void activate()}>Lisansı Doğrula &amp; Aktive Et</Button>
          <Button variant="secondary" onClick={() => { clearLicense(); setToken(''); setInfo(null); setStatus('Lisans kaldırıldı'); }}>
            Kaldır
          </Button>
          <Button variant="ghost" href="/tools/license">Satıcı: Lisans Üret →</Button>
        </FormActions>
        {status ? <p className="roomio-page-desc" style={{ marginTop: 12 }}>{status}</p> : null}
      </FormSection>

      {info ? (
        <div className="roomio-card" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">Lisans Detayı</h2>
          <dl className="roomio-dl">
            <dt>Firma</dt><dd>{info.companyName}</dd>
            <dt>Tesis</dt><dd>{info.propertyName} ({info.propertyCode})</dd>
            <dt>Maks. oda</dt><dd>{info.maxRooms}</dd>
            <dt>Maks. kullanıcı</dt><dd>{info.maxUsers}</dd>
            <dt>Paket</dt><dd>{info.edition}</dd>
            <dt>Bitiş</dt><dd>{info.expiresAt}</dd>
            <dt>Modüller</dt><dd>{info.modules.join(', ')}</dd>
          </dl>
        </div>
      ) : null}
    </AyarlarModuleShell>
  );
}
