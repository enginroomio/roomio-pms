/** Rapor tasarım — tüm departman alan kataloğu ve hazır şablonlar */

import { EOD_LEGACY_FIELD_DEFS } from './eod-legacy-fields';
import { buildEodLegacyStarters } from './eod-legacy-wizard';

export type ReportFieldDef = {
  key: string;
  label: string;
  sample: string;
  group?: string;
};

export type ReportStarter = {
  id: string;
  name: string;
  description: string;
  columns: string[];
  /** Elektra GR kodu (örn. GR101) */
  reportCode?: string;
  /** Gün sonu kategori düğmesi veya modül grubu */
  group?: string;
};

export type ReportModuleDef = {
  id: string;
  label: string;
  emoji: string;
  hint: string;
  defaultColumns: string[];
  fields: ReportFieldDef[];
  starters: ReportStarter[];
};

function mod(
  id: string,
  label: string,
  emoji: string,
  hint: string,
  defaultColumns: string[],
  fields: ReportFieldDef[],
  starters: ReportStarter[],
): ReportModuleDef {
  return { id, label, emoji, hint, defaultColumns, fields, starters };
}

export const REPORT_MODULES: ReportModuleDef[] = [
  mod('rez', 'Rezervasyon', '📅', 'Rezervasyon kayıtları, doluluk ve acenta listeleri',
    ['refNo', 'guestName', 'checkIn', 'checkOut', 'status'],
    [
      { key: 'refNo', label: 'Rezervasyon no', sample: 'RSV-2026-0142', group: 'Rezervasyon' },
      { key: 'guestName', label: 'Misafir adı', sample: 'Ayşe Yılmaz', group: 'Misafir' },
      { key: 'checkIn', label: 'Giriş tarihi', sample: '18.06.2026', group: 'Tarih' },
      { key: 'checkOut', label: 'Çıkış tarihi', sample: '22.06.2026', group: 'Tarih' },
      { key: 'nights', label: 'Gece sayısı', sample: '4', group: 'Tarih' },
      { key: 'roomType', label: 'Oda tipi', sample: 'DBL', group: 'Oda' },
      { key: 'roomNo', label: 'Oda numarası', sample: '312', group: 'Oda' },
      { key: 'adults', label: 'Yetişkin', sample: '2', group: 'Misafir' },
      { key: 'children', label: 'Çocuk', sample: '0', group: 'Misafir' },
      { key: 'mealPlan', label: 'Pansiyon', sample: 'Kahvaltı dahil', group: 'Oda' },
      { key: 'rate', label: 'Günlük fiyat', sample: '₺5.200', group: 'Finans' },
      { key: 'totalAmount', label: 'Toplam tutar', sample: '₺20.800', group: 'Finans' },
      { key: 'agency', label: 'Acenta / kanal', sample: 'Booking.com', group: 'Satış' },
      { key: 'market', label: 'Market kodu', sample: 'OTA', group: 'Satış' },
      { key: 'status', label: 'Durum', sample: 'Onaylı', group: 'Rezervasyon' },
      { key: 'phone', label: 'Telefon', sample: '+90 532 …', group: 'Misafir' },
      { key: 'email', label: 'E-posta', sample: 'misafir@…', group: 'Misafir' },
      { key: 'notes', label: 'Not', sample: 'Geç giriş', group: 'Rezervasyon' },
    ],
    [
      { id: 'rez-daily', name: 'Günlük rezervasyon özeti', description: 'Bugünkü giriş-çıkış ve durum', columns: ['refNo', 'guestName', 'checkIn', 'checkOut', 'roomType', 'status'] },
      { id: 'rez-agency', name: 'Acenta bazlı liste', description: 'Kanal ve fiyat karşılaştırması', columns: ['agency', 'guestName', 'checkIn', 'rate', 'totalAmount'] },
      { id: 'rez-arrival', name: 'Yarınki varışlar', description: 'Hazırlık için varış listesi', columns: ['guestName', 'checkIn', 'roomType', 'adults', 'mealPlan', 'phone'] },
    ],
  ),
  mod('rec', 'Resepsiyon', '🛎️', 'Giriş-çıkış, konaklayanlar ve günlük operasyon',
    ['roomNo', 'guestName', 'checkIn', 'checkOut', 'status'],
    [
      { key: 'roomNo', label: 'Oda', sample: '312', group: 'Oda' },
      { key: 'guestName', label: 'Misafir', sample: 'Ayşe Yılmaz', group: 'Misafir' },
      { key: 'checkIn', label: 'Giriş', sample: '18.06.2026 14:00', group: 'Tarih' },
      { key: 'checkOut', label: 'Çıkış', sample: '22.06.2026 12:00', group: 'Tarih' },
      { key: 'status', label: 'Durum', sample: 'Konaklıyor', group: 'Operasyon' },
      { key: 'roomType', label: 'Oda tipi', sample: 'DBL', group: 'Oda' },
      { key: 'adults', label: 'Yetişkin', sample: '2', group: 'Misafir' },
      { key: 'children', label: 'Çocuk', sample: '0', group: 'Misafir' },
      { key: 'nationality', label: 'Uyruk', sample: 'TR', group: 'Misafir' },
      { key: 'idNo', label: 'Kimlik / pasaport', sample: '123…', group: 'Misafir' },
      { key: 'balance', label: 'Folio bakiyesi', sample: '₺1.250', group: 'Finans' },
      { key: 'vip', label: 'VIP seviye', sample: 'Gold', group: 'Misafir' },
      { key: 'arrivalTime', label: 'Varış saati', sample: '15:30', group: 'Operasyon' },
      { key: 'departureTime', label: 'Ayrılış saati', sample: '11:00', group: 'Operasyon' },
      { key: 'notes', label: 'Resepsiyon notu', sample: 'Late C/O', group: 'Operasyon' },
    ],
    [
      { id: 'rec-inhouse', name: 'Konaklayanlar listesi', description: 'Şu an oteldeki misafirler', columns: ['roomNo', 'guestName', 'checkIn', 'checkOut', 'adults', 'balance'] },
      { id: 'rec-arrival', name: 'Bugün giriş yapacaklar', description: 'Check-in hazırlık listesi', columns: ['guestName', 'roomType', 'checkIn', 'arrivalTime', 'phone', 'notes'] },
      { id: 'rec-departure', name: 'Bugün ayrılacaklar', description: 'Check-out ve tahsilat', columns: ['roomNo', 'guestName', 'checkOut', 'departureTime', 'balance'] },
    ],
  ),
  mod('fo', 'Önbüro', '🏨', 'Önbüro günlük durum ve doluluk raporları',
    ['refNo', 'guestName', 'checkIn', 'checkOut', 'status'],
    [
      { key: 'refNo', label: 'Rez. no', sample: 'RSV-0142', group: 'Rezervasyon' },
      { key: 'guestName', label: 'Misafir', sample: 'Ayşe Yılmaz', group: 'Misafir' },
      { key: 'checkIn', label: 'Giriş', sample: '18.06.2026', group: 'Tarih' },
      { key: 'checkOut', label: 'Çıkış', sample: '22.06.2026', group: 'Tarih' },
      { key: 'roomType', label: 'Oda tipi', sample: 'DBL', group: 'Oda' },
      { key: 'roomNo', label: 'Oda no', sample: '312', group: 'Oda' },
      { key: 'status', label: 'Durum', sample: 'Konaklıyor', group: 'Operasyon' },
      { key: 'occupancy', label: 'Doluluk %', sample: '72', group: 'İstatistik' },
      { key: 'arrivals', label: 'Varış sayısı', sample: '12', group: 'İstatistik' },
      { key: 'departures', label: 'Ayrılış sayısı', sample: '9', group: 'İstatistik' },
      { key: 'agency', label: 'Acenta', sample: 'Booking.com', group: 'Satış' },
    ],
    [
      { id: 'fo-daily', name: 'FO günlük durum', description: 'Klasik önbüro özet raporu', columns: ['refNo', 'guestName', 'checkIn', 'checkOut', 'roomNo', 'status'] },
      { id: 'fo-occ', name: 'Doluluk özeti', description: 'Günlük doluluk ve hareket', columns: ['occupancy', 'arrivals', 'departures', 'status'] },
    ],
  ),
  mod('hk', 'Kat Hizmetleri', '🧹', 'Oda durumu, temizlik ve görev listeleri',
    ['roomNo', 'floor', 'hkStatus', 'guestName'],
    [
      { key: 'roomNo', label: 'Oda', sample: '312', group: 'Oda' },
      { key: 'floor', label: 'Kat', sample: '3', group: 'Oda' },
      { key: 'roomType', label: 'Oda tipi', sample: 'DBL', group: 'Oda' },
      { key: 'hkStatus', label: 'Temizlik durumu', sample: 'Temiz', group: 'HK' },
      { key: 'status', label: 'Oda durumu', sample: 'Dolu', group: 'Oda' },
      { key: 'guestName', label: 'Misafir', sample: 'Ayşe Yılmaz', group: 'Misafir' },
      { key: 'checkOut', label: 'Çıkış tarihi', sample: '22.06.2026', group: 'Tarih' },
      { key: 'task', label: 'Görev', sample: 'Checkout temizlik', group: 'HK' },
      { key: 'assignedTo', label: 'Katkıcı', sample: 'Elif K.', group: 'HK' },
      { key: 'priority', label: 'Öncelik', sample: 'Yüksek', group: 'HK' },
      { key: 'minibar', label: 'Minibar', sample: 'Kontrol', group: 'HK' },
      { key: 'notes', label: 'Not', sample: 'Extra yastık', group: 'HK' },
    ],
    [
      { id: 'hk-room', name: 'Oda durum raporu', description: 'Tüm odaların HK durumu', columns: ['roomNo', 'floor', 'hkStatus', 'status', 'guestName'] },
      { id: 'hk-task', name: 'Günlük görev listesi', description: 'Katkıcı bazlı iş dağılımı', columns: ['roomNo', 'task', 'assignedTo', 'priority', 'hkStatus'] },
      { id: 'hk-checkout', name: 'Çıkış odaları', description: 'Bugün temizlenecek odalar', columns: ['roomNo', 'checkOut', 'hkStatus', 'assignedTo'] },
    ],
  ),
  mod('cs', 'Ön Kasa', '💰', 'Kasa hareketleri, tahsilat ve döviz işlemleri',
    ['time', 'guest', 'amount', 'type'],
    [
      { key: 'time', label: 'Saat', sample: '14:32', group: 'İşlem' },
      { key: 'register', label: 'Kasa adı', sample: 'Ana Kasa', group: 'İşlem' },
      { key: 'guest', label: 'Misafir', sample: 'Ayşe Yılmaz', group: 'Misafir' },
      { key: 'roomNo', label: 'Oda', sample: '312', group: 'Oda' },
      { key: 'amount', label: 'Tutar', sample: '₺350', group: 'Finans' },
      { key: 'currency', label: 'Para birimi', sample: 'TRY', group: 'Finans' },
      { key: 'type', label: 'İşlem tipi', sample: 'Tahsilat', group: 'İşlem' },
      { key: 'paymentMethod', label: 'Ödeme şekli', sample: 'Kredi kartı', group: 'Finans' },
      { key: 'ref', label: 'Fiş / fatura no', sample: 'FTR-0892', group: 'İşlem' },
      { key: 'user', label: 'Kasiyer', sample: 'Arda Y.', group: 'İşlem' },
      { key: 'balance', label: 'Kalan bakiye', sample: '₺0', group: 'Finans' },
    ],
    [
      { id: 'cs-daily', name: 'Günlük kasa defteri', description: 'Tüm tahsilat ve ödemeler', columns: ['time', 'guest', 'roomNo', 'amount', 'type', 'user'] },
      { id: 'cs-close', name: 'Kasa kapanış özeti', description: 'Vardiya sonu mutabakat', columns: ['register', 'amount', 'paymentMethod', 'user'] },
    ],
  ),
  mod('acc', 'Muhasebe', '📒', 'Fatura, cari hesap ve mali raporlar',
    ['date', 'account', 'description', 'debit', 'credit'],
    [
      { key: 'date', label: 'Tarih', sample: '18.06.2026', group: 'Kayıt' },
      { key: 'invoiceNo', label: 'Fatura no', sample: 'FTR-0892', group: 'Fatura' },
      { key: 'guest', label: 'Misafir / firma', sample: 'Ayşe Yılmaz', group: 'Cari' },
      { key: 'account', label: 'Cari hesap', sample: 'Booking.com', group: 'Cari' },
      { key: 'description', label: 'Açıklama', sample: 'Haziran tahakkuk', group: 'Kayıt' },
      { key: 'debit', label: 'Borç', sample: '₺42.800', group: 'Finans' },
      { key: 'credit', label: 'Alacak', sample: '₺38.200', group: 'Finans' },
      { key: 'vat', label: 'KDV', sample: '₺7.704', group: 'Finans' },
      { key: 'amount', label: 'Tutar', sample: '₺20.800', group: 'Finans' },
      { key: 'status', label: 'Durum', sample: 'Ödendi', group: 'Fatura' },
      { key: 'type', label: 'Fatura tipi', sample: 'Konaklama', group: 'Fatura' },
    ],
    [
      { id: 'acc-ledger', name: 'Cari hesap ekstresi', description: 'Borç-alacak hareketleri', columns: ['date', 'account', 'description', 'debit', 'credit'] },
      { id: 'acc-inv', name: 'Fatura listesi', description: 'Kesilen faturalar', columns: ['invoiceNo', 'guest', 'date', 'amount', 'vat', 'status'] },
    ],
  ),
  mod('gr', 'Misafir İlişkileri', '🤝', 'VIP, şikayet, trace ve memnuniyet',
    ['guestName', 'roomNo', 'topic', 'status'],
    [
      { key: 'guestName', label: 'Misafir', sample: 'Ayşe Yılmaz', group: 'Misafir' },
      { key: 'roomNo', label: 'Oda', sample: '312', group: 'Oda' },
      { key: 'vipLevel', label: 'VIP seviye', sample: 'Platinum', group: 'VIP' },
      { key: 'topic', label: 'Konu', sample: 'Oda sıcaklığı', group: 'Takip' },
      { key: 'traceType', label: 'Trace tipi', sample: 'Şikayet', group: 'Takip' },
      { key: 'status', label: 'Durum', sample: 'Açık', group: 'Takip' },
      { key: 'priority', label: 'Öncelik', sample: 'Yüksek', group: 'Takip' },
      { key: 'assignedTo', label: 'Sorumlu', sample: 'GR ekibi', group: 'Takip' },
      { key: 'createdAt', label: 'Açılış', sample: '18.06.2026', group: 'Tarih' },
      { key: 'resolvedAt', label: 'Kapanış', sample: '—', group: 'Tarih' },
      { key: 'rating', label: 'Puan', sample: '4.5', group: 'Memnuniyet' },
      { key: 'comment', label: 'Yorum', sample: 'Harika konaklama', group: 'Memnuniyet' },
      { key: 'notes', label: 'Not', sample: 'Özel karşılama', group: 'VIP' },
      { key: 'checkIn', label: 'Giriş', sample: '18.06.2026', group: 'Tarih' },
    ],
    [
      { id: 'gr-vip', name: 'VIP misafir listesi', description: 'Özel ilgi gerektiren misafirler', columns: ['guestName', 'roomNo', 'vipLevel', 'checkIn', 'notes'] },
      { id: 'gr-trace', name: 'Açık trace listesi', description: 'Takip edilen konular', columns: ['guestName', 'topic', 'traceType', 'status', 'assignedTo'] },
      { id: 'gr-review', name: 'Misafir yorumları', description: 'Memnuniyet özeti', columns: ['guestName', 'rating', 'comment', 'createdAt'] },
    ],
  ),
  mod('fnb', 'Banket & F&B', '🍽️', 'Restoran, banket ve minibar raporları',
    ['eventName', 'date', 'covers', 'revenue'],
    [
      { key: 'eventName', label: 'Etkinlik / outlet', sample: 'Tech Summit Gala', group: 'Banket' },
      { key: 'date', label: 'Tarih', sample: '20.06.2026', group: 'Tarih' },
      { key: 'time', label: 'Saat', sample: '19:00', group: 'Tarih' },
      { key: 'covers', label: 'Kişi sayısı', sample: '120', group: 'Banket' },
      { key: 'menu', label: 'Menü', sample: 'Gala menü', group: 'Banket' },
      { key: 'hall', label: 'Salon', sample: 'Kristal', group: 'Banket' },
      { key: 'revenue', label: 'Gelir', sample: '₺145.000', group: 'Finans' },
      { key: 'outlet', label: 'Outlet', sample: 'Ana restoran', group: 'F&B' },
      { key: 'item', label: 'Ürün', sample: 'Minibar su', group: 'F&B' },
      { key: 'qty', label: 'Adet', sample: '48', group: 'F&B' },
      { key: 'guest', label: 'Misafir', sample: 'Ayşe Yılmaz', group: 'Misafir' },
      { key: 'roomNo', label: 'Oda', sample: '312', group: 'Oda' },
    ],
    [
      { id: 'fnb-banquet', name: 'Banket rezervasyonları', description: 'Salon ve etkinlik takvimi', columns: ['eventName', 'date', 'time', 'hall', 'covers', 'revenue'] },
      { id: 'fnb-minibar', name: 'Minibar tüketim', description: 'Oda bazlı minibar satış', columns: ['roomNo', 'guest', 'item', 'qty', 'revenue'] },
    ],
  ),
  mod('stk', 'Stok & Envanter', '📦', 'Depo, stok hareket ve maliyet',
    ['sku', 'name', 'qty', 'category'],
    [
      { key: 'sku', label: 'Stok kodu', sample: 'HK-TWL-001', group: 'Ürün' },
      { key: 'name', label: 'Ürün adı', sample: 'Havlu (banyo)', group: 'Ürün' },
      { key: 'category', label: 'Kategori', sample: 'Kat HK', group: 'Ürün' },
      { key: 'qty', label: 'Mevcut miktar', sample: '420', group: 'Stok' },
      { key: 'minQty', label: 'Minimum stok', sample: '200', group: 'Stok' },
      { key: 'unit', label: 'Birim', sample: 'Adet', group: 'Stok' },
      { key: 'unitCost', label: 'Birim maliyet', sample: '₺85', group: 'Finans' },
      { key: 'movement', label: 'Hareket tipi', sample: 'Giriş', group: 'Hareket' },
      { key: 'date', label: 'Tarih', sample: '18.06.2026', group: 'Hareket' },
      { key: 'warehouse', label: 'Depo', sample: 'Ana depo', group: 'Stok' },
    ],
    [
      { id: 'stk-level', name: 'Stok seviye raporu', description: 'Kritik stok uyarıları', columns: ['sku', 'name', 'qty', 'minQty', 'category'] },
      { id: 'stk-move', name: 'Stok hareketleri', description: 'Giriş-çıkış kayıtları', columns: ['date', 'name', 'movement', 'qty', 'warehouse'] },
    ],
  ),
  mod('eod', 'Gün Sonu', '🌙', 'Elektra GR gün sonu raporları — sütunları sihirbazda özelleştirin',
    ['businessDate', 'occupancy', 'revenue', 'closedBy'],
    [
      ...EOD_LEGACY_FIELD_DEFS.map((f) => ({
        key: f.key,
        label: f.label,
        sample: f.sample,
        group: f.group,
      })),
      { key: 'closedAt', label: 'Kapanış saati', sample: '23:58', group: 'Kapanış' },
      { key: 'roomsSold', label: 'Satılan oda', sample: '55', group: 'KPI' },
      { key: 'reportType', label: 'Rapor tipi', sample: 'FO özet', group: 'Kapanış' },
    ],
    [
      { id: 'eod-summary', name: 'Gün sonu özet', description: 'Standart kapanış paketi', columns: ['businessDate', 'occupancy', 'revenue', 'adr', 'closedBy'] },
      { id: 'eod-archive', name: 'Arşiv listesi', description: 'Geçmiş iş günleri', columns: ['businessDate', 'closedAt', 'occupancy', 'revenue'] },
      ...buildEodLegacyStarters(),
    ],
  ),
  mod('mg', 'Yönetim', '📊', 'Üst düzey KPI ve performans raporları',
    ['date', 'occupancy', 'adr', 'revpar', 'revenue'],
    [
      { key: 'date', label: 'Tarih', sample: '18.06.2026', group: 'Dönem' },
      { key: 'occupancy', label: 'Doluluk %', sample: '72', group: 'KPI' },
      { key: 'roomsSold', label: 'Satılan oda', sample: '55', group: 'KPI' },
      { key: 'adr', label: 'ADR', sample: '₺4.850', group: 'KPI' },
      { key: 'revpar', label: 'RevPAR', sample: '₺3.492', group: 'KPI' },
      { key: 'revenue', label: 'Gelir', sample: '₺284.500', group: 'KPI' },
      { key: 'market', label: 'Market', sample: 'OTA', group: 'Segment' },
      { key: 'agency', label: 'Acenta', sample: 'Booking', group: 'Segment' },
      { key: 'segment', label: 'Segment', sample: 'İş seyahati', group: 'Segment' },
      { key: 'budget', label: 'Bütçe', sample: '₺300.000', group: 'KPI' },
      { key: 'variance', label: 'Sapma %', sample: '-5.2', group: 'KPI' },
    ],
    [
      { id: 'mg-daily', name: 'Günlük yönetim raporu', description: 'Temel KPI özeti', columns: ['date', 'occupancy', 'adr', 'revpar', 'revenue'] },
      { id: 'mg-market', name: 'Market analizi', description: 'Segment bazlı performans', columns: ['market', 'agency', 'occupancy', 'revenue'] },
    ],
  ),
  mod('sal', 'Satış & Pazarlama', '📈', 'Acenta, kontrat ve fiyat analizi',
    ['agency', 'market', 'rooms', 'revenue'],
    [
      { key: 'agency', label: 'Acenta', sample: 'Booking.com', group: 'Kanal' },
      { key: 'market', label: 'Market', sample: 'OTA-BKG', group: 'Kanal' },
      { key: 'contract', label: 'Kontrat', sample: '2026 BAR', group: 'Fiyat' },
      { key: 'roomType', label: 'Oda tipi', sample: 'DBL', group: 'Fiyat' },
      { key: 'rate', label: 'Fiyat', sample: '₺5.200', group: 'Fiyat' },
      { key: 'rooms', label: 'Oda geceleme', sample: '128', group: 'Performans' },
      { key: 'revenue', label: 'Gelir', sample: '₺665.600', group: 'Performans' },
      { key: 'share', label: 'Pay %', sample: '34', group: 'Performans' },
      { key: 'period', label: 'Dönem', sample: 'Haziran 2026', group: 'Dönem' },
    ],
    [
      { id: 'sal-channel', name: 'Kanal performansı', description: 'Acenta bazlı gelir', columns: ['agency', 'market', 'rooms', 'revenue', 'share'] },
      { id: 'sal-rate', name: 'Fiyat listesi', description: 'Kontrat ve BAR karşılaştırma', columns: ['roomType', 'contract', 'rate', 'period'] },
    ],
  ),
];

/** Export'ta gerçek DB verisi kullanan departmanlar (UI rozeti) */
export const LIVE_DATA_MODULES = new Set([
  'Rezervasyon', 'Resepsiyon', 'Önbüro', 'Satış & Pazarlama',
  'Kat Hizmetleri', 'Stok & Envanter', 'Muhasebe', 'Ön Kasa', 'Gün Sonu', 'Misafir İlişkileri',
]);

export function moduleByLabel(label: string): ReportModuleDef | undefined {
  return REPORT_MODULES.find((m) => m.label === label);
}

export function moduleById(id: string): ReportModuleDef | undefined {
  return REPORT_MODULES.find((m) => m.id === id);
}

export function fieldLabel(moduleLabel: string, key: string): string {
  const m = moduleByLabel(moduleLabel);
  return m?.fields.find((f) => f.key === key)?.label ?? key;
}

export function fieldSample(moduleLabel: string, key: string): string {
  const m = moduleByLabel(moduleLabel);
  return m?.fields.find((f) => f.key === key)?.sample ?? '—';
}

export function fieldGroups(moduleLabel: string): { group: string; fields: ReportFieldDef[] }[] {
  const m = moduleByLabel(moduleLabel);
  if (!m) return [];
  const map = new Map<string, ReportFieldDef[]>();
  for (const f of m.fields) {
    const g = f.group ?? 'Diğer';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(f);
  }
  return Array.from(map.entries()).map(([group, fields]) => ({ group, fields }));
}

export function previewRows(moduleLabel: string, columns: string[]): Record<string, string>[] {
  if (columns.length === 0) return [];
  return Array.from({ length: 3 }, (_, i) => {
    const row: Record<string, string> = {};
    for (const col of columns) {
      const base = fieldSample(moduleLabel, col);
      row[col] = i === 0 ? base : base.replace(/\d/g, (d) => String((Number(d) + i) % 10));
    }
    return row;
  });
}

export function allStarters(): Array<ReportStarter & { module: ReportModuleDef }> {
  return REPORT_MODULES.flatMap((m) => m.starters.map((s) => ({ ...s, module: m })));
}
