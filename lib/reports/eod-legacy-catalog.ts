import type { EodLegacyFieldKey } from './eod-legacy-fields';
import {
  EOD_ARRIVAL_COLUMNS,
  EOD_DEPARTURE_COLUMNS,
  EOD_DEPARTURE_TODAY_COLUMNS,
  EOD_EARLY_DEPARTURE_COLUMNS,
  EOD_TODAY_RESERVATION_COLUMNS,
  EOD_TODAY_CANCELLED_COLUMNS,
  EOD_DAILY_GUEST_COLUMNS,
  EOD_HUSE_COMP_COLUMNS,
  EOD_ROOM_PRICE_COLUMNS,
  EOD_MANUAL_ROOM_PRICE_COLUMNS,
  EOD_DEPT_COLUMNS,
  EOD_FOLIO_COLUMNS,
  EOD_GUEST_LIST_COLUMNS,
  EOD_INVOICE_COLUMNS,
  EOD_KASA_COLUMNS,
  EOD_MGMT_COLUMNS,
  EOD_POLICE_COLUMNS,
  EOD_FOLIO_CORRECTION_COLUMNS,
  EOD_DEPT_TRANSACTION_COLUMNS,
  EOD_MAIN_CURRENT_COLUMNS,
  EOD_NET_KASA_COLUMNS,
  EOD_FX_EXCHANGE_COLUMNS,
  EOD_INVOICE_CONTROL_COLUMNS,
  EOD_CREDIT_INVOICE_COLUMNS,
  EOD_GUEST_PRICE_COLUMNS,
  EOD_KASA_LEDGER_COLUMNS,
  EOD_FOLIO_BALANCE_COLUMNS,
  EOD_MASTER_FOLIO_COLUMNS,
  EOD_RGC_COLUMNS,
  EOD_VIP_COLUMNS,
  EOD_HK_COLUMNS,
  EOD_ROOM_CHANGE_COLUMNS,
  EOD_BILANCO_COLUMNS,
  EOD_OFFICIAL_GUEST_COLUMNS,
  EOD_STOCK_COLUMNS,
  EOD_CUSTOMER_COLUMNS,
  EOD_DISCOUNT_REFUND_COLUMNS,
} from './eod-legacy-fields';

export type EodLegacyCategory = {
  id: string;
  label: string;
};

export type EodLegacyReportDef = {
  id: string;
  fileName: string;
  label: string;
  categoryId: string;
  title: string;
  columns: EodLegacyFieldKey[];
};

function r(
  id: string,
  fileName: string,
  label: string,
  categoryId: string,
  title: string,
  columns: EodLegacyFieldKey[],
): EodLegacyReportDef {
  return { id, fileName, label, categoryId, title, columns };
}

/** Elektra Gün Sonu — sol kategori düğmeleri */
export const EOD_LEGACY_CATEGORIES: EodLegacyCategory[] = [
  { id: 'gunsonu-listesi', label: 'Gün Sonu Raporları Listesi' },
  { id: 'gunluk-yonetim', label: 'Günlük Yönetim Raporu' },
  { id: 'kumulatif-dept', label: 'Kümülatif Departman Gelir' },
  { id: 'gunluk-bilanco', label: 'Günlük Bilanço' },
  { id: 'dept-grup', label: 'Departman Gelir Grubu' },
  { id: 'kasa', label: 'Kasa Raporu' },
  { id: 'city-ledger', label: 'City Ledger-Fatura Raporu' },
  { id: 'gunluk-fatura', label: 'Günlük Kesilen Fatura' },
  { id: 'faturasiz', label: 'Faturalı Kesilmeyen' },
  { id: 'gunluk-islem', label: 'Günlük İşlemler Raporu' },
  { id: 'comp-house', label: 'Comp/HUse Raporu' },
  { id: 'resmi-musteri', label: 'Resmi Müşteri Listesi' },
];

/** Elektra .RPR dosya ağacı — GR serisi ve ek arşiv dosyaları */
export const EOD_LEGACY_REPORTS: EodLegacyReportDef[] = [
  // Giriş / çıkış
  r('GR101', 'GR101_Gunluk Giris Listesi.RPR', 'GR101_Gunluk Giris Listesi', 'gunsonu-listesi', 'Günlük Giriş Listesi', EOD_ARRIVAL_COLUMNS),
  r('GR102', 'GR102_Gunluk Cikis Listesi.RPR', 'GR102_Gunluk_Cikis_Listesi', 'gunsonu-listesi', 'Günlük Çıkış Listesi', EOD_DEPARTURE_COLUMNS),
  r('GR1021', 'GR1021_Gunluk Cikis Listesi BUGUN.RPR', 'GR1021_Gunluk Cikis Listesi BUGUN', 'gunsonu-listesi', 'Günlük Çıkış Listesi - BUGÜN', EOD_DEPARTURE_TODAY_COLUMNS),
  r('GR103', 'GR103_Gunluk Erken Cikis Listesi.RPR', 'GR103_Gunluk Erken Cikis Listesi', 'gunsonu-listesi', 'Günlük Erken Çıkış Listesi', EOD_EARLY_DEPARTURE_COLUMNS),
  r('GR104', 'GR104_Bugun Girilen Rezervasyonlar.RPR', 'GR104_Bugun Girilen Rezervasyonlar', 'gunsonu-listesi', 'Bugün Girilen Rezervasyon Listesi', EOD_TODAY_RESERVATION_COLUMNS),
  r('GR105', 'GR105_Bugun Iptal Edilen Rezervasyonlar.RPR', 'GR105_Bugun Iptal Edilen Rezervasyonlar', 'gunsonu-listesi', 'Bugün İptal Edilen Rezervasyonlar Listesi', EOD_TODAY_CANCELLED_COLUMNS),
  // Misafir / oda
  r('GR201', 'GR201_Gunluk Misafir Liste.RPR', 'GR201_Gunluk Misafir Listesi', 'gunsonu-listesi', 'Günlük Misafir Listesi', EOD_DAILY_GUEST_COLUMNS),
  r('GR202', 'GR202_Huse Comp Fcomp.RPR', 'GR202_Huse Comp Fcomp', 'comp-house', 'HUSE COMP FCOMP oda Listesi', EOD_HUSE_COMP_COLUMNS),
  r('GR203', 'GR203_VIP Misafir.RPR', 'GR203_VIP Misafir', 'gunsonu-listesi', 'VIP Misafir Listesi', EOD_VIP_COLUMNS),
  r('GR205G', 'GR205_gruplu-Oda Fiyat Kontrol.RPR', 'GR205_gruplu-Oda Fiyat Kontrol', 'gunsonu-listesi', 'Gruplu Oda Fiyat Kontrol', EOD_ROOM_PRICE_COLUMNS),
  r('GR205', 'GR205_Oda Fiyat Kontrol Listesi.RPR', 'GR205_Oda Fiyat Kontrol Listesi', 'gunsonu-listesi', 'ODA FİYAT KONTROL LİSTESİ', EOD_ROOM_PRICE_COLUMNS),
  r('GR206', 'GR206_Manuel Oda Fiyat Kontrol Listesi.RPR', 'GR206_Manuel Oda Fiyat Kontrol Listesi', 'gunsonu-listesi', 'ODA FİYAT KONTROL LİSTESİ (Sadece Manuel)', EOD_MANUAL_ROOM_PRICE_COLUMNS),
  r('GR220', 'GR220_House Keeping.RPR', 'GR220_House Keeping', 'gunsonu-listesi', 'House Keeping', EOD_HK_COLUMNS),
  r('GR221', 'GR221_Oda Degisim.RPR', 'GR221_Oda Degisim', 'gunsonu-listesi', 'Oda Değişim Listesi', EOD_ROOM_CHANGE_COLUMNS),
  r('GR222', 'GR222_Gunluk Polis Listesi.RPR', 'GR222_Gunluk Polis Listesi', 'resmi-musteri', 'Günlük Polis Listesi', EOD_POLICE_COLUMNS),
  // Folyo / finans
  r('GR300', 'GR300_Folyo Extre Listesi.RPR', 'GR300_Folyo Extre Listesi', 'gunsonu-listesi', 'Folyo Extre Listesi', EOD_FOLIO_COLUMNS),
  r('GR301I', 'GR301_Iptal Folyo Islemleri.RPR', 'GR301_Iptal Folyo Islemleri', 'gunluk-islem', 'İptal Folyo İşlemleri', EOD_FOLIO_COLUMNS),
  r('GR301S', 'GR301_Silinen Folyo Islemleri.RPR', 'GR301_Silinen Folyo Islemleri', 'gunluk-islem', 'Silinen Folyo İşlemleri', EOD_FOLIO_COLUMNS),
  r('GR302', 'GR302_Folyo Islem Transfer.RPR', 'GR302_Folyo Islem Transfer', 'gunluk-islem', 'Folyo İşlem Transfer', EOD_FOLIO_COLUMNS),
  r('GR303', 'GR303_Folyo Duzeltme Listesi.RPR', 'GR303_Folyo Duzeltme Listesi', 'gunluk-islem', 'FOLYO DÜZELTME LİSTESİ', EOD_FOLIO_CORRECTION_COLUMNS),
  r('GR310', 'GR310_Gunluk Departman.RPR', 'GR310_Gunluk Departman', 'dept-grup', 'Günlük Departman İşlem Listesi', EOD_DEPT_TRANSACTION_COLUMNS),
  r('GR350', 'GR350_Main Current Raporu.RPR', 'GR350_Main Current Raporu', 'city-ledger', 'MAIN CURRENT RAPORU', EOD_MAIN_CURRENT_COLUMNS),
  r('GR400K', 'GR400_Gunluk Kasa Toplam.RPR', 'GR400_Gunluk Kasa Toplam', 'kasa', 'Günlük Kasa Toplam', EOD_KASA_COLUMNS),
  r('GR401K', 'GR401_BURUT_Gunluk Kasa.RPR', 'GR401_BURUT_Gunluk Kasa', 'kasa', 'Brüt Günlük Kasa', EOD_KASA_COLUMNS),
  r('GR401N', 'GR401_NET_Gunluk Kasa.RPR', 'GR401_NET_Gunluk Kasa', 'kasa', 'CS2 - NET KASA İŞLEM RAPORU', EOD_NET_KASA_COLUMNS),
  r('GR402', 'GR402_Doviz Bozdurma List.RPR', 'GR402_Doviz Bozdurma List', 'kasa', 'DÖVİZ BOZDURMA LİSTESİ', EOD_FX_EXCHANGE_COLUMNS),
  r('GR501', 'GR501_DepartmanGelir.RPR', 'GR501_DepartmanGelir', 'dept-grup', 'Departman Gelir', EOD_DEPT_COLUMNS),
  r('GR502', 'GR502_GunlukKesilenFatura_TOPLAM.RPR', 'GR502_GunlukKesilenFatura', 'gunluk-fatura', 'FATURA KONTROL LİSTESİ', EOD_INVOICE_CONTROL_COLUMNS),
  r('GR503', 'GR503_KrediyeKaldirilanFatura.RPR', 'GR503_KrediyeKaldirilanFatura', 'city-ledger', 'GÜNLÜK KREDİYE KALDIRILAN HESAPLAR LİSTESİ', EOD_CREDIT_INVOICE_COLUMNS),
  r('GR602', 'GR602_Fatura Toplam.RPR', 'GR602_Fatura Toplam', 'faturasiz', 'Fatura Toplam', EOD_INVOICE_COLUMNS),
  // Yönetim / kapanış paketi
  r('GR400', 'GR400_Gunluk Yonetim.RPR', 'GR400_Gunluk Yonetim', 'gunluk-yonetim', 'Günlük Yönetim Raporu', EOD_MGMT_COLUMNS),
  r('GR401', 'GR401_Gunluk Bilanco.RPR', 'GR401_Gunluk Bilanco', 'gunluk-bilanco', 'Günlük Bilanço', EOD_BILANCO_COLUMNS),
  r('GR302K', 'GR302_Kumulatif Dept.RPR', 'GR302_Kumulatif Dept', 'kumulatif-dept', 'Kümülatif Departman Gelir', EOD_DEPT_COLUMNS),
  r('GR500', 'GR500_Kasa Raporu.RPR', 'GR500_Kasa Raporu', 'kasa', 'Kasa Raporu', EOD_KASA_COLUMNS),
  r('GR501I', 'GR501_Gunluk Islemler.RPR', 'GR501_Gunluk Islemler', 'gunluk-islem', 'Günlük İşlemler Raporu', EOD_FOLIO_COLUMNS),
  r('GR600', 'GR600_City Ledger Fatura.RPR', 'GR600_City Ledger Fatura', 'city-ledger', 'City Ledger Fatura Raporu', EOD_INVOICE_COLUMNS),
  r('GR601', 'GR601_Gunluk Kesilen Fatura.RPR', 'GR601_Gunluk Kesilen Fatura', 'gunluk-fatura', 'Günlük Kesilen Fatura', EOD_INVOICE_COLUMNS),
  r('GR602F', 'GR602_Faturali Kesilmeyen.RPR', 'GR602_Faturali Kesilmeyen', 'faturasiz', 'Faturalı Kesilmeyen', EOD_INVOICE_COLUMNS),
  r('GR700', 'GR700.RPR', 'GR700', 'gunsonu-listesi', 'Günlük Misafir Fiyat Listesi', EOD_GUEST_PRICE_COLUMNS),
  r('GR701', 'GR701_Resmi Musteri.RPR', 'GR701_Resmi Musteri', 'resmi-musteri', 'Resmi Müşteri Listesi', EOD_OFFICIAL_GUEST_COLUMNS),
  // Ek .RPR arşiv dosyaları
  r('GRFOLYOBAKIYE2', 'GRFOLYOBAKIYE2.RPR', 'GRFOLYOBAKIYE2', 'gunsonu-listesi', 'FOLYO BAKİYE LİSTESİ', EOD_FOLIO_BALANCE_COLUMNS),
  r('GRKASAISLEM', 'GRKASAISLEM.RPR', 'GRKASAISLEM', 'kasa', 'GÜNLÜK KASA DEFTERİ LİSTESİ', EOD_KASA_LEDGER_COLUMNS),
  r('GRMAL', 'GRMAL.RPR', 'GRMAL', 'gunsonu-listesi', 'Mal Raporu', EOD_STOCK_COLUMNS),
  r('GRMUSTERI', 'GRMUSTERI.RPR', 'GRMUSTERI', 'resmi-musteri', 'Müşteri Raporu', EOD_CUSTOMER_COLUMNS),
  r('GRODAFIYATKON', 'GRODAFIYATKON.RPR', 'GRODAFIYATKON', 'gunsonu-listesi', 'ODA FİYAT KONTROL LİSTESİ', EOD_ROOM_PRICE_COLUMNS),
  r('GRMAIL', 'GRMAIL.RPR', 'GRMAIL', 'gunsonu-listesi', 'E-Posta Misafir Listesi', EOD_GUEST_PRICE_COLUMNS),
  r('GUNLUKINDIRIMIADE', 'GUNLUK INDIRIM IADE.RPR', 'GUNLUK INDIRIM IADE', 'gunsonu-listesi', 'Günlük İndirim İade', EOD_DISCOUNT_REFUND_COLUMNS),
  r('MASTERFOLYOKONTORL', 'MASTERFOLYOKONTROL.RPR', 'MASTERFOLYOKONTROL', 'gunsonu-listesi', 'MASTER FOLYO KONTROL LISTESI', EOD_MASTER_FOLIO_COLUMNS),
  r('RGC', 'RGC.RPR', 'RGC', 'gunsonu-listesi', 'Ayrılış Odaları Özeti', EOD_RGC_COLUMNS),
];

export function findLegacyReport(id: string): EodLegacyReportDef | undefined {
  return EOD_LEGACY_REPORTS.find((r) => r.id === id);
}

/** Sol kategori düğmesi → varsayılan GR raporu (Elektra) */
export const CATEGORY_DEFAULT_REPORT: Record<string, string> = {
  'gunsonu-listesi': 'GR101',
  'gunluk-yonetim': 'GR400',
  'kumulatif-dept': 'GR302K',
  'gunluk-bilanco': 'GR401',
  'dept-grup': 'GR501',
  kasa: 'GR500',
  'city-ledger': 'GR600',
  'gunluk-fatura': 'GR601',
  faturasiz: 'GR602F',
  'gunluk-islem': 'GR501I',
  'comp-house': 'GR202',
  'resmi-musteri': 'GR701',
};

export function defaultReportForCategory(categoryId: string): string {
  const mapped = CATEGORY_DEFAULT_REPORT[categoryId];
  if (mapped && findLegacyReport(mapped)) return mapped;
  return EOD_LEGACY_REPORTS.find((r) => r.categoryId === categoryId)?.id ?? 'GR101';
}

/** Gün Sonu Raporları Listesi tüm ağacı gösterir; diğer kategoriler kendi raporlarını filtreler */
export function reportsForCategory(categoryId: string): EodLegacyReportDef[] {
  if (categoryId === 'gunsonu-listesi') return EOD_LEGACY_REPORTS;
  return EOD_LEGACY_REPORTS.filter((r) => r.categoryId === categoryId);
}
