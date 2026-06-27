import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_BOOKING_ENGINE_CONFIG, type BookingEngineConfig } from '@/lib/booking-engine/types';

const CONFIG_FILE = process.env.ROOMIO_BOOKING_ENGINE_CONFIG
  ?? path.join(process.cwd(), '.roomio-data', 'booking-engine-config.json');

export async function loadBookingEngineConfig(): Promise<BookingEngineConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_BOOKING_ENGINE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BOOKING_ENGINE_CONFIG;
  }
}

export async function saveBookingEngineConfig(config: BookingEngineConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}
