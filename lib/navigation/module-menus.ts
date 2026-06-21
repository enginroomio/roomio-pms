import { KURULUS_NAV, type KurulusNavEntry } from './kurulus-nav';
import { ROLLOUT_PHASES } from './rollout-phases';
import { topMenuItems } from './top-menu-nav';

export type ModuleNavItem = {
  id: string;
  label: string;
  href: string;
  separator?: boolean;
  children?: ModuleNavItem[];
};

function fromKurulus(entries: KurulusNavEntry[]): ModuleNavItem[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    href: entry.href,
    separator: entry.separator,
    children: entry.children?.length ? fromKurulus(entry.children) : undefined,
  }));
}

export const KURULUS_MODULE_MENU = fromKurulus(KURULUS_NAV);

export const SISTEM_MODULE_MENU: ModuleNavItem[] = [
  { id: 'kurulus', label: 'Kuruluş', href: '/settings' },
  { id: 'rapor-design', label: 'Rapor Tasarım', href: '/reports?tab=design' },
  { id: 'raporla', label: 'Raporla', href: '/reports' },
  { id: 'user-reports', label: 'Kullanıcı Tanımlı Raporlar', href: '/reports?tab=user' },
  { id: 'sep-1', label: '', href: '#', separator: true },
  { id: 'servis', label: 'Servis Programları', href: '/settings/integrations' },
  { id: 'tesa', label: 'TESA Kapı Kartı', href: '/settings/integrations/tesa' },
  { id: '5651', label: '5651 Hotspot', href: '/settings/compliance/5651' },
  { id: 'dil', label: 'Dil Tanımları', href: '/settings?section=language' },
  { id: 'forms', label: 'Form Tasarım Listesi', href: '/reports?tab=forms' },
];

export const COMPLIANCE_MODULE_MENU: ModuleNavItem[] = [
  { id: 'hub', label: 'Entegrasyonlar', href: '/settings/integrations' },
  { id: '5651', label: '5651 Hotspot Loglama', href: '/settings/compliance/5651' },
  { id: 'tesa', label: 'TESA Hospitality', href: '/settings/integrations/tesa' },
  { id: 'kvkk', label: 'KVKK & Gizlilik', href: '/settings/privacy' },
  { id: 'license', label: 'Lisans', href: '/settings/licensing' },
];

export const RESEPSIYON_MODULE_MENU: ModuleNavItem[] = [
  { id: 'hub', label: 'Özet', href: '/reception' },
  { id: 'inhouse', label: 'Konaklayanlar', href: '/reception/inhouse' },
  { id: 'arrivals', label: 'Bugün Giriş', href: '/reception/arrivals' },
  { id: 'departures', label: 'Bugün Çıkış', href: '/reception/departures' },
  { id: 'vacant', label: 'Boş Odalar', href: '/reception/vacant' },
  { id: 'sep-1', label: '', href: '#', separator: true },
  { id: 'info-rack', label: 'Info Rack', href: '/guest-relations/info-rack' },
  { id: 'traces', label: 'Takip Listesi', href: '/guest-relations/traces' },
  { id: 'complaints', label: 'Arıza & Şikayet', href: '/guest-relations/complaints' },
  { id: 'lost-found', label: 'Kayıp & Bulunan', href: '/guest-relations/lost-found' },
];

export const REZERVASYON_MODULE_MENU: ModuleNavItem[] = topMenuItems('rezervasyon')
  .filter((item) => !item.separator)
  .slice(0, 12)
  .map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href ?? '#',
  }));

export function moduleMenuForPath(pathname: string, search = ''): ModuleNavItem[] | null {
  const path = pathname.split('?')[0];
  const qs = search || '';

  if (path.startsWith('/tools/rollout')) {
    return ROLLOUT_PHASES.map((phase) => ({
      id: phase.id,
      label: phase.title,
      href: `/tools/rollout?phase=${phase.id}`,
    }));
  }

  if (path.startsWith('/settings/compliance') || path.startsWith('/settings/integrations')) {
    return COMPLIANCE_MODULE_MENU;
  }
  if (path.startsWith('/settings') || path.startsWith('/tools/license')) {
    return KURULUS_MODULE_MENU;
  }
  if (path.startsWith('/reports') && (qs.includes('tab=design') || qs.includes('tab=forms'))) {
    return SISTEM_MODULE_MENU;
  }

  if (path.startsWith('/reception') || path.startsWith('/guest-relations/info-rack')) {
    return RESEPSIYON_MODULE_MENU;
  }
  if (path.startsWith('/reservations') || path.startsWith('/rooms')) {
    return REZERVASYON_MODULE_MENU;
  }
  if (path.startsWith('/housekeeping')) {
    return [
      { id: 'hub', label: 'Özet', href: '/housekeeping' },
      { id: 'rooms', label: 'Oda Durumu', href: '/housekeeping/rooms' },
      { id: 'tasks', label: 'Görevler', href: '/housekeeping/tasks' },
      { id: 'rack', label: 'Room Rack', href: '/rooms' },
    ];
  }
  if (path.startsWith('/guest-relations')) {
    return topMenuItems('misafir')
      .filter((item) => !item.separator && item.href)
      .slice(0, 14)
      .map((item) => ({ id: item.id, label: item.label, href: item.href! }));
  }
  if (path.startsWith('/fnb')) {
    return topMenuItems('misafir')
      .filter((item) => item.label.includes('Banket') || item.href?.startsWith('/fnb'))
      .map((item) => ({ id: item.id, label: item.label, href: item.href ?? '/fnb' }));
  }
  if (path.startsWith('/reports') || path.startsWith('/accounting')) {
    return topMenuItems('raporlar')
      .filter((item) => !item.separator && item.href)
      .slice(0, 12)
      .map((item) => ({ id: item.id, label: item.label, href: item.href! }));
  }

  return null;
}
