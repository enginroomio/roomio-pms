import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { DEFAULT_FIXED_ASSETS_CONFIG, type FixedAssetsConfig } from '@/lib/integrations/fixed-assets/types';

const FILE = 'fixed-assets-config.json';

export async function loadFixedAssetsConfig(): Promise<FixedAssetsConfig> {
  return loadJsonConfig(FILE, DEFAULT_FIXED_ASSETS_CONFIG);
}

export async function saveFixedAssetsConfig(config: FixedAssetsConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function getFixedAssetsSummary() {
  const config = await loadFixedAssetsConfig();
  const totalValue = config.assets
    .filter((a) => a.status !== 'retired')
    .reduce((s, a) => s + a.value, 0);
  return {
    ok: config.enabled,
    assetCount: config.assets.length,
    activeCount: config.assets.filter((a) => a.status === 'active').length,
    maintenanceCount: config.assets.filter((a) => a.status === 'maintenance').length,
    totalValue,
    currency: 'TRY',
  };
}
