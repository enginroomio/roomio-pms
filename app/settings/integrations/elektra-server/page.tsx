'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Server } from 'lucide-react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_ELEKTRA_SERVER_CONFIG,
  type ElektraServerConfig,
} from '@/lib/integrations/elektra-server/types';
import { DEFAULT_TGA_CONFIG, type TgaConfig } from '@/lib/integrations/tga/types';
import { DEFAULT_TIH_CONFIG, type TihConfig } from '@/lib/integrations/tih/types';
import { DEFAULT_TIS_CONFIG, type TisConfig } from '@/lib/integrations/tis/types';

type RelayKey = keyof ElektraServerConfig['relayServices'];

const RELAY_LABELS: Record<RelayKey, { label: string; href: string }> = {
  tga: { label: 'TGA segment & kanal', href: '/reports?category=tga' },
  tih: { label: 'TIH otomatik EGM/KBS', href: '/settings/integrations/egm' },
  tis: { label: 'TIS Turizm İstatistik', href: '/reports?category=tis' },
  tesa: { label: 'TESA kapı kartı', href: '/settings/integrations/tesa' },
  pbx: { label: 'Grandstream / Gulf Stream santral', href: '/settings/integrations/pbx' },
};

export default function ElektraServerIntegrationPage() {
  const [server, setServer] = useState<ElektraServerConfig>(DEFAULT_ELEKTRA_SERVER_CONFIG);
  const [tga, setTga] = useState<TgaConfig>(DEFAULT_TGA_CONFIG);
  const [tih, setTih] = useState<TihConfig>(DEFAULT_TIH_CONFIG);
  const [tis, setTis] = useState<TisConfig>(DEFAULT_TIS_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      roomioFetch('/api/integrations/elektra-server/config').then((r) => (r.ok ? r.json() : DEFAULT_ELEKTRA_SERVER_CONFIG)),
      roomioFetch('/api/integrations/tga/config').then((r) => (r.ok ? r.json() : DEFAULT_TGA_CONFIG)),
      roomioFetch('/api/integrations/tih/config').then((r) => (r.ok ? r.json() : DEFAULT_TIH_CONFIG)),
      roomioFetch('/api/integrations/tis/config').then((r) => (r.ok ? r.json() : DEFAULT_TIS_CONFIG)),
    ]).then(([s, g, t, i]) => {
      setServer({ ...DEFAULT_ELEKTRA_SERVER_CONFIG, ...s });
      setTga({ ...DEFAULT_TGA_CONFIG, ...g });
      setTih({ ...DEFAULT_TIH_CONFIG, ...t });
      setTis({ ...DEFAULT_TIS_CONFIG, ...i });
    }).catch(() => undefined);
  }, []);

  async function saveAll() {
    await Promise.all([
      roomioFetch('/api/integrations/elektra-server/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(server),
      }),
      roomioFetch('/api/integrations/tga/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tga),
      }),
      roomioFetch('/api/integrations/tih/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tih),
      }),
      roomioFetch('/api/integrations/tis/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tis),
      }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testConnection() {
    const res = await roomioFetch('/api/integrations/elektra-server/test');
    const j = (await res.json()) as { connection?: { ok: boolean; message: string; simulated?: boolean } };
    const c = j.connection;
    setTestMsg(c ? `${c.message}${c.simulated ? ' (simülasyon)' : ''}` : 'Test tamamlandı');
  }

  async function testTih() {
    const res = await roomioFetch('/api/integrations/tih/test');
    const j = (await res.json()) as { connection?: { ok: boolean; message: string; simulated?: boolean } };
    const c = j.connection;
    setTestMsg(c ? `TIH: ${c.message}${c.simulated ? ' (simülasyon)' : ''}` : 'TIH test tamamlandı');
  }

  async function testTis() {
    const res = await roomioFetch('/api/integrations/tis/submit');
    const j = (await res.json()) as { connection?: { ok: boolean; message: string; simulated?: boolean } };
    const c = j.connection;
    setTestMsg(c ? `TIS: ${c.message}${c.simulated ? ' (simülasyon)' : ''}` : 'TIS test tamamlandı');
  }

  function toggleRelay(key: RelayKey) {
    setServer({
      ...server,
      relayServices: {
        ...server.relayServices,
        [key]: !server.relayServices[key],
      },
    });
  }

  return (
    <IntegrationPageLayout
      segment="SNI Elektra v5 Sunucu"
      title="SNI Elektra v5 Sunucu & Servis Programları"
      description="TGA, TIS, TIH otomatik EGM, TESA ve Grandstream (Gulf Stream) santral — Elektra v5 sunucu köprüsü."
    >
      <div className="roomio-inline-panel" style={{ marginBottom: 16, padding: 12 }}>
        <Server size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        <strong>Elektra v5</strong> sunucusuna bağlandığınızda servis programları bu köprü üzerinden Roomio ile çalışır.
      </div>

      <FormSection title="Elektra v5 Sunucu Bağlantısı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={server.enabled}
              onChange={(e) => setServer({ ...server, enabled: e.target.checked })}
            />
            <span>Elektra sunucu köprüsü aktif</span>
          </label>
          <FormField label="Sunucu IP / hostname">
            <Input value={server.host} onChange={(e) => setServer({ ...server, host: e.target.value })} />
          </FormField>
          <FormField label="Port (varsayılan 8843)">
            <Input type="number" value={server.port} onChange={(e) => setServer({ ...server, port: Number(e.target.value) })} />
          </FormField>
          <FormField label="Otel / tesis kodu">
            <Input value={server.hotelCode} onChange={(e) => setServer({ ...server, hotelCode: e.target.value })} />
          </FormField>
          <FormField label="Kullanıcı">
            <Input value={server.username} onChange={(e) => setServer({ ...server, username: e.target.value })} />
          </FormField>
          <FormField label="Şifre">
            <Input type="password" value={server.password} onChange={(e) => setServer({ ...server, password: e.target.value })} />
          </FormField>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={server.useHttps}
              onChange={(e) => setServer({ ...server, useHttps: e.target.checked })}
            />
            <span>HTTPS kullan</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={server.simulateWhenOffline}
              onChange={(e) => setServer({ ...server, simulateWhenOffline: e.target.checked })}
            />
            <span>Sunucu yoksa simülasyon</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void saveAll()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void testConnection()}>Bağlantı testi</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testMsg ? <p className="roomio-page-desc">{testMsg}</p> : null}
      </FormSection>

      <FormSection title="Servis Programları (Elektra v5 üzerinden)" className="roomio-form-section--spaced">
        <p className="roomio-page-desc">
          Aşağıdaki modüller Elektra sunucusundaki servis programlarına yönlendirilir.
        </p>
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Modül</th><th>Elektra üzerinden</th><th /></tr>
          </thead>
          <tbody>
            {(Object.keys(RELAY_LABELS) as RelayKey[]).map((key) => (
              <tr key={key}>
                <td><strong>{RELAY_LABELS[key].label}</strong></td>
                <td>
                  <label className="roomio-field roomio-field--row">
                    <input type="checkbox" checked={server.relayServices[key]} onChange={() => toggleRelay(key)} />
                    <span>Aktif</span>
                  </label>
                </td>
                <td><Button variant="ghost" href={RELAY_LABELS[key].href}>Ayarlar</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </FormSection>

      <FormSection title="TGA — Segment & Kanal Raporu" className="roomio-form-section--spaced">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tga.enabled} onChange={(e) => setTga({ ...tga, enabled: e.target.checked })} />
            <span>TGA entegrasyonu aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tga.useElektraServer} onChange={(e) => setTga({ ...tga, useElektraServer: e.target.checked })} />
            <span>Elektra sunucu üzerinden gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tga.autoSubmitDaily} onChange={(e) => setTga({ ...tga, autoSubmitDaily: e.target.checked })} />
            <span>Gün sonu otomatik gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tga.autoSubmitMonthly} onChange={(e) => setTga({ ...tga, autoSubmitMonthly: e.target.checked })} />
            <span>Ay sonu otomatik gönder</span>
          </label>
          <FormField label="Tesis kodu (boş = Elektra otel kodu)">
            <Input value={tga.facilityCode} onChange={(e) => setTga({ ...tga, facilityCode: e.target.value })} />
          </FormField>
        </FormGrid>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Raporlar: <Link href="/reports?category=tga">TGA Segment & Kanal</Link>
        </p>
      </FormSection>

      <FormSection title="TIS — Turizm İstatistik Bildirimi" className="roomio-form-section--spaced">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tis.enabled} onChange={(e) => setTis({ ...tis, enabled: e.target.checked })} />
            <span>TIS entegrasyonu aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tis.useElektraServer} onChange={(e) => setTis({ ...tis, useElektraServer: e.target.checked })} />
            <span>Elektra sunucu üzerinden gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tis.autoSubmitDaily} onChange={(e) => setTis({ ...tis, autoSubmitDaily: e.target.checked })} />
            <span>Gün sonu otomatik gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tis.autoSubmitMonthly} onChange={(e) => setTis({ ...tis, autoSubmitMonthly: e.target.checked })} />
            <span>Ay sonu otomatik gönder</span>
          </label>
          <FormField label="Tesis kodu (boş = Elektra otel kodu)">
            <Input value={tis.facilityCode} onChange={(e) => setTis({ ...tis, facilityCode: e.target.value })} />
          </FormField>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button variant="secondary" onClick={() => void testTis()}>TIS test gönderimi</Button>
        </FormActions>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Raporlar: <Link href="/reports?category=tis">TIS Turizm İstatistik</Link>
        </p>
      </FormSection>

      <FormSection title="TIH — Otomatik EGM / KBS Kimlik Bildirimi" className="roomio-form-section--spaced">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tih.enabled} onChange={(e) => setTih({ ...tih, enabled: e.target.checked })} />
            <span>TIH servis programı aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tih.useElektraServer} onChange={(e) => setTih({ ...tih, useElektraServer: e.target.checked })} />
            <span>Elektra sunucu üzerinden EGM gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tih.autoSubmitOnCheckIn} onChange={(e) => setTih({ ...tih, autoSubmitOnCheckIn: e.target.checked })} />
            <span>Check-in sonrası otomatik EGM gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={tih.autoSubmitOnCheckOut} onChange={(e) => setTih({ ...tih, autoSubmitOnCheckOut: e.target.checked })} />
            <span>Check-out sonrası EGM bildir</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button variant="secondary" onClick={() => void testTih()}>TIH test gönderimi</Button>
        </FormActions>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Kimlik detayları: <Link href="/settings/integrations/egm">EGM / KBS ayarları</Link>
          {' · '}
          <Link href="/settings/integrations/id-reader">Kimlik okuyucu</Link>
        </p>
      </FormSection>

      <FormSection title="TESA & Grandstream Santral" className="roomio-form-section--spaced">
        <p className="roomio-page-desc">
          TESA HT24 kapı kartı ve Grandstream (Gulf Stream) UCM6301 santral, Elektra sunucu köprüsü
          aktifken yukarıdaki tablodan yönlendirilir. Doğrudan bağlantı için ayrı ayar sayfalarını kullanın.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/settings/integrations/tesa">TESA Hospitality ayarları</Button>
          <Button variant="secondary" href="/settings/integrations/pbx">Grandstream santral ayarları</Button>
        </div>
      </FormSection>
    </IntegrationPageLayout>
  );
}
