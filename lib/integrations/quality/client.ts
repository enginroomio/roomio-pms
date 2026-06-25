import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { DEFAULT_QUALITY_CONFIG, type QualityConfig } from '@/lib/integrations/quality/types';

const FILE = 'quality-config.json';

export async function loadQualityConfig(): Promise<QualityConfig> {
  return loadJsonConfig(FILE, DEFAULT_QUALITY_CONFIG);
}

export async function saveQualityConfig(config: QualityConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function runQualityAudit() {
  const config = await loadQualityConfig();
  if (!config.enabled) return { ok: false, message: 'Kalite modülü kapalı', findings: 0 };
  const drafts = config.documents.filter((d) => d.status === 'draft').length;
  return {
    ok: true,
    findings: drafts,
    message: drafts > 0
      ? `${drafts} doküman taslak durumda — yayınlanmalı`
      : 'Tüm kalite dokümanları güncel',
  };
}
