import type { ReservationListTab } from '@/lib/reservations/list-tabs';

const STATUS_TO_LIST_TAB: Record<string, ReservationListTab> = {
  OPTION: 'waiting',
  CONFIRMED: 'reservation',
  CHECKED_IN: 'inhouse',
  CHECKED_OUT: 'departed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'noshow',
};

/** Rezervasyon listesi menü linkleri — ?status= ve ?track= */
export function reservationListTabFromParams(
  status: string | null,
  track: string | null,
): ReservationListTab | null {
  if (status && STATUS_TO_LIST_TAB[status]) return STATUS_TO_LIST_TAB[status];
  if (track === '1') return 'all';
  return null;
}

/** Rezervasyon ?tab= import / group yönlendirmesi */
export function normalizeReservationTab(tab: string | null): string | null {
  if (!tab) return null;
  return tab;
}

/** Muhasebe menü tab aliasları */
export function normalizeAccountingTab(tab: string | null): string {
  if (!tab) return 'invoices';
  if (tab === 'invoice' || tab.startsWith('invoice')) return 'invoices';
  if (tab === 'proforma') return 'invoices';
  if (tab === 'cari' || tab.startsWith('cari')) return 'ledger';
  if (tab.startsWith('budget')) return 'ledger';
  if (tab === 'bank-cards') return 'fiscal';
  if (['invoices', 'ledger', 'stock', 'fiscal'].includes(tab)) return tab;
  return 'invoices';
}

/** Raporlar ?tab= yönetim / hazırlık → kategori */
export function reportsCategoryFromParams(
  tab: string | null,
  category: string | null,
): string | null {
  if (category) return category;
  const tabToCategory: Record<string, string> = {
    management: 'yonetim',
    prepare: 'yonetim',
    cube: 'yonetim',
    occupancy: 'forecast',
    '3year': 'forecast',
    dept: 'gelir',
    daily: 'gunluk',
  };
  if (tab && tabToCategory[tab]) return tabToCategory[tab];
  return null;
}

/** Raporlar ?report= slug → kategori (menü alt linkleri) */
export function reportsCategoryFromReportSlug(report: string | null): string | null {
  if (!report) return null;
  const slug = report.toLowerCase();
  if (slug.includes('maliye') || slug.includes('finance')) return 'muhasebe';
  if (slug.includes('transfer') || slug.includes('room-change')) return 'gunluk';
  if (slug.includes('forecast') || slug.includes('doluluk')) return 'forecast';
  if (slug.includes('rez') || slug.includes('reservation')) return 'rezervasyon';
  if (slug.includes('hk') || slug.includes('kat')) return 'kathizmetleri';
  if (slug.includes('egm') || slug.includes('kbs')) return 'egm';
  if (slug.includes('gelir') || slug.includes('revenue')) return 'gelir';
  return 'yonetim';
}

/** Kuruluş ?section= menü alias → gerçek panel anahtarı */
export function normalizeKurulusSection(section: string | null): string | null {
  if (!section) return section;
  return section;
}

/** Kuruluş harici yönlendirme (null = panel içi) */
export function kurulusExternalRedirect(section: string | null, tab: string | null): string | null {
  if (tab === 'sql') return '/tools/sistem?tab=sql';
  if (section === 'channel-manager') return '/settings/integrations/channel-manager';
  return null;
}
