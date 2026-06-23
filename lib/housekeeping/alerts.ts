import type { HkRoomRecord } from '@/lib/data/hk-defaults';

export type HkAlertItem = { label: string; count: number; href?: string };

/** HK mobil pano — uyarılar listesi (DND, OOO, çıkış) */
export function buildHkMobileAlerts(
  hkMap: Record<string, HkRoomRecord>,
  departuresCount: number,
): HkAlertItem[] {
  const dndCount = Object.values(hkMap).filter((r) => r.hkStatus === 'DND').length;
  const oooCount = Object.values(hkMap).filter(
    (r) => r.hkStatus === 'OOO' || r.hkStatus === 'OOS',
  ).length;

  return [
    { label: 'DND Odalar', count: dndCount, href: '/housekeeping/rooms' },
    { label: 'Bakım / OOO', count: oooCount, href: '/housekeeping/rooms' },
    { label: 'Bugün çıkış', count: departuresCount, href: '/reception/departures' },
  ];
}
