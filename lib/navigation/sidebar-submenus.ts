/**
 * Mockup ▶ alt menü ağaçları — anahtar: `${groupId}:${parentLabel}`
 */

import { KONTRAT_TABS, KURULUS_NAV, type KurulusNavEntry } from './kurulus-nav';

export type SidebarSubItem = {
  label: string;
  href: string;
  separator?: boolean;
  children?: SidebarSubItem[];
};
function sub(label: string, href: string, children?: SidebarSubItem[]): SidebarSubItem {
  return children?.length ? { label, href, children } : { label, href };
}

function fromKurulus(entries: KurulusNavEntry[]): SidebarSubItem[] {
  return entries.map((e) => {
    if (e.separator) return { label: '', href: '#', separator: true };
    return {
      label: e.label,
      href: e.href,
      children: e.children?.length ? fromKurulus(e.children) : undefined,
    };
  });
}

function fromTabs(tabs: Array<{ label: string; href: string }>): SidebarSubItem[] {
  return tabs.map((t) => sub(t.label, t.href));
}

const REPORT_SAMPLES: Record<string, string[]> = {
  forecast: ['Doluluk Tahmini', 'Gelir Tahmini', 'Segment Tahmini', 'Aylık Forecast'],
  rezervasyon: ['Rezervasyon Listesi', 'Geliş Listesi', 'Ayrılış Listesi', 'No Show Listesi'],
  gunluk: ['In House List', 'Boş Oda Listesi', 'VIP Listesi', 'Transfer Listesi'],
  kathizmetleri: ['HK Durum Raporu', 'Temiz Oda Listesi', 'Kirli Oda Listesi', 'OOO Oda Listesi'],
  gelir: ['Günlük Gelir', 'Departman Gelirleri', 'Market Gelirleri', 'Vergi Özeti'],
  kontrol: ['Kasa Defteri', 'Tahsilat Özeti', 'Döviz İşlemleri', 'Kasa Kapatma'],
  muhasebe: ['Fatura Listesi', 'Proforma Listesi', 'Cari Ekstre', 'Hesap Özeti'],
  yonetim: ['Yönetim Raporu', 'Doluluk Analizi', 'RevPAR Raporu', 'Bütçe Karşılaştırma'],
  crm: ['Misafir Listesi', 'Tekrarlayan Misafirler', 'VIP Raporu', 'Yorum Özeti'],
};

function reportCategoryItems(categoryId: string): SidebarSubItem[] {
  const labels = REPORT_SAMPLES[categoryId] ?? ['Özet Rapor', 'Detay Rapor', 'Liste'];
  return labels.map((label) => sub(label, `/reports?category=${categoryId}&report=${encodeURIComponent(label)}`));
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
    sub('Genel Bakım', '/settings/integrations/tesa'),
    sub('Kanal Yöneticisi', '/settings?section=channel-manager'),
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
    sub('Misafir Kartı', '/guest-relations/repeat-guests'),
    sub('Misafir Arama', '/guest-relations/repeat-guests?tab=search'),
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
