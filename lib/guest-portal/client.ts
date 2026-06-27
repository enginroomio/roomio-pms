import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_GUEST_PORTAL_CONFIG, type GuestPortalConfig } from '@/lib/guest-portal/types';

const CONFIG_FILE = process.env.ROOMIO_GUEST_PORTAL_CONFIG
  ?? path.join(process.cwd(), '.roomio-data', 'guest-portal-config.json');

export async function loadGuestPortalConfig(): Promise<GuestPortalConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_GUEST_PORTAL_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GUEST_PORTAL_CONFIG;
  }
}

export async function saveGuestPortalConfig(config: GuestPortalConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}
