import { SIDEBAR_SUBMENU_BY_KEY, type SidebarSubItem } from './sidebar-submenus';

export type SidebarNavItem = {
  id: string;
  label: string;
  href?: string;
  icon: string;
  separator?: boolean;
  i18nKey?: string;
  children?: SidebarNavItem[];
};

export type SidebarNavSection = {
  id: string;
  title: string;
  items: SidebarNavItem[];
};

type RawItem = { label: string; href: string; separator?: boolean; i18nKey?: string };

type RawGroup = {
  id: string;
  title: string;
  defaultIcon: string;
  items: RawItem[];
};

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 56) || 'item'
  );
}

function subToNav(id: string, item: SidebarSubItem): SidebarNavItem {
  if (item.separator) return { id: `${id}-sep`, label: '', icon: 'minus', separator: true };
  const children = item.children?.map((c, i) => subToNav(`${id}-${i}`, c));
  return {
    id,
    label: item.label,
    href: children?.length ? undefined : item.href,
    icon: children?.length ? 'folder' : 'file-text',
    i18nKey: item.i18nKey,
    children,
  };
}

function attachSubmenus(items: SidebarNavItem[], groupId: string): SidebarNavItem[] {
  return items.map((item) => {
    const key = `${groupId}:${item.label}`;
    const raw = SIDEBAR_SUBMENU_BY_KEY[key];
    if (!raw?.length) return item;
    return {
      ...item,
      href: undefined,
      icon: 'folder',
      children: raw.map((r, i) => subToNav(`${item.id}-sub-${i}`, r)),
    };
  });
}

function rawToNav(group: RawGroup, item: RawItem, index: number): SidebarNavItem {
  if (item.separator) {
    return { id: `${group.id}-sep-${index}`, label: '', icon: 'minus', separator: true };
  }
  return {
    id: `${group.id}-${slug(item.label)}`,
    label: item.label,
    href: item.href,
    icon: group.defaultIcon,
    i18nKey: item.i18nKey,
  };
}

function buildSection(group: RawGroup): SidebarNavSection {
  const items = group.items.map((item, i) => rawToNav(group, item, i));
  return {
    id: group.id,
    title: group.title,
    items: attachSubmenus(items, group.id),
  };
}

const RAW_GROUPS: RawGroup[] = [
  {
    id: 'panel',
    title: 'PANEL',
    defaultIcon: 'home',
    items: [
      { label: 'Ana Sayfa', href: '/', i18nKey: 'nav.home' },
      { label: 'Oda Rack', href: '/rooms', i18nKey: 'sidebar.item.roomRack' },
      { label: 'Günlük Oda Durumu', href: '/', i18nKey: 'sidebar.item.dailyRoomStatus' },
    ],
  },
  {
    id: 'sistem',
    title: 'SİSTEM',
    defaultIcon: 'settings',
    items: [
      { label: 'Kuruluş', href: '/settings', i18nKey: 'nav.settings.sideTitle' },
      { label: 'Rapor Tasarım', href: '/reports?tab=design', i18nKey: 'sidebar.sistem.reportDesign' },
      { label: 'Raporla', href: '/reports', i18nKey: 'sidebar.sistem.reports' },
      { label: 'Kullanıcı Tanımlı Raporlar', href: '/reports?tab=user', i18nKey: 'sidebar.sistem.userReports' },
      { label: '', href: '#', separator: true },
      { label: 'Servis Programları', href: '/settings/integrations', i18nKey: 'sidebar.sistem.servicePrograms' },
      { label: '5651 Hotspot Loglama', href: '/settings/compliance/5651', i18nKey: 'sidebar.sistem.hotspot5651' },
      { label: 'TESA Kapı Kartı', href: '/settings/integrations/tesa', i18nKey: 'sidebar.sistem.tesa' },
      { label: 'Dil Tanımları', href: '/settings?section=language', i18nKey: 'nav.kurulus.language' },
      { label: 'Form Tasarım Listesi', href: '/reports?tab=forms' },
      { label: '', href: '#', separator: true },
      { label: 'SQL Mesaj', href: '/settings/privacy?tab=sql' },
    ],
  },
  {
    id: 'rezervasyon',
    title: 'REZERVASYON',
    defaultIcon: 'calendar',
    items: [
      { label: 'Grafikler (F1)', href: '/reservations/calendar' },
      { label: 'Yeni Rezervasyon Kaydı', href: '/reservations/new', i18nKey: 'sidebar.item.newReservation' },
      { label: 'Rezervasyon Listesi', href: '/reservations', i18nKey: 'sidebar.item.reservationList' },
      { label: 'Toplu Rezervasyon', href: '/groups' },
      { label: 'Rez. Durum Takip Listesi', href: '/reservations?track=1' },
      { label: '', href: '#', separator: true },
      { label: 'Konaklayanlar Listesi', href: '/reception/inhouse', i18nKey: 'sidebar.item.inhouseList' },
      { label: 'Ayrılanlar Listesi', href: '/reservations?status=CHECKED_OUT' },
      { label: 'Bekleme Listesi', href: '/reservations?status=OPTION' },
      { label: 'İptal Listesi', href: '/reservations?status=CANCELLED' },
      { label: 'No Show Listesi', href: '/reservations?status=NO_SHOW' },
      { label: '', href: '#', separator: true },
      { label: 'Acenta Rezervasyon Aktarım', href: '/reservations?tab=import' },
      { label: 'Acenta Rezervasyon Aktarım (text)', href: '/reservations?tab=import-text' },
      { label: 'Mailden Rezervasyon Oku', href: '/reservations?tab=email' },
      { label: '', href: '#', separator: true },
      { label: 'Hızlı Blokaj', href: '/rooms?tab=blocking' },
      { label: 'Boş Oda Listesi', href: '/reception/vacant', i18nKey: 'sidebar.item.vacantList' },
      { label: 'Takip Listesi (Traces)', href: '/guest-relations/traces', i18nKey: 'sidebar.item.traces' },
      { label: 'Transfer Bilgileri', href: '/reports?report=transfer' },
      { label: 'Grup Kod Listesi', href: '/reservations?tab=group-codes' },
      { label: '', href: '#', separator: true },
      { label: 'Servis', href: '/guest-relations' },
    ],
  },
  {
    id: 'resepsiyon',
    title: 'RESEPSİYON',
    defaultIcon: 'wallet',
    items: [
      { label: 'Konaklayanlar Listesi', href: '/reception/inhouse', i18nKey: 'sidebar.item.inhouseList' },
      { label: 'Boş Oda Listesi', href: '/reception/vacant', i18nKey: 'sidebar.item.vacantList' },
      { label: 'Share Oda Oluşturma', href: '/reception/inhouse?action=share' },
      { label: 'Günlük Oda Durumu', href: '/' },
      { label: 'Oda Müsaitlik Durumu', href: '/reservations?tab=availability' },
      { label: 'Oda Müsaitlik Durumu (Fiyatlı)', href: '/reservations?tab=availability&prices=1' },
      { label: 'Planlanan Oda Değişimleri', href: '/reception/inhouse?tab=room-changes', i18nKey: 'sidebar.item.plannedRoomChanges' },
      { label: 'Oda Değişim Listesi', href: '/reports?report=room-changes' },
      { label: 'Ayrılış Tarihi Değişim Tablosu', href: '/reports?report=departure-change' },
      { label: 'Geliş Tarihi Değişim Tablosu', href: '/reports?report=arrival-change' },
      { label: '', href: '#', separator: true },
      { label: 'Info Rack (İsim Listesi)', href: '/guest-relations/info-rack' },
      { label: 'Hızlı POS Kart Hazırlama', href: '/fnb?mode=card-prep' },
      { label: 'Hızlı POS', href: '/fnb?mode=quick' },
      { label: 'Günlük Kart Ver', href: '/reception/inhouse?tab=daily-card' },
      { label: '', href: '#', separator: true },
      { label: 'Online CRM Mesajları', href: '/guest-relations?tab=messages' },
      { label: 'Takip Listesi (Traces)', href: '/guest-relations/traces', i18nKey: 'sidebar.item.traces' },
      { label: 'Kayıp ve Bulunan Listesi', href: '/guest-relations/lost-found', i18nKey: 'sidebar.item.lostFound' },
      { label: 'Arıza ve Şikayet Takip Listesi', href: '/guest-relations/complaints' },
      { label: 'Yeni Arıza ve Şikayet Kaydı', href: '/guest-relations/complaints?new=1' },
      { label: 'Reklamasyon', href: '/guest-relations/reclamations' },
      { label: 'Ajanda', href: '/guest-relations/traces?tab=agenda' },
      { label: '', href: '#', separator: true },
      { label: 'Uyandırma Listesi', href: '/guest-relations/traces?type=wakeup' },
      { label: 'Günlük Polis Kimlik Bildirim Listesi', href: '/reception?tab=kimlik' },
      { label: 'Yeni Kimlik Bildirim Sistemi', href: '/reception?tab=kimlik-new' },
    ],
  },
  {
    id: 'onkasa',
    title: 'ÖN KASA',
    defaultIcon: 'banknote',
    items: [
      { label: 'Kasa Defterleri', href: '/reception', i18nKey: 'sidebar.item.cashLedgers' },
      { label: 'Kasa Kapatma Listesi', href: '/reception?tab=kasa-close' },
      { label: 'Günlük Oda Tahsilat Listesi', href: '/reception/arrivals?tab=collections' },
      { label: 'Döviz Bozdurma Listesi', href: '/reception/departures?tab=fx' },
      { label: 'Kasa Avans ve Devir Listesi', href: '/reception?tab=advance' },
      { label: '', href: '#', separator: true },
      { label: 'Toplu İşlem Girişi', href: '/reception/inhouse?tab=bulk' },
      { label: 'Peşin Satış İşlemi', href: '/reception/arrivals?tab=cash-sale' },
      { label: '', href: '#', separator: true },
      { label: 'Depozit İşlemleri', href: '/reception/vacant?tab=deposit' },
      { label: 'Günlük Kur Girişi', href: '/reception/departures?tab=rates' },
      { label: 'Günlük Maliye Listesi', href: '/reports?report=gunluk-maliye' },
      { label: 'Yazarkasa Kontrol Paneli', href: '/accounting?tab=fiscal' },
    ],
  },
  {
    id: 'kat',
    title: 'KAT HİZMETLERİ',
    defaultIcon: 'bed-double',
    items: [
      { label: 'Oda Listesi', href: '/housekeeping/rooms', i18nKey: 'sidebar.item.roomList' },
      { label: 'Blokaj Tablosu', href: '/rooms?tab=blocking' },
      { label: 'Boş Oda Listesi', href: '/reception/vacant', i18nKey: 'sidebar.item.vacantList' },
      { label: 'Room Rack', href: '/rooms', i18nKey: 'sidebar.item.roomRack' },
      { label: 'Yeni Room Rack', href: '/rooms?view=new-rack' },
      { label: 'Günlük Oda Durumu', href: '/' },
      { label: 'KAPALI Oda Listesi', href: '/rooms?filter=closed' },
      { label: 'Takip Listesi (Traces)', href: '/guest-relations/traces', i18nKey: 'sidebar.item.traces' },
      { label: 'Kayıp ve Bulunan Listesi', href: '/guest-relations/lost-found', i18nKey: 'sidebar.item.lostFound' },
      { label: '', href: '#', separator: true },
      { label: 'House Keeping Oda İşlemleri', href: '/housekeeping?tab=operations', i18nKey: 'sidebar.item.hkOperations' },
      { label: 'House Keeping Oda Kontrolü', href: '/housekeeping/rooms?tab=control', i18nKey: 'sidebar.item.hkRoomControl' },
      { label: 'House Keeping Raporu', href: '/reports?category=kathizmetleri' },
      { label: 'Housekeeper Kontrol Listesi', href: '/housekeeping/tasks?tab=checklist' },
      { label: 'Oda Kontrol Arşiv Listesi', href: '/housekeeping/tasks?tab=archive' },
      { label: '', href: '#', separator: true },
      { label: 'Enerji Tüketim Tablosu', href: '/reports?report=enerji' },
      { label: 'Oda Demirbaş Listesi', href: '/reports?report=demirbas' },
      { label: 'Arıza ve Şikayet Listesi', href: '/guest-relations/complaints', i18nKey: 'sidebar.item.complaints' },
    ],
  },
  {
    id: 'misafir',
    title: 'MİSAFİR İLİŞKİLERİ',
    defaultIcon: 'heart',
    items: [
      { label: 'Takip Listesi (Traces)', href: '/guest-relations/traces', i18nKey: 'sidebar.item.traces' },
      { label: 'In House List', href: '/guest-relations/inhouse', i18nKey: 'sidebar.item.inhouseList' },
      { label: 'Info Rack (İsim Listesi)', href: '/guest-relations/info-rack', i18nKey: 'sidebar.item.infoRack' },
      { label: 'Restoran Rezervasyon', href: '/guest-relations/restaurant' },
      { label: 'Tenis Kort Rezervasyon', href: '/guest-relations/tennis' },
      { label: 'Günlük Aktivite Listesi', href: '/guest-relations/daily-activities' },
      { label: 'Misafir Aktivite Listesi', href: '/guest-relations/guest-activities' },
      { label: 'Günlük Hava Durumu', href: '/guest-relations/weather' },
      { label: '5 Günlük Hava Tahmini', href: '/guest-relations/weather-forecast' },
      { label: '', href: '#', separator: true },
      { label: 'Arıza ve Şikayet Listesi', href: '/guest-relations/complaints', i18nKey: 'sidebar.item.complaints' },
      { label: 'Kayıp ve Bulunan Listesi', href: '/guest-relations/lost-found', i18nKey: 'sidebar.item.lostFound' },
      { label: 'Misafir Yorum Listesi', href: '/guest-relations/reviews' },
      { label: 'Misafir Yorum Girişi', href: '/guest-relations/reviews/new' },
      { label: 'Reklamasyon', href: '/guest-relations/reclamations' },
    ],
  },
  {
    id: 'banket',
    title: 'BANKET',
    defaultIcon: 'utensils',
    items: [
      { label: 'Banket Rezervasyon', href: '/fnb', i18nKey: 'sidebar.item.banquetReservation' },
      { label: 'Banket Anlaşmaları', href: '/fnb?tab=agreements' },
      { label: 'Banket Ajanda', href: '/fnb?tab=calendar' },
      { label: 'Banket İlk Tanımlar', href: '/fnb?tab=definitions' },
      { label: 'Raporlar', href: '/fnb?tab=reports' },
    ],
  },
  {
    id: 'arkaburo',
    title: 'ARKA BÜRO',
    defaultIcon: 'building',
    items: [
      { label: 'Yeni Fatura', href: '/accounting?tab=invoice&new=1', i18nKey: 'sidebar.item.newInvoice' },
      { label: 'Fatura Listesi', href: '/accounting?tab=invoice', i18nKey: 'sidebar.item.invoiceList' },
      { label: 'Proforma Fatura Listesi', href: '/accounting?tab=proforma' },
      { label: 'Acenta', href: '/settings?section=agencies' },
      { label: 'Fiyat Kodları (Rate Code)', href: '/settings?section=rate-plans' },
      { label: 'Misafir', href: '/guest-relations/repeat-guests' },
      { label: 'Cari Kartlar', href: '/accounting?tab=cari', i18nKey: 'sidebar.item.ledgerCards' },
      { label: 'Kasa - Banka Kartları', href: '/accounting?tab=bank-cards' },
      { label: 'Cari Ödemeler', href: '/accounting?tab=cari-payments' },
      { label: 'Ek Modüller', href: '/settings/integrations/tesa?tab=modules' },
      { label: 'İndirim Tanımları (POS)', href: '/fnb?tab=discounts' },
      { label: 'Ürün Kartları', href: '/settings?section=inventory' },
      { label: 'Yönetim Raporları', href: '/reports?tab=management', i18nKey: 'sidebar.item.managementReports' },
      { label: 'Yönetim Raporu Hazırlama', href: '/reports?tab=prepare' },
      { label: 'Bütçe Girişleri', href: '/accounting?tab=budget' },
      { label: 'Eski Tarihli Departman Gelirleri', href: '/reports?report=dept-revenue-old' },
      { label: 'Günlük Balanslar', href: '/reports?report=gunluk-balans' },
      { label: 'Departman Gelir Analizleri', href: '/reports?report=distribution' },
      { label: 'Eski Tarihli Günlük Yönetim Raporu', href: '/reports?report=mgmt-old' },
      { label: 'Kredi Kontrol Listesi', href: '/reports?report=kredi-kontrol' },
      { label: 'Otel Bütçe Değer', href: '/accounting?tab=budget-values' },
      { label: 'Günlük Maliye Listesi', href: '/reports?report=gunluk-maliye' },
      { label: 'Departman Gelirleri Aktarım', href: '/reports?report=dept-transfer' },
    ],
  },
  {
    id: 'gunsonu',
    title: 'GÜN SONU',
    defaultIcon: 'clock',
    items: [
      { label: 'Gün Sonu Raporlarını Al', href: '/reports?tab=eod&action=fetch', i18nKey: 'sidebar.item.eodFetch' },
      { label: 'Günü Kapat', href: '/reports?tab=eod&action=close', i18nKey: 'sidebar.item.eodClose' },
      { label: 'Eski Gün Sonu Raporları', href: '/reports?tab=eod&action=archive' },
      { label: '', href: '#', separator: true },
      { label: 'Yedek Al', href: '/reports?tab=eod&action=backup' },
      { label: '', href: '#', separator: true },
      { label: 'Oda Fiyatlarını İşle', href: '/reports?tab=eod&action=room-prices' },
      { label: 'Ek Fiyatları Bas', href: '/reports?tab=eod&action=extra-prices' },
      { label: 'Günlük Maliye Listesi', href: '/reports?report=gunluk-maliye' },
      { label: 'Misafir Profil Kontrol', href: '/reports?tab=eod&action=profile-check' },
      { label: 'Günlük Polis Kimlik Bildirim Listesi', href: '/reception?tab=kimlik' },
      { label: 'Yeni Kimlik Bildirim Sistemi', href: '/reception?tab=kimlik-new' },
    ],
  },
  {
    id: 'raporlar',
    title: 'RAPORLAR',
    defaultIcon: 'bar-chart',
    items: [
      { label: 'Raporlama Programı', href: '/reports', i18nKey: 'sidebar.sistem.reports' },
      { label: 'Kullanıcı Tanımlı Raporlar', href: '/reports?tab=user' },
      { label: 'Özel Raporlar', href: '/reports?tab=special' },
      { label: 'Uzak Otelden Raporlama', href: '/reports?tab=remote' },
      { label: 'Konsolide Tesis Raporu', href: '/reports?tab=consolidated', i18nKey: 'reports.tab.consolidated' },
      { label: '', href: '#', separator: true },
      { label: 'EGM Kimlik Raporları', href: '/reports?category=egm', i18nKey: 'sidebar.item.egmReports' },
      { label: 'TIS Turizm İstatistik', href: '/reports?category=tis', i18nKey: 'sidebar.item.tisReports' },
      { label: 'TGA Segment & Kanal', href: '/reports?category=tga', i18nKey: 'sidebar.item.tgaReports' },
      { label: '', href: '#', separator: true },
      { label: 'FC-Forecast Raporları', href: '/reports?category=forecast' },
      { label: 'FO-Önbüro Raporları', href: '/reports?category=rezervasyon', i18nKey: 'sidebar.item.foReports' },
      { label: 'DL-Günlük Raporlar (InHouse Lists)', href: '/reports?category=gunluk' },
      { label: 'HK-HouseKeeping Raporları', href: '/reports?category=kathizmetleri', i18nKey: 'sidebar.item.hkReports' },
      { label: 'DR-Günlük Gelir Raporları', href: '/reports?category=gelir' },
      { label: 'CS-Kasa Raporları', href: '/reports?category=kontrol' },
      { label: 'IN-Fatura Raporları', href: '/reports?category=muhasebe' },
      { label: 'MG-Muhasebe Gelir Raporları', href: '/reports?category=gelir' },
      { label: 'BO-ArkaBüro Raporları', href: '/reports?category=yonetim' },
      { label: 'AG-Acenta Raporları', href: '/reports?category=acenta' },
      { label: 'GS-Misafir Raporları', href: '/reports?category=crm' },
      { label: 'GR-Halkla İlişkiler', href: '/reports?category=gr' },
      { label: 'AC-Hesap Raporları', href: '/reports?category=muhasebe' },
      { label: 'MR-Yönetim Raporları', href: '/reports?category=yonetim' },
      { label: 'Sürekli Misafir Listesi (Repeater Report)', href: '/guest-relations/repeat-guests' },
      { label: 'Sürekli Misafir Listesi (Fr3)', href: '/guest-relations/repeat-guests?format=fr3' },
      { label: 'Yönetim Raporu (Eng)', href: '/reports?report=mgmt-eng' },
      { label: 'Acenta Analiz (Gün, Ay, Yıl)', href: '/reports?report=acenta-analiz' },
      { label: 'Market Rate Analiz (Gün, Ay, Yıl)', href: '/reports?report=market-rate' },
    ],
  },
  {
    id: 'ayarlar',
    title: 'AYARLAR',
    defaultIcon: 'settings',
    items: [
      { label: 'Sisteme Giriş', href: '/settings', i18nKey: 'sidebar.item.login' },
      { label: 'Sistemden Çıkış', href: '/settings?action=logout' },
      { label: 'Şifre Değiştir', href: '/settings?tab=password' },
      { label: 'Tema Seç', href: '/settings?tab=theme' },
      { label: 'Tema Sabitle', href: '/settings?tab=theme&fixed=1' },
      { label: 'Not Al Açık', href: '/guest-relations/traces?action=new-note' },
      { label: 'Notları Göster/Gizle', href: '/guest-relations/traces?toggle=notes' },
      { label: 'Sarı Notlar', href: '/guest-relations/traces?type=yellow' },
      { label: 'Not Gör', href: '/guest-relations/traces?view=notes' },
      { label: 'İş Takip Listesi', href: '/housekeeping/tasks' },
      { label: 'Mesajlaşma', href: '/guest-relations?tab=messages' },
      { label: 'Hesap Makinesi', href: '/settings?tool=calculator' },
      { label: 'Santral', href: '/settings/integrations/pbx' },
      { label: 'Adres ve Tel Rehberi', href: '/guest-relations?tab=directory' },
      { label: 'Log (Kayıt İzleme)', href: '/settings/privacy' },
      { label: 'KVKK & Gizlilik', href: '/settings/privacy', i18nKey: 'sidebar.item.privacy' },
      { label: 'Lisanslama', href: '/settings/licensing', i18nKey: 'sidebar.item.licensing' },
      { label: 'Kapı Entegrasyonu', href: '/settings/integrations/tesa', i18nKey: 'sidebar.item.doorIntegration' },
      { label: 'Çıkış', href: '/settings?action=exit' },
    ],
  },
];

/** Mockup uyumlu menü — tüm modüller ve ▶ alt menüler */
export const SIDEBAR_NAV: SidebarNavSection[] = RAW_GROUPS.map(buildSection);

export function flattenSidebarLinks(sections = SIDEBAR_NAV): { label: string; href: string; i18nKey?: string; prefixKey?: string }[] {
  const out: { label: string; href: string; i18nKey?: string; prefixKey?: string }[] = [];
  function walk(items: SidebarNavItem[], prefix = '', prefixKey?: string) {
    for (const item of items) {
      if (item.separator) continue;
      const label = prefix ? `${prefix} › ${item.label}` : item.label;
      if (item.href) {
        out.push({
          label,
          href: item.href,
          i18nKey: item.i18nKey,
          prefixKey,
        });
      }
      if (item.children) walk(item.children, label, prefixKey);
    }
  }
  for (const section of sections) {
    const sectionKey = `sidebar.section.${section.id}`;
    walk(section.items, section.title, sectionKey);
  }
  return out;
}

export function collectActiveNavIds(items: SidebarNavItem[], pathname: string, chain: string[] = []): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.separator) continue;
    const nextChain = [...chain, item.id];
    if (navItemActive(pathname, item)) ids.push(...nextChain);
    if (item.children?.length) {
      ids.push(...collectActiveNavIds(item.children, pathname, nextChain));
    }
  }
  return ids;
}

export function navItemActive(pathname: string, item: SidebarNavItem): boolean {
  if (item.href) {
    const base = item.href.split('?')[0];
    if (base === '/') return pathname === '/';
    if (pathname === base || pathname.startsWith(`${base}/`)) return true;
  }
  return item.children?.some((c) => navItemActive(pathname, c)) ?? false;
}

export function activeSectionOpenIds(pathname: string, sections = SIDEBAR_NAV): string[] {
  const ids = new Set<string>();
  for (const section of sections) {
    for (const id of collectActiveNavIds(section.items, pathname)) ids.add(id);
  }
  return [...ids];
}

export function activeSidebarSectionId(pathname: string, sections = SIDEBAR_NAV): string {
  for (const section of sections) {
    if (section.items.some((item) => navItemActive(pathname, item))) return section.id;
  }
  return 'panel';
}

export const SIDEBAR_RAIL_LABELS: Record<string, string> = {
  panel: 'Ana',
  sistem: 'Sistem',
  rezervasyon: 'Rezerv.',
  resepsiyon: 'Resep.',
  onkasa: 'Kasa',
  kat: 'Kat HK',
  misafir: 'GR',
  banket: 'Banket',
  arkaburo: 'Arka',
  gunsonu: 'G. Sonu',
  raporlar: 'Rapor',
  ayarlar: 'Ayar',
};

export const SIDEBAR_SHORTCUTS = [
  { key: 'F1', label: 'Grafikler', href: '/reservations/calendar' },
  { key: 'F2', label: 'Yeni Rez.', href: '/reservations/new' },
  { key: 'F12', label: 'Oda Rack', href: '/rooms' },
  { key: 'F6', label: 'Ön Kasa', href: '/reception' },
  { key: 'F8', label: 'HK Oda', href: '/housekeeping/rooms' },
] as const;
