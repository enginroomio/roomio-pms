import assert from 'node:assert/strict';
import test from 'node:test';
import { findLegacyReport, defaultReportForCategory } from './eod-legacy-catalog';
import { renderLegacyEodReport } from './eod-legacy-render';

test('GR101 — günlük giriş listesi önizlemesi', () => {
  const report = findLegacyReport('GR101')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTELSAPPWINK',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:56'),
    reservations: [],
  });
  assert.match(text, /Günlük Giriş Listesi/);
  assert.match(text, /HOTELSAPPWINK/);
  assert.match(text, /ABDULLA ALAMERI/);
  assert.match(text, /Listelendi 3/);
});

test('GR102 — günlük çıkış listesi önizlemesi', () => {
  const report = findLegacyReport('GR102')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTELSAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:54'),
    reservations: [],
  });
  assert.match(text, /Günlük Çıkış Listesi/);
  assert.match(text, /HOTELSAPPHIRE/);
  assert.match(text, /SOTVALDIEV BOTIR/);
  assert.match(text, /D\.FİYAT/);
  assert.match(text, /EŞekli/);
  assert.match(text, /6\.543,96/);
  assert.match(text, /4\.050,45/);
  assert.match(text, /Listelenen 6/);
  assert.equal(report.label, 'GR102_Gunluk_Cikis_Listesi');
});

test('eod legacy catalog — GR101 dosya adı', () => {
  const report = findLegacyReport('GR101');
  assert.ok(report);
  assert.equal(report?.fileName, 'GR101_Gunluk Giris Listesi.RPR');
});

test('GR202 — huse comp fcomp oda listesi', () => {
  const report = findLegacyReport('GR202')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTEL SAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:57'),
    reservations: [],
  });
  assert.match(text, /HUSE COMP FCOMP oda Listesi/);
  assert.match(text, /Kşekli/);
  assert.match(text, /XBr/);
  assert.match(text, /1\.Misafir/);
  assert.match(text, /Listelenen 0/);
  assert.equal(report.fileName, 'GR202_Huse Comp Fcomp.RPR');
  assert.equal(report.categoryId, 'comp-house');
  assert.ok(report.columns.includes('stayForm'));
  assert.ok(report.columns.includes('xbr'));
});

test('GR206 — manuel oda fiyat kontrol listesi', () => {
  const report = findLegacyReport('GR206')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTEL SAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:57'),
    reservations: [],
  });
  assert.match(text, /ODA FİYAT KONTROL LİSTESİ \(Sadece Manuel\)/);
  assert.match(text, /Döviz Kuru/);
  assert.match(text, /Folyo/);
  assert.match(text, /BOOKING-NRF/);
  assert.match(text, /Listelenen 22/);
  assert.match(text, /104\.365,34/);
  assert.equal(report.fileName, 'GR206_Manuel Oda Fiyat Kontrol Listesi.RPR');
  assert.ok(report.columns.includes('folioAmount'));
});

test('GR205 — oda fiyat kontrol listesi', () => {
  const report = findLegacyReport('GR205')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTELSAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:57'),
    reservations: [],
  });
  assert.match(text, /ODA FİYAT KONTROL LİSTESİ/);
  assert.match(text, /Alındığı T\./);
  assert.match(text, /Fiyat Açıklama/);
  assert.match(text, /ABDULLA ALAMERI/);
  assert.match(text, /104\.365,30/);
  assert.equal(report.fileName, 'GR205_Oda Fiyat Kontrol Listesi.RPR');
  assert.ok(report.columns.includes('priceDescription'));
});

test('GR205G — gruplu oda fiyat kontrol', () => {
  const report = findLegacyReport('GR205G')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTELSAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:57'),
    reservations: [],
  });
  assert.match(text, /GRUPLU ODA FİYAT KONTROL/);
  assert.match(text, /BOOKING\.COM/);
});

test('comp-house kategorisi — varsayılan GR202', () => {
  assert.equal(defaultReportForCategory('comp-house'), 'GR202');
  const report = findLegacyReport('GR202');
  assert.ok(report);
  assert.equal(report?.categoryId, 'comp-house');
  assert.equal(report?.title, 'HUSE COMP FCOMP oda Listesi');
});

test('GR201 — günlük misafir listesi', () => {
  const report = findLegacyReport('GR201')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTELSAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:57'),
    reservations: [],
  });
  assert.match(text, /Günlük Misafir Listesi/);
  assert.match(text, /ABDULLA ALAMERI/);
  assert.match(text, /Misafirler/);
  assert.match(text, /Hşekli/);
  assert.match(text, /Oda Notu/);
  assert.match(text, /Listelenen 22/);
  assert.equal(report.label, 'GR201_Gunluk Misafir Listesi');
  assert.ok(report.columns.includes('bpt'));
  assert.ok(report.columns.includes('hsekli'));
  assert.ok(report.columns.includes('roomNote'));
});

test('GR105 — bugün iptal edilen rezervasyonlar', () => {
  const report = findLegacyReport('GR105')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTEL SAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:57'),
    reservations: [],
  });
  assert.match(text, /Bugün İptal Edilen Rezervasyonlar Listesi/);
  assert.match(text, /RŞekli/);
  assert.match(text, /Bbk/);
  assert.match(text, /Listelenen 0/);
  assert.equal(report.fileName, 'GR105_Bugun Iptal Edilen Rezervasyonlar.RPR');
  assert.ok(report.columns.includes('reservationType'));
  assert.ok(report.columns.includes('baby'));
});

test('GR104 — bugün girilen rezervasyon listesi', () => {
  const report = findLegacyReport('GR104')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTEL SAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:54'),
    reservations: [],
  });
  assert.match(text, /Bugün Girilen Rezervasyon Listesi/);
  assert.match(text, /NURDAN TORUNN/);
  assert.match(text, /STEFANO SAMMARCO/);
  assert.match(text, /KŞekli/);
  assert.match(text, /Listelenen 17/);
  assert.equal(report.fileName, 'GR104_Bugun Girilen Rezervasyonlar.RPR');
  assert.ok(report.columns.includes('bookingType'));
  assert.ok(report.columns.includes('confirmationNo'));
});

test('GR103 — günlük erken çıkış listesi', () => {
  const report = findLegacyReport('GR103')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTELSAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:56'),
    reservations: [],
  });
  assert.match(text, /Günlük Erken Çıkış Listesi/);
  assert.match(text, /EskiCOut/);
  assert.match(text, /Toplam Pen/);
  assert.match(text, /Cout Notu/);
  assert.match(text, /Listelenen 0/);
  assert.equal(report.fileName, 'GR103_Gunluk Erken Cikis Listesi.RPR');
  assert.ok(report.columns.includes('originalCheckOut'));
  assert.ok(report.columns.includes('penaltyTotal'));
});

test('GR1021 — günlük çıkış listesi BUGÜN (acenta gruplu)', () => {
  const report = findLegacyReport('GR1021')!;
  const text = renderLegacyEodReport(report, {
    hotelName: 'HOTEL SAPPHIRE',
    businessDate: '2026-06-27',
    userName: 'OGUZHAN',
    generatedAt: new Date('2026-06-27T03:52:56'),
    reservations: [],
  });
  assert.match(text, /Günlük Çıkış Listesi - BUGÜN/);
  assert.match(text, /CRISTOFORO D AMATO/);
  assert.match(text, /BOOKING ODEME/);
  assert.match(text, /Adet: 2/);
  assert.match(text, /F\.Sekli/);
  assert.match(text, /Listelenen 5/);
  assert.equal(report.fileName, 'GR1021_Gunluk Cikis Listesi BUGUN.RPR');
  assert.ok(report.columns.includes('folioType'));
  assert.ok(report.columns.includes('basePrice'));
});

test('eod legacy catalog — GR102 dosya adı ve sütunlar', () => {
  const report = findLegacyReport('GR102');
  assert.ok(report);
  assert.equal(report?.fileName, 'GR102_Gunluk Cikis Listesi.RPR');
  assert.equal(report?.title, 'Günlük Çıkış Listesi');
  assert.ok(report?.columns.includes('voucherNo'));
  assert.ok(report?.columns.includes('paymentType'));
});

const batchCtx = {
  hotelName: 'HOTELSAPPHIRE',
  businessDate: '2026-06-27',
  userName: 'OGUZHAN',
  generatedAt: new Date('2026-06-28T03:52:58'),
  reservations: [] as never[],
};

test('GR222 — günlük polis listesi', () => {
  const report = findLegacyReport('GR222')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /Günlük Polis Listesi/);
  assert.match(text, /TC Kimlik No/);
  assert.match(text, /Listelenen 46/);
  assert.equal(report.fileName, 'GR222_Gunluk Polis Listesi.RPR');
});

test('GR310 — günlük departman işlem listesi', () => {
  const report = findLegacyReport('GR310')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /Günlük Departman İşlem Listesi/);
  assert.match(text, /Grup : 01 \(ROOM\)/);
  assert.match(text, /OĞUZHAN/);
});

test('GR502 — fatura kontrol listesi', () => {
  const report = findLegacyReport('GR502')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /FATURA KONTROL LİSTESİ/);
  assert.match(text, /SELİM EROĞLU/);
  assert.equal(report.fileName, 'GR502_GunlukKesilenFatura_TOPLAM.RPR');
});

test('GR700 — misafir fiyat listesi', () => {
  const report = findLegacyReport('GR700')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /Günlük Misafir Fiyat Listesi/);
  assert.match(text, /ABDULLA ALAMERI/);
  assert.match(text, /Listelenen 22/);
  assert.equal(report.fileName, 'GR700.RPR');
});

test('GRKASAISLEM — günlük kasa defteri', () => {
  const report = findLegacyReport('GRKASAISLEM')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /GÜNLÜK KASA DEFTERİ LİSTESİ/);
  assert.match(text, /14\.080,00/);
});

test('GR401N — net kasa işlem raporu', () => {
  const report = findLegacyReport('GR401N')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /CS2 - NET KASA İŞLEM RAPORU/);
  assert.match(text, /296\.461,96/);
});

test('GRFOLYOBAKIYE2 — folyo bakiye listesi', () => {
  const report = findLegacyReport('GRFOLYOBAKIYE2')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /FOLYO BAKİYE LİSTESİ/);
  assert.match(text, /Listelenen 23/);
});

test('MASTERFOLYOKONTORL — master folyo kontrol', () => {
  const report = findLegacyReport('MASTERFOLYOKONTORL')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /MASTER FOLYO KONTROL LISTESI/);
  assert.match(text, /6923372004/);
});

test('RGC — ayrılış odaları özeti', () => {
  const report = findLegacyReport('RGC')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /Ayrıl 404/);
  assert.match(text, /Listelenen 6/);
});
