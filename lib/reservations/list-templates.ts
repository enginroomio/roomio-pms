import type { RezListLayout } from '@/lib/reservations/list-layout';
import { DEFAULT_REZ_LIST_LAYOUT, normalizeRezListLayout } from '@/lib/reservations/list-layout';

export type RezListUserTemplate = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  layout: RezListLayout;
};

const ARCHIVE_KEY = 'roomio:rez-list-archive-v1';
const DEFAULT_TEMPLATE_KEY = 'roomio:rez-list-default-template-id';

export const BUILTIN_ARCHIVE_SEED: Omit<RezListUserTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Varsayılan Modern Liste',
    description: 'Tam sütun seti — Elektra klasik sıra.',
    layout: DEFAULT_REZ_LIST_LAYOUT,
  },
];

function seedArchive(): RezListUserTemplate[] {
  const now = new Date().toISOString();
  return BUILTIN_ARCHIVE_SEED.map((item, i) => ({
    ...item,
    id: `builtin-${i}`,
    createdAt: now,
    layout: normalizeRezListLayout(item.layout),
  }));
}

export function loadRezListArchive(): RezListUserTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) {
      const seeded = seedArchive();
      saveRezListArchive(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as RezListUserTemplate[];
    return parsed.map((t) => ({
      ...t,
      layout: normalizeRezListLayout(t.layout),
    }));
  } catch {
    return seedArchive();
  }
}

export function saveRezListArchive(templates: RezListUserTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(templates));
}

export function addRezListTemplate(
  name: string,
  layout: RezListLayout,
  description?: string,
): RezListUserTemplate {
  const archive = loadRezListArchive();
  const entry: RezListUserTemplate = {
    id: `tpl-${Date.now()}`,
    name: name.trim(),
    description: description?.trim() || undefined,
    createdAt: new Date().toISOString(),
    layout: normalizeRezListLayout(layout),
  };
  saveRezListArchive([entry, ...archive]);
  return entry;
}

export function deleteRezListTemplate(id: string): RezListUserTemplate[] {
  const next = loadRezListArchive().filter((t) => t.id !== id);
  saveRezListArchive(next.length ? next : seedArchive());
  if (getDefaultTemplateId() === id) setDefaultTemplateId(null);
  return loadRezListArchive();
}

export function getDefaultTemplateId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DEFAULT_TEMPLATE_KEY);
}

export function setDefaultTemplateId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(DEFAULT_TEMPLATE_KEY, id);
  else localStorage.removeItem(DEFAULT_TEMPLATE_KEY);
}

export function findRezListTemplate(id: string): RezListUserTemplate | undefined {
  return loadRezListArchive().find((t) => t.id === id);
}
