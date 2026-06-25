'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_LOYALTY_CONFIG, type LoyaltyConfig } from '@/lib/integrations/loyalty/types';

export default function LoyaltySettingsPage() {
  const [config, setConfig] = useState<LoyaltyConfig>(DEFAULT_LOYALTY_CONFIG);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/loyalty/config')
      .then((r) => r.json())
      .then((j: LoyaltyConfig) => setConfig({ ...DEFAULT_LOYALTY_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/loyalty/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function previewPoints() {
    const res = await roomioFetch('/api/integrations/loyalty/config?calculate=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nights: 5, spendTry: 12000, agencyCode: 'DIRECT-WEB' }),
    });
    const j = (await res.json()) as { points?: number; tier?: string; agencyBonus?: number };
    setPreview(`${j.points ?? 0} puan · ${j.tier ?? '—'} · acente bonus ${j.agencyBonus ?? 0}`);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Sadakat"
      title="Sadakat & Acente Bonus"
      description="Misafir puanları, kademe indirimleri ve acente komisyon bonusları."
      actions={
        <>
          <Button variant="secondary" href="/loyalty">Sadakat Merkezi →</Button>
          <Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>
        </>
      }
    >
      <FormSection title="Puan Kuralları">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Program aktif</span>
          </label>
          <FormField label="Gece başına puan"><Input type="number" value={config.pointsPerNight} onChange={(e) => setConfig({ ...config, pointsPerNight: Number(e.target.value) })} /></FormField>
          <FormField label="100₺ başına puan"><Input type="number" value={config.pointsPer100Try} onChange={(e) => setConfig({ ...config, pointsPer100Try: Number(e.target.value) })} /></FormField>
          <FormField label="Puan değeri (₺)"><Input type="number" step="0.01" value={config.redeemValuePerPoint} onChange={(e) => setConfig({ ...config, redeemValuePerPoint: Number(e.target.value) })} /></FormField>
          <FormField label="Min harcama puanı"><Input type="number" value={config.minRedeemPoints} onChange={(e) => setConfig({ ...config, minRedeemPoints: Number(e.target.value) })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoApplyOnBooking} onChange={(e) => setConfig({ ...config, autoApplyOnBooking: e.target.checked })} />
            <span>Rezervasyonda otomatik uygula</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void previewPoints()}>Örnek hesapla</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {preview ? <p className="roomio-page-desc">5 gece / 12.000₺ direkt web: {preview}</p> : null}
      </FormSection>
      <FormSection title="Kademeler" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead><tr><th>Kademe</th><th>Min gece</th><th>Min harcama</th><th>İndirim %</th><th>Çarpan</th></tr></thead>
            <tbody>
              {config.tiers.map((t) => (
                <tr key={t.id}><td>{t.name}</td><td>{t.minNights}</td><td>{t.minSpend}</td><td>{t.discountPercent}</td><td>{t.bonusMultiplier}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </PageHeader>
  );
}
