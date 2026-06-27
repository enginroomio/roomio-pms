/** Form tasarım kataloğu — Elektra rezervasyon kartı ile hizalı */

import { PAYMENT_CURRENCIES } from '@/lib/exchange/types';

export type FormFieldType = 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'textarea' | 'currency' | 'time';

export type FormFieldDef = {
  key: string;
  label: string;
  type: FormFieldType;
  group?: string;
  placeholder?: string;
  options?: string[];
  defaultValue?: string | number;
  elektraRef?: string;
};

export type FormStepDef = {
  id: string;
  title: string;
  description?: string;
};

export type FormPageDef = {
  id: string;
  label: string;
  emoji: string;
  hint: string;
  href: string;
  mockupRef?: string;
  steps: FormStepDef[];
  fields: FormFieldDef[];
  defaultFields: string[];
};

export type FormFieldConfig = {
  key: string;
  stepId: string;
  label?: string;
  required?: boolean;
  width?: 'full' | 'half';
  custom?: boolean;
  type?: FormFieldType;
  options?: string[];
};

export type FormLayout = {
  steps: FormStepDef[];
  fields: FormFieldConfig[];
};

export type FormTemplate = {
  id: string;
  name: string;
  pageId: string;
  module: string;
  columns: string[];
  layout: FormLayout;
  updatedAt: string;
};

const SENDER_TYPES = ['Acenta', 'Şirket', 'Münferit'];
const RES_TYPES = ['Kesin', 'Opsiyon', 'Beklemede'];
const PAYMENT_TYPES = ['Nakit', 'Kredi Kartı', 'Cari', 'Depozit', 'Havale'];
const PAYER_TYPES = ['Misafir', 'Acenta'];

function page(
  id: string,
  label: string,
  emoji: string,
  hint: string,
  href: string,
  steps: FormStepDef[],
  fields: FormFieldDef[],
  defaultFields: string[],
  mockupRef?: string,
): FormPageDef {
  return { id, label, emoji, hint, href, steps, fields, defaultFields, mockupRef };
}

/** Elektra screen-038 — form tasarımdan eklenebilir gelişmiş alanlar */
export const ELEKTRA_REZ_GAP_FIELDS = [] as const;

export const FORM_PAGES: FormPageDef[] = [
  page(
    'reservations-new',
    'Yeni Rezervasyon',
    '📝',
    'Elektra Rezervasyon Kartı (screen-038) ile uyumlu sihirbaz',
    '/reservations/new',
    [
      { id: 'sender', title: 'Gönderen & kanal', description: 'Elektra: Gönderen türü, acenta, voucher' },
      { id: 'guest', title: 'Misafir', description: 'Kimlik, iletişim, uyruk' },
      { id: 'egm', title: 'EGM Kimlik', description: 'KBS bildirimi — arşivden otomatik veya manuel giriş' },
      { id: 'stay', title: 'Konaklama', description: 'Tarih, oda, kişi sayısı' },
      { id: 'pricing', title: 'Fiyatlandırma', description: 'Döviz, giriş günü kuru, market, ödeme' },
      { id: 'extra', title: 'Ek bilgiler', description: 'Notlar, transfer, depozit' },
    ],
    [
      { key: 'senderType', label: 'Gönderen türü', type: 'select', group: 'Gönderen', options: SENDER_TYPES, defaultValue: 'Münferit', elektraRef: 'Gönderen Türü' },
      { key: 'agency', label: 'Acenta', type: 'text', group: 'Gönderen', defaultValue: 'Direct', elektraRef: 'Acenta' },
      { key: 'companyName', label: 'Şirket adı', type: 'text', group: 'Gönderen', elektraRef: 'Şirket' },
      { key: 'voucherNo', label: 'Voucher no', type: 'text', group: 'Gönderen', placeholder: 'Konfirmasyon no', elektraRef: 'Voucher' },
      { key: 'resType', label: 'Rezervasyon tipi', type: 'select', group: 'Gönderen', options: RES_TYPES, defaultValue: 'Kesin', elektraRef: 'Durum' },
      { key: 'guestName', label: 'Misafir adı soyadı', type: 'text', group: 'Misafir', placeholder: 'Ad Soyad', elektraRef: 'Misafir adı' },
      { key: 'email', label: 'E-posta', type: 'email', group: 'Misafir' },
      { key: 'phone', label: 'Telefon', type: 'tel', group: 'Misafir' },
      { key: 'nationality', label: 'Uyruk', type: 'select', group: 'Misafir', options: ['TR', 'DE', 'GB', 'US', 'RU', 'IT', 'FR', 'NL', 'SA', 'AE'], defaultValue: 'TR', elektraRef: 'Uyruk (zorunlu)' },
      { key: 'idNo', label: 'Kimlik / pasaport no', type: 'text', group: 'Misafir' },
      { key: 'vipLevel', label: 'VIP seviye', type: 'select', group: 'Misafir', options: ['—', 'Silver', 'Gold', 'Platinum'], elektraRef: 'VIP' },
      { key: 'firstName', label: 'Ad (EGM)', type: 'text', group: 'EGM', elektraRef: 'Misafir adı' },
      { key: 'lastName', label: 'Soyad (EGM)', type: 'text', group: 'EGM' },
      { key: 'idType', label: 'Belge tipi', type: 'select', group: 'EGM', options: ['TCKN', 'PASSPORT', 'OTHER'], defaultValue: 'TCKN' },
      { key: 'birthDate', label: 'Doğum tarihi', type: 'date', group: 'EGM' },
      { key: 'birthPlace', label: 'Doğum yeri', type: 'text', group: 'EGM' },
      { key: 'gender', label: 'Cinsiyet', type: 'select', group: 'EGM', options: ['E', 'K'] },
      { key: 'fatherName', label: 'Baba adı', type: 'text', group: 'EGM' },
      { key: 'motherName', label: 'Anne adı', type: 'text', group: 'EGM' },
      { key: 'checkIn', label: 'Giriş tarihi', type: 'date', group: 'Konaklama', elektraRef: 'Giriş' },
      { key: 'checkOut', label: 'Çıkış tarihi', type: 'date', group: 'Konaklama', elektraRef: 'Çıkış' },
      { key: 'arrivalTime', label: 'Tahmini giriş saati', type: 'time', group: 'Konaklama', defaultValue: '14:00', elektraRef: 'Check-in saati' },
      { key: 'departureTime', label: 'Tahmini çıkış saati', type: 'time', group: 'Konaklama', defaultValue: '12:00', elektraRef: 'Check-out saati' },
      { key: 'roomType', label: 'Oda tipi', type: 'select', group: 'Konaklama', options: ['SGL', 'DBL', 'TWN', 'TPL', 'SUI'], elektraRef: 'Oda Tipi' },
      { key: 'roomCount', label: 'Oda sayısı', type: 'number', group: 'Konaklama', defaultValue: 1, elektraRef: 'Oda Sayısı' },
      { key: 'fixRoomNo', label: 'Sabitle oda no', type: 'text', group: 'Konaklama', placeholder: 'Örn. 312', elektraRef: 'Oda Blokajı Sabitle' },
      { key: 'mealPlan', label: 'Pansiyon', type: 'select', group: 'Konaklama', options: ['RO', 'BB', 'HB', 'FB', 'AI'], elektraRef: 'Pansiyon Tipi' },
      { key: 'adults', label: 'Yetişkin', type: 'number', group: 'Konaklama', defaultValue: 2 },
      { key: 'children', label: 'Çocuk', type: 'number', group: 'Konaklama', defaultValue: 0 },
      { key: 'infants', label: 'Bebek', type: 'number', group: 'Konaklama', defaultValue: 0, elektraRef: 'Bebek sayısı' },
      { key: 'currency', label: 'Döviz kodu', type: 'currency', group: 'Fiyat', options: [...PAYMENT_CURRENCIES], elektraRef: 'Döviz Kodu' },
      { key: 'rateDate', label: 'Kur günü (giriş)', type: 'date', group: 'Fiyat', elektraRef: 'Kur Günü' },
      { key: 'rate', label: 'Gece fiyatı', type: 'number', group: 'Fiyat', elektraRef: 'Fiyat' },
      { key: 'rateCode', label: 'Fiyat kodu', type: 'text', group: 'Fiyat', placeholder: 'BAR-2026', elektraRef: 'Fiyat Kodu' },
      { key: 'discountPct', label: 'İndirim %', type: 'number', group: 'Fiyat', defaultValue: 0, elektraRef: 'İndirim' },
      { key: 'market', label: 'Market', type: 'select', group: 'Kanal', options: ['BAR', 'CORP', 'FIT', 'GRP', 'OTA'], defaultValue: 'BAR', elektraRef: 'Market' },
      { key: 'segment', label: 'Segment', type: 'select', group: 'Kanal', options: ['LEIS', 'BUS', 'MICE', 'LONG'], defaultValue: 'LEIS', elektraRef: 'Segment' },
      { key: 'source', label: 'Kaynak', type: 'select', group: 'Kanal', options: ['DIR', 'TA', 'WEB', 'WLK'], defaultValue: 'DIR', elektraRef: 'Kaynak Kodu' },
      { key: 'paymentType', label: 'Ödeme tipi', type: 'select', group: 'Kanal', options: PAYMENT_TYPES, defaultValue: 'Kredi Kartı', elektraRef: 'Ödeme Tipi' },
      { key: 'payerType', label: 'Ödeyen', type: 'select', group: 'Kanal', options: PAYER_TYPES, defaultValue: 'Misafir', elektraRef: 'Ödeyen Türü' },
      { key: 'depositAmount', label: 'Depozit / kapora', type: 'number', group: 'Ek', defaultValue: 0, elektraRef: 'Depozit' },
      { key: 'transferIn', label: 'Geliş transfer saati', type: 'time', group: 'Ek', elektraRef: 'Geliş Transfer' },
      { key: 'transferOut', label: 'Gidiş transfer saati', type: 'time', group: 'Ek', elektraRef: 'Gidiş Transfer' },
      { key: 'flightNo', label: 'Uçuş no', type: 'text', group: 'Ek', elektraRef: 'Uçuş No' },
      { key: 'plateNo', label: 'Plaka no', type: 'text', group: 'Ek', elektraRef: 'Plaka' },
      { key: 'checkInNote', label: 'Check-in notu', type: 'textarea', group: 'Notlar', elektraRef: 'Check in Notu' },
      { key: 'roomNote', label: 'Oda notu', type: 'textarea', group: 'Notlar', elektraRef: 'Oda Notu' },
      { key: 'checkOutNote', label: 'Check-out notu', type: 'textarea', group: 'Notlar', elektraRef: 'Check out Notu' },
      { key: 'notes', label: 'Genel not', type: 'textarea', group: 'Notlar' },
    ],
    [
      'senderType', 'agency', 'companyName', 'voucherNo', 'resType',
      'guestName', 'email', 'phone', 'nationality', 'idNo', 'vipLevel',
      'firstName', 'lastName', 'idType', 'birthDate', 'birthPlace', 'gender', 'fatherName', 'motherName',
      'checkIn', 'checkOut', 'arrivalTime', 'departureTime', 'roomType', 'roomCount', 'fixRoomNo', 'mealPlan', 'adults', 'children', 'infants',
      'currency', 'rateDate', 'rate', 'rateCode', 'discountPct', 'market', 'segment', 'source', 'paymentType', 'payerType',
      'depositAmount', 'transferIn', 'transferOut', 'flightNo', 'plateNo',
      'checkInNote', 'roomNote', 'checkOutNote', 'notes',
    ],
  ),
  page(
    'reservations-list',
    'Rezervasyon Listesi',
    '📋',
    'Liste filtre şeridi ve tablo sütunları',
    '/reservations',
    [{ id: 'main', title: 'Liste', description: 'Tablo ve filtreler' }],
    [
      { key: 'refNo', label: 'Rezervasyon no', type: 'text', group: 'Tablo' },
      { key: 'guestName', label: 'Misafir', type: 'text', group: 'Tablo' },
      { key: 'checkIn', label: 'Giriş', type: 'date', group: 'Tablo' },
      { key: 'status', label: 'Durum', type: 'text', group: 'Tablo' },
      { key: 'rate', label: 'Fiyat', type: 'number', group: 'Tablo' },
    ],
    ['refNo', 'guestName', 'checkIn', 'checkOut', 'roomType', 'status', 'rate'],
  ),
];

export function formPageById(id: string): FormPageDef | undefined {
  return FORM_PAGES.find((p) => p.id === id);
}

export function formFieldLabel(pageId: string, key: string, override?: string): string {
  if (override) return override;
  const page = formPageById(pageId);
  return page?.fields.find((f) => f.key === key)?.label ?? key;
}

function stepForField(page: FormPageDef, key: string): string {
  const def = page.fields.find((f) => f.key === key);
  if (!def) return page.steps[page.steps.length - 1]?.id ?? 'extra';
  const g = def.group ?? '';
  if (g === 'Gönderen' || g === 'Kanal') return g === 'Gönderen' ? 'sender' : 'pricing';
  if (g === 'Misafir') return 'guest';
  if (g === 'EGM') return 'egm';
  if (g === 'Konaklama') return 'stay';
  if (g === 'Fiyat') return 'pricing';
  if (g === 'Notlar' || g === 'Ek') return 'extra';
  return 'extra';
}

export function defaultFormLayout(pageId: string): FormLayout | null {
  const p = formPageById(pageId);
  if (!p) return null;
  const requiredKeys = new Set(['guestName', 'checkIn', 'checkOut', 'nationality']);
  return {
    steps: p.steps,
    fields: p.defaultFields.map((key) => ({
      key,
      stepId: stepForField(p, key),
      required: requiredKeys.has(key),
      width: ['notes', 'checkInNote', 'roomNote', 'checkOutNote'].includes(key) ? 'full' as const : 'half' as const,
    })),
  };
}

/** Kayıtlı şablona yeni Elektra alanlarını ekler — eski şablonlar güncel kalır */
export function mergeFormLayoutWithDefaults(pageId: string, saved: FormLayout | null | undefined): FormLayout | null {
  const def = defaultFormLayout(pageId);
  if (!def) return saved ?? null;
  if (!saved?.fields?.length) return def;
  const keys = new Set(saved.fields.map((f) => f.key));
  const mergedFields = [...saved.fields];
  for (const df of def.fields) {
    if (!keys.has(df.key)) mergedFields.push(df);
  }
  const hasEgmStep = saved.steps?.some((s) => s.id === 'egm');
  const steps = hasEgmStep ? saved.steps : def.steps;
  return {
    steps,
    fields: mergedFields,
  };
}

export function layoutFieldKeys(layout: FormLayout): string[] {
  return layout.fields.map((f) => f.key);
}

export function elektraCoverage(pageId: string): { total: number; covered: number; missing: string[] } {
  const page = formPageById(pageId);
  if (!page) return { total: 0, covered: 0, missing: [] };
  const withRef = page.fields.filter((f) => f.elektraRef);
  const inDefault = new Set(page.defaultFields);
  const missing = withRef.filter((f) => !inDefault.has(f.key)).map((f) => f.label);
  return { total: withRef.length, covered: withRef.length - missing.length, missing };
}
