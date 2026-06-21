/** Kuruluş alt menüsü — mockup SC-003 yapısı, Roomio rotalarına map edilmiş */

export type KurulusNavEntry = {
  id: string;
  label: string;
  href: string;
  shortcut?: string;
  separator?: boolean;
  children?: KurulusNavEntry[];
};

export const KURULUS_ODA_TANIMLARI: KurulusNavEntry[] = [
  { id: 'oda-tip', label: 'Oda Tip Tanımları', href: '/settings?tab=room-types' },
  { id: 'oda-no', label: 'Oda No Tanımları', href: '/settings?tab=rooms' },
  { id: 'oda-kat', label: 'Kat Tanımları', href: '/settings?tab=floors' },
];

export const KURULUS_NAV: KurulusNavEntry[] = [
  { id: 'otel-bilgileri', label: 'Otel Bilgileri', href: '/settings' },
  { id: 'demo-data', label: 'Rezervasyon Demo Data Yarat', href: '/settings?section=demo-data' },
  { id: 'market-required', label: 'Market Girişi Zorunlu Olsun', href: '/settings?section=market-required' },
  { id: 'sep-1', label: '', href: '#', separator: true },
  { id: 'company-default', label: 'Genel Şirketi Belirle', href: '/settings?section=company-default' },
  { id: 'company-create', label: 'Şirket Kur', href: '/settings?section=company-create' },
  { id: 'company-select', label: 'Şirket Seç', href: '/settings?section=company-select', shortcut: 'Ctrl+Alt+S' },
  { id: 'company-list', label: 'Şirket Listesi', href: '/settings?section=company-list' },
  { id: 'branches', label: 'Şube Tanımları', href: '/settings?section=branches' },
  { id: 'sep-2', label: '', href: '#', separator: true },
  { id: 'program-date', label: 'Program Tarihi Değiştir', href: '/settings?section=program-date' },
  { id: 'config', label: 'Konfigürasyon Tablosu', href: '/settings?section=config', shortcut: 'Ctrl+Alt+C' },
  { id: 'user-params', label: 'Kullanıcı Parametreleri', href: '/settings?section=user-params' },
  { id: 'sep-3', label: '', href: '#', separator: true },
  { id: 'users', label: 'Kullanıcı Tanımları', href: '/settings?section=users', shortcut: 'Ctrl+Alt+K' },
  { id: 'user-groups', label: 'Kullanıcı Grup Tanımları', href: '/settings?section=user-groups', shortcut: 'Ctrl+Alt+G' },
  {
    id: 'room-definitions',
    label: 'Oda Tanımları',
    href: '/settings?tab=room-types',
    children: KURULUS_ODA_TANIMLARI,
  },
  { id: 'seasons', label: 'Otel Sezon Tanımları', href: '/settings?section=seasons' },
  { id: 'open-close', label: 'Otel Açılış Kapanış Tarihleri', href: '/settings?section=open-close' },
  { id: 'source-codes', label: 'Kaynak Kodları', href: '/settings?section=sources' },
  { id: 'segment-codes', label: 'Segment Kodları', href: '/settings?section=segments' },
  { id: 'market-codes', label: 'Market Kodları', href: '/settings?section=markets', shortcut: 'Ctrl+Alt+M' },
  { id: 'res-types', label: 'Rezervasyon Tipleri', href: '/settings?section=res-types' },
  { id: 'sep-4', label: '', href: '#', separator: true },
  { id: 'revenue-groups', label: 'Gelir Grup Tanımları', href: '/settings?section=revenue-groups', shortcut: 'Ctrl+Alt+P' },
  { id: 'departments', label: 'Departman Tanımları', href: '/settings?section=departments', shortcut: 'Ctrl+Alt+D' },
  { id: 'meal-plans', label: 'Pansiyon Tanımları', href: '/settings?section=meal-plans' },
  { id: 'meal-prices', label: 'Pansiyon Fiyatlarını Tanımlama', href: '/settings?section=meal-prices' },
  { id: 'sep-5', label: '', href: '#', separator: true },
  { id: 'warehouse', label: 'Depo Tanımları', href: '/settings?section=warehouse' },
  { id: 'currencies', label: 'Döviz Tanımları', href: '/settings?section=currencies' },
  { id: 'tax-rules', label: 'Vergi Oranları', href: '/settings?section=tax-rules' },
  { id: 'nationalities', label: 'Uyruk Tanımları', href: '/settings?section=nationalities' },
  { id: 'fiscal', label: 'Yazarkasa Tanımları', href: '/settings?section=fiscal' },
];

export const KONTRAT_TABS = [
  { label: 'Fiyat Listeleri', href: '/settings?section=rate-plans' },
  { label: 'Acenta Kontratları', href: '/settings?section=agencies' },
  { label: 'Market / Segment', href: '/settings?section=markets' },
  { label: 'Standart Ek Fiyatlar', href: '/settings?section=extras' },
];
