'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_AI_ASSISTANT_CONFIG, type AiAssistantConfig } from '@/lib/integrations/ai-assistant/types';

export default function AiAssistantSettingsPage() {
  const [config, setConfig] = useState<AiAssistantConfig>(DEFAULT_AI_ASSISTANT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/ai-assistant/config')
      .then((r) => r.json())
      .then((j: AiAssistantConfig) => setConfig({ ...DEFAULT_AI_ASSISTANT_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/ai-assistant/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/ai-assistant/config?test=1', { method: 'POST' });
    const j = (await res.json()) as { reply?: string; message?: string };
    setTestMsg(j.reply ?? j.message ?? 'Test tamamlandı');
  }

  return (
    <IntegrationPageLayout
      segment={"Otel AI Asistan"}
      title={"Otel AI Asistan"}
      description={"Misafir ve personel için yapay zeka destekli sohbet asistanı."}
      >
      <FormSection title="Model">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>AI asistan aktif</span>
          </label>
          <FormField label="Sağlayıcı">
            <select className="roomio-input" value={config.provider} onChange={(e) => setConfig({ ...config, provider: e.target.value as AiAssistantConfig['provider'] })}>
              <option value="openai">OpenAI</option>
              <option value="azure">Azure OpenAI</option>
              <option value="custom">Custom</option>
            </select>
          </FormField>
          <FormField label="Model"><Input value={config.model} onChange={(e) => setConfig({ ...config, model: e.target.value })} /></FormField>
          <FormField label="API anahtarı"><Input type="password" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} /></FormField>
          <FormField label="Dil"><Input value={config.language} onChange={(e) => setConfig({ ...config, language: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.guestFacing} onChange={(e) => setConfig({ ...config, guestFacing: e.target.checked })} />
            <span>Misafir sohbeti</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.staffFacing} onChange={(e) => setConfig({ ...config, staffFacing: e.target.checked })} />
            <span>Personel sohbeti</span>
          </label>
          <label className="roomio-field roomio-field--full">
            <span>Sistem promptu</span>
            <textarea className="roomio-input" rows={3} value={config.systemPrompt} onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })} />
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
          <Button variant="secondary" href="/ask" target="_blank">Misafir sohbeti</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testMsg ? <p className="roomio-page-desc">{testMsg}</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>Misafir URL: <Link href="/ask">/ask</Link></p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
