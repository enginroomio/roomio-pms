import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { DEFAULT_DIGITAL_MENU_CONFIG, type DigitalMenuConfig } from '@/lib/integrations/digital-menu/types';

const FILE = 'digital-menu-config.json';

export async function loadDigitalMenuConfig(): Promise<DigitalMenuConfig> {
  return loadJsonConfig(FILE, DEFAULT_DIGITAL_MENU_CONFIG);
}

export async function saveDigitalMenuConfig(config: DigitalMenuConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function getPublicMenu(): Promise<{ ok: boolean; hotelName: string; categories: Record<string, DigitalMenuConfig['items']> }> {
  const config = await loadDigitalMenuConfig();
  const categories: Record<string, DigitalMenuConfig['items']> = {};
  for (const item of config.items.filter((i) => i.available)) {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  }
  return { ok: config.enabled, hotelName: config.hotelName, categories };
}
