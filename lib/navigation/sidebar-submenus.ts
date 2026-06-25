/**
 * Mockup ▶ alt menü ağaçları — anahtar: `${groupId}:${parentLabel}`
 */

import { KONTRAT_TABS, KURULUS_NAV, type KurulusNavEntry } from './kurulus-nav';
import { sidebarHrefI18nKey } from '@/lib/i18n/sidebar-href-i18n';

export type SidebarSubItem = {
  label: string;
  href: string;
  separator?: boolean;
  i18nKey?: string;
  children?: SidebarSubItem[];
};
function sub(label: string, href: string, children?: SidebarSubItem[]): SidebarSubItem {
  const i18nKey = sidebarHrefI18nKey(href);
  return children?.length
    ? { label, href, children, i18nKey }
    : { label, href, ...(i18nKey ? { i18nKey } : {}) };
}

function fromKurulus(entries: KurulusNavEntry[]): SidebarSubItem[] {
  return entries.map((e) => {
    if (e.separator) return { label: '', href: '#', separator: true };
    return {
      label: e.label,
      href: e.href,
      i18nKey: `nav.kurulus.${e.id}`,
      children: e.children?.length ? fromKurulus(e.children) : undefined,
    };
  });
}

function fromTabs(tabs: Array<{ label: string; href: string }>): SidebarSubItem[] {
  return tabs.map((t) => sub(t.label, t.href));
}

type ReportSample = { id: string; label: string };

const REPORT_SAMPLES: Record<string, ReportSample[]> = {
  forecast: [
    { id: 'occupancy', label: 'Doluluk Tahmini' },
    { id: 'revenue', label: 'Gelir Tahmini' },
    { id: 'segment', label: 'Segment Tahmini' },
    { id: 'monthly', label: 'Aylık Forecast' },
  ],
  rezervasyon: [
    { id: 'list', label: 'Rezervasyon Listesi' },
    { id: 'arrivals', label: 'Geliş Listesi' },
    { id: 'departures', label: 'Ayrılış Listesi' },
    { id: 'noshow', label: 'No Show Listesi' },
  ],
  gunluk: [
    { id: 'inhouse', label: 'In House List' },
    { id: 'vacant', label: 'Boş Oda Listesi' },
    { id: 'vip', label: 'VIP Listesi' },
    { id: 'transfer', label: 'Transfer Listesi' },
  ],
  kathizmetleri: [
    { id: 'status', label: 'HK Durum Raporu' },
    { id: 'clean', label: 'Temiz Oda Listesi' },
    { id: 'dirty', label: 'Kirli Oda Listesi' },
    { id: 'ooo', label: 'OOO Oda Listesi' },
  ],
  gelir: [
    { id: 'daily', label: 'Günlük Gelir' },
    { id: 'dept', label: 'Departman Gelirleri' },
    { id: 'market', label: 'Market Gelirleri' },
    { id: 'tax', label: 'Vergi Özeti' },
  ],
  kontrol: [
    { id: 'ledger', label: 'Kasa Defteri' },
    { id: 'collections', label: 'Tahsilat Özeti' },
    { id: 'fx', label: 'Döviz İşlemleri' },
    { id: 'close', label: 'Kasa Kapatma' },
  ],
  muhasebe: [
    { id: 'invoices', label: 'Fatura Listesi' },
    { id: 'proforma', label: 'Proforma Listesi' },
    { id: 'statement', label: 'Cari Ekstre' },
    { id: 'summary', label: 'Hesap Özeti' },
  ],
  yonetim: [
    { id: 'mgmt', label: 'Yönetim Raporu' },
    { id: 'occupancy', label: 'Doluluk Analizi' },
    { id: 'revpar', label: 'RevPAR Raporu' },
    { id: 'budget', label: 'Bütçe Karşılaştırma' },
  ],
  crm: [
    { id: 'guests', label: 'Misafir Listesi' },
    { id: 'repeaters', label: 'Tekrarlayan Misafirler' },
    { id: 'vip', label: 'VIP Raporu' },
    { id: 'reviews', label: 'Yorum Özeti' },
  ],
  egm: [
    { id: 'summary', label: 'Kimlik Bildirim Özeti' },
    { id: 'pending', label: 'Bekleyen Bildirimler' },
    { id: 'errors', label: 'Hatalı Bildirimler' },
    { id: 'nationality', label: 'Uyruk Dağılımı' },
  ],
  tis: [
    { id: 'nights', label: 'Günlük Geceleme' },
    { id: 'arrival-type', label: 'Geliş Tipi Dağılımı' },
    { id: 'nationality', label: 'Uyruk Bazlı Geceleme' },
    { id: 'monthly', label: 'Aylık TIS Özeti' },
  ],
  tga: [
    { id: 'segment', label: 'Segment Dağılımı' },
    { id: 'channel', label: 'Kanal Analizi' },
    { id: 'direct-ota', label: 'Direct vs OTA' },
    { id: 'mice', label: 'MICE / Leisure' },
  ],
};

const REPORT_FALLBACK: ReportSample[] = [
  { id: 'summary', label: 'Özet Rapor' },
  { id: 'detail', label: 'Detay Rapor' },
  { id: 'list', label: 'Liste' },
];

function reportCategoryItems(categoryId: string): SidebarSubItem[] {
  const items = REPORT_SAMPLES[categoryId] ?? REPORT_FALLBACK;
  return items.map((item) => ({
    label: item.label,
    href: `/reports?category=${categoryId}&report=${encodeURIComponent(item.label)}`,
    i18nKey: REPORT_SAMPLES[categoryId]
      ? `sidebar.report.${categoryId}.${item.id}`
      : `sidebar.report.fallback.${item.id}`,
  }));
}

export const SIDEBAR_SUBMENU_BY_KEY: Record<string, SidebarSubItem[]> = {
  'sistem:Kuruluş': fromKurulus(KURULUS_NAV),
  'sistem:Raporla': [
    sub('Raporlama Programı', '/reports'),
    sub('Özel Raporlar', '/reports?tab=special'),
    sub('Günlük Raporlar', '/reports?tab=daily'),
    sub('Yönetim Raporları', '/reports?tab=management'),
  ],
  'sistem:Servis Programları': [
    sub('Online Rezervasyon', '/settings/integrations/booking-engine'),
    sub('Kanal Yöneticisi', '/settings/integrations/channel-manager'),
    sub('Gelir Yönetimi (RMS)', '/revenue'),
    sub('Grup & Blok Yönetimi', '/groups'),
    sub('Sadakat Programı', '/loyalty'),
    sub('Production Deploy', '/tools/deploy'),
    sub('Dinamik Fiyat', '/settings/integrations/dynamic-pricing'),
    sub('Misafir Portalı', '/settings/integrations/guest-portal'),
    sub('e-Fatura', '/settings/integrations/efatura'),
    sub('WhatsApp API', '/settings/integrations/whatsapp'),
    sub('Check-in Kiosk', '/settings/integrations/kiosk'),
    sub('Sadakat / Bonus', '/settings/integrations/loyalty'),
    sub('SPA Yönetimi', '/settings/integrations/spa'),
    sub('Dijital Menü', '/settings/integrations/digital-menu'),
    sub('İtibar Yönetimi', '/settings/integrations/reputation'),
    sub('Banka Entegrasyonları', '/settings/integrations/banking'),
    sub('Çağrı Merkezi', '/settings/integrations/call-center'),
    sub('Tur Operatörü', '/settings/integrations/tour-operator'),
    sub('Viofun', '/settings/integrations/viofun'),
    sub('Misafir Uygulaması', '/settings/integrations/guest-app'),
    sub('AI Asistan', '/settings/integrations/ai-assistant'),
    sub('Marina', '/settings/integrations/marina'),
    sub('IK Portal', '/settings/integrations/hr-portal'),
    sub('Tedarik Portalı', '/settings/integrations/supplier-portal'),
    sub('Stok Takip', '/settings/integrations/inventory'),
    sub('Restoran Rezervasyon', '/settings/integrations/restaurant-booking'),
    sub('Sanal POS', '/settings/integrations/virtual-pos'),
    sub('Lite Mobile', '/settings/integrations/lite-mobile'),
    sub('Kalite Yönetimi', '/settings/integrations/quality'),
    sub('Karbon Dengeleme', '/settings/integrations/carbon'),
    sub('Fuar Otomasyon', '/settings/integrations/fair-events'),
    sub('Google Yedekleme', '/settings/integrations/google-backup'),
    sub('Demirbaş', '/settings/integrations/fixed-assets'),
    sub('Satın Alma', '/settings/integrations/procurement'),
    sub('Web Sitesi', '/settings/integrations/website-builder'),
    sub('Spor Salonu', '/settings/integrations/gym'),
    sub('e-İrsaliye', '/settings/integrations/e-dispatch'),
    sub('Kimlik Okuyucu', '/settings/integrations/id-reader'),
    sub('Genel Bakım', '/settings/integrations/tesa'),
    sub('Kapı Entegrasyonu', '/settings/integrations/tesa'),
    sub('Lisanslama', '/settings/licensing'),
    sub('Sync Durumu', '/settings?section=sync'),
  ],
  'sistem:Dil Tanımları': [
    sub('Form Metinleri', '/settings?section=lang-forms'),
    sub('Menü Metinleri', '/settings?section=lang-menus'),
    sub('Rapor Metinleri', '/settings?section=lang-reports'),
    sub('Uyruk Tanımları', '/settings?section=nationalities'),
  ],
  'rezervasyon:Servis': [
    sub('Canlı Destek', '/guest-relations'),
    sub('Servis / Yardım', '/guest-relations'),
    sub('Entegrasyonlar', '/settings/integrations/tesa'),
    sub('Rapor Tasarım', '/reports?tab=design'),
  ],
  'onkasa:Depozit İşlemleri': [
    sub('Depozit Tahsilat', '/reception/vacant?tab=deposit-collect'),
    sub('Depozit İade', '/reception/vacant?tab=deposit-refund'),
    sub('Depozit Listesi', '/reception/vacant?tab=deposit'),
    sub('Ön Ödeme', '/reception/arrivals?tab=prepay'),
    sub('Peşin Satış', '/reception/arrivals?tab=cash-sale'),
  ],
  'banket:Banket İlk Tanımlar': [
    sub('Salon Tanımları', '/fnb?tab=halls'),
    sub('Menü Paketleri', '/fnb?tab=menus'),
    sub('Banket Fiyatları', '/fnb?tab=rates'),
    sub('Ekipman Listesi', '/fnb?tab=equipment'),
    sub('Restoran Tanımları', '/fnb?tab=restaurant'),
  ],
  'banket:Raporlar': [
    sub('Salon Doluluk Raporu', '/reports?category=banket&report=occupancy'),
    sub('Etkinlik Gelir Raporu', '/reports?category=banket&report=revenue'),
    sub('Ajanda Raporu', '/fnb?tab=calendar'),
    sub('Anlaşma Listesi', '/fnb?tab=agreements'),
  ],
  'arkaburo:Acenta': fromTabs(KONTRAT_TABS),
  'arkaburo:Misafir': [
    sub('Misafir Kartı', '/reception/guest-profile'),
    sub('Misafir Arama', '/reception/guest-profile?q='),
    sub('Oda Bekleme Kuyruğu', '/reception/queue'),
    sub('VIP Konaklayanlar', '/guest-relations/vip'),
    sub('Misafir Notları', '/guest-relations/traces'),
    sub('Misafir Aktivite', '/guest-relations/guest-activities'),
    sub('Misafir Yorumları', '/guest-relations/reviews'),
  ],
  'arkaburo:Yönetim Raporu Hazırlama': [
    sub('Rapor Hazırla', '/reports?tab=prepare'),
    sub('Gelir Küpü Analizi', '/reports?tab=cube'),
    sub('Detaylı Doluluk Grafiği', '/reports?tab=occupancy'),
    sub('3 Yıllık Doluluk', '/reports?tab=3year'),
    sub('Departman Gelirleri', '/reports?tab=dept'),
    sub('Yönetim Özet Raporu', '/reports?tab=management'),
  ],
  'arkaburo:Bütçe Girişleri': [
    sub('Bütçe Girişi', '/accounting?tab=budget'),
    sub('Bütçe Değerleri', '/accounting?tab=budget-values'),
    sub('Otel Bütçe Değer', '/accounting?tab=budget-hotel'),
    sub('Departman Bütçe', '/accounting?tab=budget-dept'),
  ],
  'raporlar:FC-Forecast Raporları': reportCategoryItems('forecast'),
  'raporlar:FO-Önbüro Raporları': reportCategoryItems('rezervasyon'),
  'raporlar:DL-Günlük Raporlar (InHouse Lists)': reportCategoryItems('gunluk'),
  'raporlar:HK-HouseKeeping Raporları': reportCategoryItems('kathizmetleri'),
  'raporlar:DR-Günlük Gelir Raporları': reportCategoryItems('gelir'),
  'raporlar:CS-Kasa Raporları': reportCategoryItems('kontrol'),
  'raporlar:IN-Fatura Raporları': reportCategoryItems('muhasebe'),
  'raporlar:MG-Muhasebe Gelir Raporları': reportCategoryItems('gelir'),
  'raporlar:BO-ArkaBüro Raporları': reportCategoryItems('yonetim'),
  'raporlar:AG-Acenta Raporları': [
    sub('Acenta Analiz (Gün, Ay, Yıl)', '/reports?report=acenta-analiz'),
    sub('Dağılım Analizi', '/reports?report=distribution'),
    sub('Uyruk Raporu', '/reports?report=nationality'),
    sub('Market Rate Analiz', '/reports?report=market-rate'),
  ],
  'raporlar:GS-Misafir Raporları': reportCategoryItems('crm'),
  'raporlar:GR-Halkla İlişkiler': [
    sub('Misafir Yorum Listesi', '/guest-relations/reviews'),
    sub('Günlük Aktivite Listesi', '/guest-relations/daily-activities'),
    sub('Misafir Aktivite Listesi', '/guest-relations/guest-activities'),
    sub('VIP Misafir Listesi', '/guest-relations/vip'),
    sub('Tekrarlayan Misafirler', '/guest-relations/repeat-guests'),
  ],
  'raporlar:AC-Hesap Raporları': reportCategoryItems('muhasebe'),
  'raporlar:MR-Yönetim Raporları': reportCategoryItems('yonetim'),
  'raporlar:EGM Kimlik Raporları': [
    ...reportCategoryItems('egm'),
    sub('EGM Kimlik İşlemleri', '/reservations?tab=egm'),
    sub('Günlük Polis Kimlik Listesi', '/reception?tab=kimlik'),
  ],
  'raporlar:TIS Turizm İstatistik': reportCategoryItems('tis'),
  'raporlar:TGA Segment & Kanal': reportCategoryItems('tga'),
  'ayarlar:Tema Seç': [
    sub('Standart Tema', '/settings?tab=theme'),
    sub('Koyu Tema', '/settings?tab=theme&theme=dark'),
    sub('Roomio Klasik', '/settings?tab=theme&theme=classic'),
    sub('Tema Sabitle', '/settings?tab=theme&fixed=1'),
  ],
  'ayarlar:Santral': [
    sub('Santral Paneli', '/settings/integrations/pbx'),
    sub('Çağrı Kayıtları', '/settings?section=pbx-calls'),
    sub('Santral Ayarları', '/settings/integrations/pbx'),
    sub('Misafir Eşleştirme', '/settings?section=pbx-lookup'),
    sub('Adres ve Tel Rehberi', '/guest-relations?tab=directory'),
  ],
};
