'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_ROOM_SERVICE_CONFIG, type RoomServiceConfig } from '@/lib/integrations/room-service/types';

export default function RoomServiceSettingsPage() {
  const [config, setConfig] = useState<RoomServiceConfig>(DEFAULT_ROOM_SERVICE_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/room-service/config')
      .then((r) => r.json())
      .then((j: RoomServiceConfig) => setConfig({ ...DEFAULT_ROOM_SERVICE_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/room-service/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <IntegrationPageLayout
      segment={"Oda Servisi"}
      title={"Oda Servisi"}
      description={"Misafirlerin cep telefonundan oda servisi siparişi verebilmesi — dijital menü kataloğunu kullanır."}
      >
      <FormSection title="Oda Servisi">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoConfirm} onChange={(e) => setConfig({ ...config, autoConfirm: e.target.checked })} />
            <span>Siparişleri otomatik onayla</span>
          </label>
          <FormField label="Hizmet başlangıcı"><Input value={config.serviceHoursStart} onChange={(e) => setConfig({ ...config, serviceHoursStart: e.target.value })} /></FormField>
          <FormField label="Hizmet bitişi"><Input value={config.serviceHoursEnd} onChange={(e) => setConfig({ ...config, serviceHoursEnd: e.target.value })} /></FormField>
          <FormField label="Tahmini süre (dk)"><Input type="number" value={config.estimatedMinutes} onChange={(e) => setConfig({ ...config, estimatedMinutes: Number(e.target.value) })} /></FormField>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/guest-relations/room-service" target="_blank">Sipariş panelini gör</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Ürün kataloğu Dijital Menü modülünden gelir — fiyat/ürün düzenlemeleri orada yapılır.
        </p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
