import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_DYNAMIC_PRICING_CONFIG, type DynamicPricingConfig } from '@/lib/dynamic-pricing/types';

const CONFIG_FILE = process.env.ROOMIO_DYNAMIC_PRICING_CONFIG
  ?? path.join(process.cwd(), '.roomio-data', 'dynamic-pricing-config.json');

export async function loadDynamicPricingConfig(): Promise<DynamicPricingConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_DYNAMIC_PRICING_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DYNAMIC_PRICING_CONFIG;
  }
}

export async function saveDynamicPricingConfig(config: DynamicPricingConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}
