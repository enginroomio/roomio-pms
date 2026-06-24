'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { LicenseEdition, LicensePayload } from '@/lib/license/types';
import { EDITION_DEFAULTS } from '@/lib/license/types';
import { randomId } from '@/lib/utils/id';

const VENDOR = process.env.NEXT_PUBLIC_ROOMIO_VENDOR_MODE === '1';

export default function LicenseGeneratorPage() {
  const [form, setForm] = useState({
    companyName: 'Hotel Sapphire Turizm A.Ş.',
    taxNumber: '1234567890',
    propertyName: 'Hotel Sapphire İstanbul',
    propertyCode: 'SAPPHIRE',
    contactEmail: 'yonetim@sapphire.com',
    maxRooms: 77,
    maxUsers: 50,
    edition: 'professional' as LicenseEdition,
    months: 12,
    notes: '',
  });
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!VENDOR) setError('Satıcı modu kapalı. ROOMIO_VENDOR_MODE=1 ile başlatın.');
  }, []);

  async function generate() {
    setError(null);
    const issued = new Date();
    const expires = new Date(issued);
    expires.setMonth(expires.getMonth() + form.months);

    const payload: LicensePayload = {
      v: 1,
      licenseId: randomId('lic'),
      companyName: form.companyName,
      taxNumber: form.taxNumber,
      propertyName: form.propertyName,
      propertyCode: form.propertyCode,
      contactEmail: form.contactEmail,
      maxRooms: form.maxRooms,
      maxUsers: form.maxUsers,
      edition: form.edition,
      modules: EDITION_DEFAULTS[form.edition].modules,
      issuedAt: issued.toISOString().slice(0, 10),
      expiresAt: expires.toISOString().slice(0, 10),
      notes: form.notes || undefined,
    };

    const res = await roomioFetch('/api/license/verify', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setError(j.error ?? 'Üretim başarısız');
      return;
    }
    const j = (await res.json()) as { token: string };
    setToken(j.token);
  }

  return (
    <PageHeader
      breadcrumb="Araçlar > Lisans Üretici"
      title="Roomio Lisans Üretici"
      description="RSA-4096 imzalı lisans — sadece satıcı makinesinde (private key)."
      actions={<Button variant="secondary" href="/settings/licensing">← Lisans Ayarları</Button>}
    >
      {error ? <div className="roomio-card roomio-alert">{error}</div> : null}

      <div className="roomio-card roomio-form">
        <div className="roomio-form-grid">
          {([
            ['companyName', 'Firma ünvanı'],
            ['taxNumber', 'Vergi no'],
            ['propertyName', 'Tesis adı'],
            ['propertyCode', 'Tesis kodu'],
            ['contactEmail', 'İletişim e-posta'],
          ] as const).map(([key, label]) => (
            <label key={key} className="roomio-field">
              <span>{label}</span>
              <input
                className="roomio-input"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="roomio-field">
            <span>Oda sayısı</span>
            <input className="roomio-input" type="number" value={form.maxRooms} onChange={(e) => setForm({ ...form, maxRooms: Number(e.target.value) })} />
          </label>
          <label className="roomio-field">
            <span>Kullanıcı limiti</span>
            <input className="roomio-input" type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
          </label>
          <label className="roomio-field">
            <span>Paket</span>
            <select className="roomio-select" value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value as LicenseEdition })}>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
          <label className="roomio-field">
            <span>Süre (ay)</span>
            <input className="roomio-input" type="number" value={form.months} onChange={(e) => setForm({ ...form, months: Number(e.target.value) })} />
          </label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 16 }}>
          <Button onClick={() => void generate()} disabled={!VENDOR}>Lisans Oluştur</Button>
        </div>
      </div>

      {token ? (
        <div className="roomio-card" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">Üretilen Anahtar</h2>
          <textarea readOnly className="roomio-input" rows={5} value={token} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem' }} />
        </div>
      ) : null}
    </PageHeader>
  );
}
