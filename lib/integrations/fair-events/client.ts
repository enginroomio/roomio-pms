import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { DEFAULT_FAIR_EVENTS_CONFIG, type FairEventsConfig, type FairRegistration } from '@/lib/integrations/fair-events/types';

const CONFIG_FILE = 'fair-events-config.json';
const REG_FILE = 'fair-registrations.json';

export async function loadFairEventsConfig(): Promise<FairEventsConfig> {
  return loadJsonConfig(CONFIG_FILE, DEFAULT_FAIR_EVENTS_CONFIG);
}

export async function saveFairEventsConfig(config: FairEventsConfig): Promise<void> {
  await saveJsonConfig(CONFIG_FILE, config);
}

async function loadRegs(): Promise<FairRegistration[]> {
  return loadJsonConfig(REG_FILE, [] as FairRegistration[]);
}

async function saveRegs(regs: FairRegistration[]): Promise<void> {
  await saveJsonConfig(REG_FILE, regs);
}

export async function getPublicFairCatalog() {
  const config = await loadFairEventsConfig();
  return {
    ok: config.enabled,
    organizerName: config.organizerName,
    allowOnlineRegistration: config.allowOnlineRegistration,
    events: config.events.filter((e) => e.open),
  };
}

export async function registerFairAttendee(input: {
  eventId: string;
  name: string;
  company: string;
  email: string;
}) {
  const config = await loadFairEventsConfig();
  if (!config.enabled) return { ok: false, message: 'Fuar modülü kapalı' };
  if (!config.allowOnlineRegistration) return { ok: false, message: 'Online kayıt kapalı' };

  const event = config.events.find((e) => e.id === input.eventId && e.open);
  if (!event) return { ok: false, message: 'Etkinlik bulunamadı' };
  if (event.registered >= event.capacity) return { ok: false, message: 'Kontenjan dolu' };

  const reg: FairRegistration = {
    id: `fair-${Date.now()}`,
    eventId: event.id,
    name: input.name,
    company: input.company,
    email: input.email,
    createdAt: new Date().toISOString(),
  };

  const regs = await loadRegs();
  regs.push(reg);
  await saveRegs(regs);

  const events = config.events.map((e) =>
    e.id === event.id ? { ...e, registered: e.registered + 1 } : e,
  );
  await saveFairEventsConfig({ ...config, events });

  return { ok: true, message: 'Fuar kaydı alındı', registration: reg, qrCheckIn: config.qrCheckIn };
}
