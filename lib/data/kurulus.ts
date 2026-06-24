import { PROPERTY } from '@/lib/navigation';

export type KurulusUser = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string;
  active: boolean;
  lastLogin?: string;
};

export type CodeRow = {
  code: string;
  name: string;
  description?: string;
  active: boolean;
};

export const HOTEL_INFO = {
  name: PROPERTY.name,
  code: PROPERTY.code,
  company: 'Hotel Sapphire Turizm A.Ş.',
  taxOffice: 'Beyoğlu',
  taxNumber: '1234567890',
  address: 'Sultanahmet Mah. Divanyolu Cad. No:12, Fatih / İstanbul',
  phone: '+90 212 555 01 00',
  email: 'info@sapphirehotel.com',
  stars: 5,
  totalRooms: PROPERTY.totalRooms,
  businessDate: PROPERTY.businessDate,
  checkInTime: '14:00',
  checkOutTime: '12:00',
  currency: 'TRY',
};

export const DEMO_COMPANIES = [
  { code: 'SAPPHIRE', name: 'Hotel Sapphire Turizm A.Ş.', branch: 'İstanbul Merkez', active: true },
  { code: 'SAPPHIRE-ANK', name: 'Sapphire Ankara Şubesi', branch: 'Ankara', active: true },
];

export const DEMO_USERS: KurulusUser[] = [
  { id: 'u1', username: 'arda.yilmaz', fullName: 'Arda Yılmaz', role: 'Ön Büro Müdürü', department: 'Ön Büro', active: true, lastLogin: '2026-06-18 08:42' },
  { id: 'u2', username: 'elif.kaya', fullName: 'Elif Kaya', role: 'Resepsiyonist', department: 'Ön Büro', active: true, lastLogin: '2026-06-18 07:55' },
  { id: 'u3', username: 'murat.sen', fullName: 'Murat Şen', role: 'HK Süpervizör', department: 'Kat Hizmetleri', active: true, lastLogin: '2026-06-17 16:20' },
  { id: 'u4', username: 'deniz.aktas', fullName: 'Deniz Aktaş', role: 'Muhasebe', department: 'Finans', active: true, lastLogin: '2026-06-18 09:10' },
  { id: 'u5', username: 'admin', fullName: 'Sistem Yöneticisi', role: 'Admin', department: 'IT', active: true, lastLogin: '2026-06-18 06:00' },
];

export const USER_GROUPS = [
  { code: 'FO-MGR', name: 'Ön Büro Yönetici', users: 3 },
  { code: 'FO-CLK', name: 'Resepsiyon', users: 8 },
  { code: 'HK', name: 'Kat Hizmetleri', users: 12 },
  { code: 'FN', name: 'Finans', users: 4 },
  { code: 'ADM', name: 'Sistem Admin', users: 2 },
];

export const MARKET_CODES: CodeRow[] = [
  { code: 'BAR', name: 'Bar Rate', description: 'En iyi müsait fiyat', active: true },
  { code: 'CORP', name: 'Kurumsal', description: 'Şirket anlaşmaları', active: true },
  { code: 'FIT', name: 'Bireysel', description: 'Walk-in / FIT', active: true },
  { code: 'GRP', name: 'Grup', description: 'Grup konaklamaları', active: true },
  { code: 'OTA', name: 'Online Kanal', description: 'Booking / Expedia vb.', active: true },
];

export const SEGMENT_CODES: CodeRow[] = [
  { code: 'LEIS', name: 'Leisure', active: true },
  { code: 'BUS', name: 'Business', active: true },
  { code: 'MICE', name: 'Toplantı & Etkinlik', active: true },
  { code: 'LONG', name: 'Uzun Konaklama', active: true },
];

export const SOURCE_CODES: CodeRow[] = [
  { code: 'DIR', name: 'Doğrudan', active: true },
  { code: 'TA', name: 'Seyahat Acentası', active: true },
  { code: 'WEB', name: 'Web Sitesi', active: true },
  { code: 'WLK', name: 'Walk-in', active: true },
];

export const DEPARTMENTS: CodeRow[] = [
  { code: '1000', name: 'Oda Geliri', active: true },
  { code: '1100', name: 'Yiyecek & İçecek', active: true },
  { code: '1200', name: 'Minibar', active: true },
  { code: '1300', name: 'SPA & Wellness', active: true },
  { code: '2000', name: 'Diğer Gelirler', active: true },
];

export const CURRENCIES = [
  { code: 'TRY', name: 'Türk Lirası', rate: 1, symbol: '₺' },
  { code: 'USD', name: 'ABD Doları', rate: 34.25, symbol: '$' },
  { code: 'EUR', name: 'Euro', rate: 37.1, symbol: '€' },
  { code: 'GBP', name: 'İngiliz Sterlini', rate: 43.5, symbol: '£' },
];

export const MEAL_PLANS: CodeRow[] = [
  { code: 'RO', name: 'Room Only', active: true },
  { code: 'BB', name: 'Bed & Breakfast', active: true },
  { code: 'HB', name: 'Half Board', active: true },
  { code: 'FB', name: 'Full Board', active: true },
  { code: 'AI', name: 'All Inclusive', active: false },
];

export const NATIONALITIES = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'DE', name: 'Almanya' },
  { code: 'GB', name: 'Birleşik Krallık' },
  { code: 'US', name: 'ABD' },
  { code: 'RU', name: 'Rusya' },
  { code: 'SA', name: 'Suudi Arabistan' },
];

export type LanguageRow = {
  code: string;
  name: string;
  nativeName: string;
  active: boolean;
  defaultLang: boolean;
};

export const DEMO_LANGUAGES: LanguageRow[] = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', active: true, defaultLang: true },
  { code: 'en', name: 'İngilizce', nativeName: 'English', active: true, defaultLang: false },
  { code: 'de', name: 'Almanca', nativeName: 'Deutsch', active: true, defaultLang: false },
  { code: 'ru', name: 'Rusça', nativeName: 'Русский', active: true, defaultLang: false },
  { code: 'ar', name: 'Arapça', nativeName: 'العربية', active: false, defaultLang: false },
];

export const CONFIG_PARAMS = [
  { key: 'AUTO_NIGHT_POST', value: 'Evet', description: 'Gece oda ücreti otomatik basım' },
  { key: 'MARKET_REQUIRED', value: 'Hayır', description: 'Rezervasyonda market zorunlu' },
  { key: 'DEFAULT_CURRENCY', value: 'TRY', description: 'Varsayılan para birimi' },
  { key: 'CHECKOUT_TIME', value: '12:00', description: 'Standart çıkış saati' },
  { key: 'EARLY_CHECKIN', value: '10:00', description: 'Erken giriş limiti' },
];

export const USER_PARAMS = [
  { key: 'DEFAULT_LANG', value: 'tr', description: 'Varsayılan dil' },
  { key: 'RACK_VIEW', value: 'classic', description: 'Oda rack görünümü' },
  { key: 'AUTO_LOGOUT_MIN', value: '30', description: 'Otomatik çıkış (dk)' },
];

export type RatePlanRow = {
  code: string;
  name: string;
  market: string;
  baseRate: string;
  currency: string;
  active: boolean;
};

export const RATE_PLANS: RatePlanRow[] = [
  { code: 'BAR-STD', name: 'Standart BAR', market: 'BAR', baseRate: '₺4.800', currency: 'TRY', active: true },
  { code: 'CORP-A', name: 'Kurumsal A', market: 'CORP', baseRate: '₺4.200', currency: 'TRY', active: true },
  { code: 'OTA-BKG', name: 'Booking.com', market: 'OTA', baseRate: '€145', currency: 'EUR', active: true },
  { code: 'GRP-2026', name: 'Grup Yaz 2026', market: 'GRP', baseRate: '₺3.900', currency: 'TRY', active: true },
];

export type AgencyRow = {
  code: string;
  name: string;
  commission: string;
  contractEnd: string;
  active: boolean;
};

export const AGENCY_CONTRACTS: AgencyRow[] = [
  { code: 'BKG', name: 'Booking.com', commission: '%15', contractEnd: '2026-12-31', active: true },
  { code: 'EXP', name: 'Expedia', commission: '%18', contractEnd: '2026-12-31', active: true },
  { code: 'TUI', name: 'TUI Deutschland', commission: '%12', contractEnd: '2027-03-31', active: true },
  { code: 'DIR', name: 'Doğrudan / Walk-in', commission: '—', contractEnd: '—', active: true },
];

export const REVENUE_GROUPS: CodeRow[] = [
  { code: 'RM', name: 'Oda Geliri', description: 'Konaklama', active: true },
  { code: 'FB', name: 'Yiyecek & İçecek', description: 'Restoran / bar', active: true },
  { code: 'MB', name: 'Minibar', description: 'Oda minibar', active: true },
  { code: 'SPA', name: 'SPA & Wellness', description: 'Spa hizmetleri', active: true },
  { code: 'OTH', name: 'Diğer', description: 'Çeşitli gelirler', active: true },
];

export type MealPriceRow = {
  mealPlan: string;
  roomType: string;
  adult: string;
  child: string;
  season: string;
};

export const MEAL_PRICES: MealPriceRow[] = [
  { mealPlan: 'BB', roomType: 'STD', adult: '₺450', child: '₺225', season: 'Yaz 2026' },
  { mealPlan: 'HB', roomType: 'STD', adult: '₺850', child: '₺425', season: 'Yaz 2026' },
  { mealPlan: 'FB', roomType: 'DLX', adult: '₺1.200', child: '₺600', season: 'Yaz 2026' },
  { mealPlan: 'BB', roomType: 'SUI', adult: '₺650', child: '₺325', season: 'Yaz 2026' },
];

export const HOTEL_SEASONS = [
  { code: 'LOW', name: 'Düşük Sezon', start: '2026-01-01', end: '2026-03-31', active: true },
  { code: 'MID', name: 'Orta Sezon', start: '2026-04-01', end: '2026-05-31', active: true },
  { code: 'HIGH', name: 'Yüksek Sezon', start: '2026-06-01', end: '2026-09-30', active: true },
  { code: 'PEAK', name: 'Pik Sezon', start: '2026-07-15', end: '2026-08-20', active: true },
];

export const BRANCHES = [
  { code: 'IST-01', name: 'Sapphire İstanbul', city: 'İstanbul', rooms: 186, active: true },
  { code: 'ANK-01', name: 'Sapphire Ankara', city: 'Ankara', rooms: 94, active: true },
  { code: 'AYT-01', name: 'Sapphire Antalya', city: 'Antalya', rooms: 220, active: false },
];

export const WAREHOUSES = [
  { code: 'ANA', name: 'Ana Depo', location: 'Bodrum -1', active: true },
  { code: 'HK', name: 'HK Deposu', location: 'Kat 2', active: true },
  { code: 'FB', name: 'Mutfak Deposu', location: 'Ana mutfak', active: true },
];

export const FISCAL_DEVICES = [
  { code: 'YK-01', name: 'Ön Büro Yazarkasa', serial: 'SN-88421', active: true },
  { code: 'YK-02', name: 'Restoran POS', serial: 'SN-88422', active: true },
  { code: 'YK-03', name: 'Spa POS', serial: 'SN-88423', active: false },
];

export const RES_TYPES: CodeRow[] = [
  { code: 'IND', name: 'Bireysel', active: true },
  { code: 'GRP', name: 'Grup', active: true },
  { code: 'CRP', name: 'Kurumsal', active: true },
  { code: 'WLK', name: 'Walk-in', active: true },
];

export const EXTRA_CHARGES = [
  { code: 'COT', name: 'Bebek Yatağı', price: '₺200/gece', active: true },
  { code: 'BED', name: 'Ek Yatak', price: '₺350/gece', active: true },
  { code: 'PET', name: 'Evcil Hayvan', price: '₺500/konaklama', active: true },
  { code: 'LCO', name: 'Geç Çıkış', price: '₺800', active: true },
];
