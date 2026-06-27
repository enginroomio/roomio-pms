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
    href: `/reports?category=${categoryId}&report=${encodeURIComponent(item.id)}`,
    i18nKey: REPORT_SAMPLES[categoryId]
      ? `sidebar.report.${categoryId}.${item.id}`
      : `sidebar.report.fallback.${item.id}`,
  }));
}

export const SIDEBAR_SUBMENU_BY_KEY: Record<string, SidebarSubItem[]> = {
  'panel:Panel Merkezi': [
    sub('Panel Hub', '/?hub=panel'),
    sub('Dashboard', '/'),
    sub('Room Rack', '/rooms'),
    sub('Günlük Durum', '/?view=daily-status'),
    sub('Ekran Dizayn', '/tools/theme'),
  ],
  'panel:Ana Sayfa': [
    sub('Dashboard', '/'),
    sub('Ana Ekran Dizayn', '/tools/theme'),
    sub('Günlük Oda Durumu', '/?view=daily-status'),
    sub('Hızlı İşlemler', '/'),
  ],
  'panel:Oda Rack': [
    sub('Room Rack (F12)', '/rooms'),
    sub('Kapalı Odalar', '/rooms?filter=closed'),
    sub('Hızlı Blokaj', '/rooms?tab=blocking'),
    sub('Yeni Rack Görünümü', '/rooms?view=new-rack'),
  ],
  'panel:Günlük Oda Durumu': [
    sub('Günlük Özet', '/?view=daily-status'),
    sub('HK Oda Listesi', '/housekeeping/rooms'),
    sub('Oda Rack', '/rooms'),
    sub('Gelişler', '/reception/arrivals'),
    sub('Ayrılışlar', '/reception/departures'),
  ],
  'sistem:Kuruluş': [
    sub('Sistem Hub', '/settings?hub=sistem'),
    ...fromKurulus(KURULUS_NAV),
  ],
  'sistem:Sistem Merkezi': [
    sub('Sistem Merkezi', '/tools/sistem'),
    sub('SQL Mesaj', '/tools/sistem?tab=sql'),
    sub('Production Deploy', '/tools/deploy'),
    sub('KVKK & Gizlilik', '/settings/privacy'),
    sub('Lisanslama', '/settings/licensing'),
  ],
  'sistem:Raporla': [
    sub('Raporlama Programı', '/reports'),
    sub('Özel Raporlar', '/reports?tab=special'),
    sub('Günlük Raporlar', '/reports?tab=daily'),
    sub('Yönetim Raporları', '/reports?tab=management'),
    sub('Sistem Merkezi', '/tools/sistem'),
  ],
  'sistem:Rapor Tasarım': [
    sub('Rapor Şablonları', '/reports?tab=design'),
    sub('Form Tasarım', '/reports?tab=forms'),
    sub('Kullanıcı Raporları', '/reports?tab=user'),
  ],
  'sistem:Kullanıcı Tanımlı Raporlar': [
    sub('Kayıtlı Raporlar', '/reports?tab=user'),
    sub('Yeni Şablon', '/reports?tab=design'),
    sub('Form Şablonları', '/reports?tab=forms'),
  ],
  'sistem:Form Tasarım Listesi': [
    sub('Form Listesi', '/reports?tab=forms'),
    sub('Rapor Tasarım', '/reports?tab=design'),
    sub('Rezervasyon Formu', '/reservations/new'),
  ],
  'sistem:5651 Hotspot Loglama': [
    sub('5651 Ayarları', '/settings/compliance/5651'),
    sub('Cihazlar', '/settings/compliance/5651?tab=devices'),
    sub('Oturum Logları', '/settings/compliance/5651?tab=logs'),
    sub('WiFi Portal', '/wifi'),
  ],
  'sistem:TESA Kapı Kartı': [
    sub('TESA Bağlantı', '/settings/integrations/tesa'),
    sub('Günlük Kart', '/reception/inhouse?tab=daily-card'),
    sub('Kiosk', '/settings/integrations/kiosk'),
    sub('Kimlik Okuyucu', '/settings/integrations/id-reader'),
  ],
  'sistem:Grandstream Santral': [
    sub('UCM Bağlantı', '/settings/integrations/pbx'),
    sub('Çağrı Kayıtları', '/settings?section=pbx-calls'),
    sub('Misafir Eşleştirme', '/settings?section=pbx-lookup'),
  ],
  'sistem:SQL Mesaj': [
    sub('SQL Mesaj', '/tools/sistem?tab=sql'),
    sub('KVKK', '/settings/privacy'),
    sub('Gece Denetim', '/reports?tab=eod&action=audit'),
  ],
  'sistem:Servis Programları': [
    sub('Entegrasyon Merkezi', '/settings/integrations'),
    { label: '', href: '#', separator: true },
    sub('Grandstream Santral', '/settings/integrations/pbx'),
    sub('TESA Kapı Kartı', '/settings/integrations/tesa'),
    sub('5651 Hotspot Loglama', '/settings/compliance/5651'),
    sub('EGM Kimlik Bildirimi', '/settings/integrations/egm'),
    { label: '', href: '#', separator: true },
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
    sub('Lisanslama', '/settings/licensing'),
    sub('Sync Durumu', '/settings?section=sync'),
    sub('Sistem Merkezi', '/tools/sistem'),
  ],
  'sistem:Dil Tanımları': [
    sub('Dil Listesi', '/settings?section=language'),
    sub('Form Metinleri', '/settings?section=lang-forms'),
    sub('Menü Metinleri', '/settings?section=lang-menus'),
    sub('Rapor Metinleri', '/settings?section=lang-reports'),
    sub('Uyruk Tanımları', '/settings?section=nationalities'),
  ],
  'rezervasyon:Servis': [
    sub('Canlı Destek', '/guest-relations'),
    sub('Servis / Yardım', '/guest-relations'),
    sub('Entegrasyonlar', '/settings/integrations'),
    sub('Rapor Tasarım', '/reports?tab=design'),
  ],
  'rezervasyon:Rezervasyon Listesi': [
    sub('Tüm Liste', '/reservations'),
    sub('Yeni Kayıt', '/reservations/new'),
    sub('Takvim', '/reservations/calendar'),
    sub('Durum Takip', '/reservations?track=1'),
  ],
  'rezervasyon:Grafikler (F1)': [
    sub('Takvim', '/reservations/calendar'),
    sub('Müsaitlik', '/reservations?tab=availability'),
    sub('Fiyatlı Müsaitlik', '/reservations?tab=availability&prices=1'),
  ],
  'resepsiyon:Konaklayanlar Listesi': [
    sub('In House', '/reception/inhouse'),
    sub('Info Rack', '/guest-relations/info-rack'),
    sub('Gelişler', '/reception/arrivals'),
    sub('Ayrılışlar', '/reception/departures'),
  ],
  'resepsiyon:Gelişler': [
    sub('Geliş Listesi', '/reception/arrivals'),
    sub('Check-in', '/reception/arrivals'),
    sub('Boş Odalar', '/reception/vacant'),
  ],
  'onkasa:Kasa Defterleri': [
    sub('Kasa Defteri', '/reception?tab=kasa'),
    sub('Kasa Kapatma', '/reception?tab=kasa-close'),
    sub('Avans / Devir', '/reception?tab=advance'),
  ],
  'onkasa:Depozit İşlemleri': [
    sub('Depozit Tahsilat', '/reception/vacant?tab=deposit-collect'),
    sub('Depozit İade', '/reception/vacant?tab=deposit-refund'),
    sub('Depozit Listesi', '/reception/vacant?tab=deposit'),
    sub('Ön Ödeme', '/reception/arrivals?tab=prepay'),
    sub('Peşin Satış', '/reception/arrivals?tab=cash-sale'),
  ],
  'kat:Oda Listesi': [
    sub('Oda Durumu', '/housekeeping/rooms'),
    sub('HK Operasyon', '/housekeeping/operations'),
    sub('Oda Kontrolü', '/housekeeping/rooms?tab=control'),
    sub('Mobil HK', '/housekeeping/mobile'),
  ],
  'kat:Room Rack': [
    sub('Elektra Rack (F12)', '/rooms'),
    sub('Klasik Rack', '/rooms?view=new-rack'),
    sub('Kapalı Odalar', '/rooms?filter=closed'),
    sub('Blokaj Tablosu', '/rooms?tab=blocking'),
  ],
  'kat:Blokaj Tablosu': [
    sub('Hızlı Blokaj', '/rooms?tab=blocking'),
    sub('Room Rack', '/rooms'),
    sub('Kapalı Odalar', '/rooms?filter=closed'),
  ],
  'kat:Boş Oda Listesi': [
    sub('Boş Odalar', '/reception/vacant'),
    sub('Room Rack', '/rooms'),
    sub('HK Oda Listesi', '/housekeeping/rooms'),
  ],
  'kat:House Keeping Oda İşlemleri': [
    sub('Operasyon Merkezi', '/housekeeping/operations'),
    sub('Oda Listesi', '/housekeeping/rooms'),
    sub('Görevler', '/housekeeping/tasks'),
    sub('Arıza Kayıtları', '/housekeeping/faults'),
  ],
  'kat:House Keeping Oda Kontrolü': [
    sub('Oda Kontrolü', '/housekeeping/rooms?tab=control'),
    sub('Kontrol Listesi', '/housekeeping/tasks?tab=checklist'),
    sub('Kontrol Arşivi', '/housekeeping/tasks?tab=archive'),
  ],
  'kat:House Keeping Raporu': [
    sub('HK Durum Raporu', '/reports?category=kathizmetleri&report=status'),
    sub('Temiz Oda Listesi', '/reports?category=kathizmetleri&report=clean'),
    sub('Kirli Oda Listesi', '/reports?category=kathizmetleri&report=dirty'),
    sub('OOO Oda Listesi', '/reports?category=kathizmetleri&report=ooo'),
  ],
  'kat:Housekeeper Kontrol Listesi': [
    sub('Günlük Kontrol', '/housekeeping/tasks?tab=checklist'),
    sub('Görev Atama', '/housekeeping/assign'),
    sub('Mobil Görevler', '/housekeeping/mobile'),
  ],
  'kat:Oda Kontrol Arşiv Listesi': [
    sub('Arşiv Listesi', '/housekeeping/tasks?tab=archive'),
    sub('Oda Kontrolü', '/housekeeping/rooms?tab=control'),
  ],
  'kat:Enerji Tüketim Tablosu': [
    sub('Enerji Tablosu', '/reports?report=enerji'),
    sub('Demirbaş Listesi', '/reports?report=demirbas'),
    sub('HK Raporları', '/reports?category=kathizmetleri'),
  ],
  'kat:Oda Demirbaş Listesi': [
    sub('Demirbaş Listesi', '/reports?report=demirbas'),
    sub('Enerji Tablosu', '/reports?report=enerji'),
    sub('Arıza Listesi', '/housekeeping/faults'),
  ],
  'kat:Arıza ve Şikayet Listesi': [
    sub('Şikayetler', '/guest-relations/complaints'),
    sub('Arıza Kayıtları', '/housekeeping/faults'),
    sub('Takip Listesi', '/guest-relations/traces'),
  ],
  'kat:Takip Listesi (Traces)': [
    sub('Traces', '/guest-relations/traces'),
    sub('Misafir Notları', '/guest-relations/traces'),
    sub('Kayıp Bulunan', '/guest-relations/lost-found'),
  ],
  'kat:Kayıp ve Bulunan Listesi': [
    sub('Kayıp Bulunan', '/guest-relations/lost-found'),
    sub('Traces', '/guest-relations/traces'),
    sub('Şikayetler', '/guest-relations/complaints'),
  ],
  'misafir:Takip Listesi (Traces)': [
    sub('Trace Listesi', '/guest-relations/traces'),
    sub('Yeni Not', '/guest-relations/traces?action=new-note'),
    sub('Sarı Notlar', '/guest-relations/traces?type=yellow'),
    sub('Ajanda', '/guest-relations/traces?tab=agenda'),
    sub('Uyandırma', '/guest-relations/traces?type=wakeup'),
  ],
  'misafir:In House List': [
    sub('In House', '/guest-relations/inhouse'),
    sub('Info Rack', '/guest-relations/info-rack'),
    sub('VIP Listesi', '/guest-relations/vip'),
    sub('Resepsiyon In House', '/reception/inhouse'),
  ],
  'misafir:Info Rack (İsim Listesi)': [
    sub('Info Rack', '/guest-relations/info-rack'),
    sub('In House', '/guest-relations/inhouse'),
    sub('Misafir Profili', '/reception/guest-profile'),
  ],
  'misafir:Restoran Rezervasyon': [
    sub('Restoran Rez.', '/guest-relations/restaurant'),
    sub('Banket Rez.', '/fnb'),
    sub('Tenis Kort', '/guest-relations/tennis'),
  ],
  'misafir:Tenis Kort Rezervasyon': [
    sub('Tenis Kort', '/guest-relations/tennis'),
    sub('Restoran Rez.', '/guest-relations/restaurant'),
    sub('Günlük Aktivite', '/guest-relations/daily-activities'),
  ],
  'misafir:Günlük Aktivite Listesi': [
    sub('Günlük Aktivite', '/guest-relations/daily-activities'),
    sub('Misafir Aktivite', '/guest-relations/guest-activities'),
    sub('Hava Durumu', '/guest-relations/weather'),
  ],
  'misafir:Misafir Aktivite Listesi': [
    sub('Misafir Aktivite', '/guest-relations/guest-activities'),
    sub('Günlük Aktivite', '/guest-relations/daily-activities'),
    sub('GR Raporları', '/reports?category=crm'),
  ],
  'misafir:Günlük Hava Durumu': [
    sub('Bugün', '/guest-relations/weather'),
    sub('5 Günlük Tahmin', '/guest-relations/weather-forecast'),
  ],
  'misafir:5 Günlük Hava Tahmini': [
    sub('5 Günlük', '/guest-relations/weather-forecast'),
    sub('Bugün', '/guest-relations/weather'),
  ],
  'misafir:Arıza ve Şikayet Listesi': [
    sub('Şikayetler', '/guest-relations/complaints'),
    sub('Arıza Kayıtları', '/housekeeping/faults'),
    sub('Reklamasyon', '/guest-relations/reclamations'),
  ],
  'misafir:Kayıp ve Bulunan Listesi': [
    sub('Kayıp Buluntu', '/guest-relations/lost-found'),
    sub('Traces', '/guest-relations/traces'),
    sub('Şikayetler', '/guest-relations/complaints'),
  ],
  'misafir:Misafir Yorum Listesi': [
    sub('Yorum Listesi', '/guest-relations/reviews'),
    sub('Yorum Girişi', '/guest-relations/reviews/new'),
    sub('Reklamasyon', '/guest-relations/reclamations'),
  ],
  'misafir:Misafir Yorum Girişi': [
    sub('Yeni Yorum', '/guest-relations/reviews/new'),
    sub('Yorum Listesi', '/guest-relations/reviews'),
  ],
  'misafir:Reklamasyon': [
    sub('Reklamasyon Listesi', '/guest-relations/reclamations'),
    sub('Şikayetler', '/guest-relations/complaints'),
    sub('Yorumlar', '/guest-relations/reviews'),
  ],
  'misafir:VIP Misafir Listesi': [
    sub('VIP Listesi', '/guest-relations/vip'),
    sub('In House', '/guest-relations/inhouse'),
    sub('Tekrarlayan Misafir', '/guest-relations/repeat-guests'),
  ],
  'misafir:Tekrarlayan Misafirler': [
    sub('Tekrarlayan Misafir', '/guest-relations/repeat-guests'),
    sub('VIP Listesi', '/guest-relations/vip'),
    sub('GR Raporları', '/reports?category=crm'),
  ],
  'banket:Banket Rezervasyon': [
    sub('Rezervasyon Listesi', '/fnb'),
    sub('Yeni Etkinlik', '/fnb'),
    sub('Ajanda', '/fnb?tab=calendar'),
    sub('Anlaşmalar', '/fnb?tab=agreements'),
  ],
  'banket:Banket Anlaşmaları': [
    sub('Anlaşma Listesi', '/fnb?tab=agreements'),
    sub('Rezervasyonlar', '/fnb'),
    sub('Ajanda', '/fnb?tab=calendar'),
  ],
  'banket:Banket Ajanda': [
    sub('Takvim', '/fnb?tab=calendar'),
    sub('Rezervasyonlar', '/fnb'),
    sub('Salon Doluluk', '/reports?category=banket&report=occupancy'),
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
  'gunsonu:Gün Sonu Raporlarını Al': [
    sub('Rapor Paketi', '/reports?tab=eod&action=fetch'),
    sub('Gece Denetim İzi', '/reports?tab=eod&action=audit'),
    sub('Paket PDF', '/api/eod/night-audit-package?format=pdf'),
  ],
  'gunsonu:Günü Kapat': [
    sub('Ön Kontrol Listesi', '/reports?tab=eod&action=close'),
    sub('Oda Fiyatlarını İşle', '/reports?tab=eod&action=room-prices'),
    sub('Ek Fiyatları İşle', '/reports?tab=eod&action=extra-prices'),
  ],
  'gunsonu:Eski Gün Sonu Raporları': [
    sub('Arşiv Listesi', '/reports?tab=eod&action=archive'),
    sub('Günlük Maliye', '/reports?report=gunluk-maliye'),
    sub('Günlük Balans', '/reports?report=gunluk-balans'),
  ],
  'gunsonu:Yedek Al': [
    sub('Yedek Al', '/reports?tab=eod&action=backup'),
    sub('Google Yedek', '/settings/integrations/google-backup'),
  ],
  'gunsonu:Misafir Profil Kontrol': [
    sub('Profil Kontrol', '/reports?tab=eod&action=profile-check'),
    sub('Kimlik Listesi', '/reception?tab=kimlik'),
    sub('Yeni Kimlik Sistemi', '/reception?tab=kimlik-new'),
  ],
  'arkaburo:Acenta': fromTabs(KONTRAT_TABS),
  'arkaburo:Yeni Fatura': [
    sub('Yeni Fatura', '/accounting?tab=invoices&new=1'),
    sub('Proforma Oluştur', '/accounting?tab=proforma'),
    sub('Fatura Listesi', '/accounting?tab=invoices'),
  ],
  'arkaburo:Fatura Listesi': [
    sub('Tüm Faturalar', '/accounting?tab=invoices'),
    sub('Proforma Listesi', '/accounting?tab=proforma'),
    sub('Yeni Fatura', '/accounting?tab=invoices&new=1'),
  ],
  'arkaburo:Proforma Fatura Listesi': [
    sub('Proforma Listesi', '/accounting?tab=proforma'),
    sub('Fatura Listesi', '/accounting?tab=invoices'),
  ],
  'arkaburo:Cari Kartlar': [
    sub('Cari Kartlar', '/accounting?tab=cari'),
    sub('Cari Ödemeler', '/accounting?tab=cari-payments'),
    sub('Cari Defter', '/accounting?tab=ledger'),
    sub('Kredi Kontrol', '/reports?report=kredi-kontrol'),
  ],
  'arkaburo:Kasa - Banka Kartları': [
    sub('Kasa — Banka', '/accounting?tab=bank-cards'),
    sub('Ön Kasa', '/cashier'),
    sub('Günlük Maliye', '/reports?report=gunluk-maliye'),
  ],
  'arkaburo:Cari Ödemeler': [
    sub('Ödeme Girişi', '/accounting?tab=cari-payments'),
    sub('Cari Kartlar', '/accounting?tab=cari'),
    sub('Cari Defter', '/accounting?tab=ledger'),
  ],
  'arkaburo:Ürün Kartları': [
    sub('Stok Kartları', '/settings?section=inventory'),
    sub('Muhasebe Stok', '/accounting?tab=stock'),
    sub('Depo Tanımları', '/settings?section=warehouse'),
  ],
  'arkaburo:İndirim Tanımları (POS)': [
    sub('POS İndirimleri', '/fnb?tab=discounts'),
    sub('F&B Menü', '/fnb'),
    sub('Ekstra Tanımları', '/settings?section=extras'),
  ],
  'arkaburo:Yönetim Raporları': [
    sub('Yönetim Özeti', '/reports?tab=management'),
    sub('Departman Gelirleri', '/reports?report=distribution'),
    sub('Günlük Balanslar', '/reports?report=gunluk-balans'),
    sub('Kredi Kontrol', '/reports?report=kredi-kontrol'),
  ],
  'arkaburo:Kredi Kontrol Listesi': [
    sub('Kredi Kontrol', '/reports?report=kredi-kontrol'),
    sub('Cari Kartlar', '/accounting?tab=cari'),
    sub('Acenta Kontratları', '/settings?section=agencies'),
  ],
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
  'ayarlar:Şifre Değiştir': [
    sub('Şifre Değiştir', '/settings?tab=password'),
    sub('Kullanıcı Tanımları', '/settings?section=users'),
    sub('Grup Tanımları', '/settings?section=user-groups'),
  ],
  'ayarlar:Not Al Açık': [
    sub('Yeni Not', '/guest-relations/traces?action=new-note'),
    sub('Not Gör', '/guest-relations/traces?view=notes'),
    sub('Notları Göster/Gizle', '/guest-relations/traces?toggle=notes'),
    sub('Sarı Notlar', '/guest-relations/traces?type=yellow'),
    sub('Ajanda', '/guest-relations/traces?tab=agenda'),
  ],
  'ayarlar:Mesajlaşma': [
    sub('CRM Mesajları', '/guest-relations?tab=messages'),
    sub('WhatsApp', '/settings/integrations/whatsapp'),
    sub('Misafir Portal', '/settings/integrations/guest-portal'),
  ],
  'ayarlar:Log (Kayıt İzleme)': [
    sub('Audit Log', '/settings/privacy?tab=sql'),
    sub('KVKK Talepleri', '/settings/privacy'),
    sub('Gece Denetim İzi', '/reports?tab=eod&action=audit'),
  ],
  'ayarlar:Kapı Entegrasyonu': [
    sub('TESA Bağlantı', '/settings/integrations/tesa'),
    sub('Ek Modüller', '/settings/integrations/tesa?tab=modules'),
    sub('Kimlik Okuyucu', '/settings/integrations/id-reader'),
    sub('Kiosk', '/settings/integrations/kiosk'),
  ],
  'ayarlar:Lisanslama': [
    sub('Lisans Yönetimi', '/settings/licensing'),
    sub('Lisans Üret (satıcı)', '/tools/license'),
    sub('Production Deploy', '/tools/deploy'),
  ],
  'ayarlar:Sisteme Giriş': [
    sub('Ayarlar Hub', '/settings?hub=ayarlar'),
    sub('Kuruluş', '/settings'),
    sub('Entegrasyonlar', '/settings/integrations'),
  ],
};
