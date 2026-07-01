import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { findLegacyReport } from './eod-legacy-catalog';
import {
  buildLiveDeptRevenueRows,
  buildLiveDeptTxRows,
  buildLiveDepartureRoomRows,
  buildLiveFolioExtreRows,
  buildLiveGuestPriceRows,
  buildLiveHkRows,
  buildLiveMainCurrentRows,
  buildLiveMasterFolioGroups,
  buildLiveMgmtSummary,
  buildLiveNetKasaRows,
  buildLiveOfficialGuestRows,
  buildLivePoliceRows,
  buildLiveRoomChangeRows,
  buildLiveStockRows,
  buildLiveCumulativeDeptRows,
  liveInHouse,
} from './eod-legacy-live';
import { renderLegacyEodReport } from './eod-legacy-render';

const ctx = {
  hotelName: 'HOTELSAPPHIRE',
  businessDate: '2026-06-27',
  userName: 'OGUZHAN',
  generatedAt: new Date('2026-06-28T03:52:58'),
  reservations: DEMO_RESERVATIONS,
  folioBalances: { 'rez-13': 4200 },
};

test('live — konaklayan misafirler', () => {
  const guests = liveInHouse(ctx);
  assert.ok(guests.length >= 4);
  assert.ok(guests.every((g) => g.status === 'CHECKED_IN'));
});

test('live — folyo extre satırları', () => {
  const rows = buildLiveFolioExtreRows(ctx);
  assert.ok(rows.length > 0);
  assert.match(rows[0]!.guest, /.+/);
});

test('live — yönetim özeti', () => {
  const mgmt = buildLiveMgmtSummary(ctx);
  assert.ok(mgmt);
  assert.ok(mgmt!.inHouse >= 4);
  assert.match(mgmt!.occupancyPct, /^%/);
});

test('live — GR500 kasa canlı veri', () => {
  const report = findLegacyReport('GR500')!;
  const text = renderLegacyEodReport(report, {
    ...ctx,
    finance: {
      businessDate: '2026-06-27',
      cashEntries: [
        {
          id: 'ce-1',
          time: '09:12',
          register: 'Ana Kasa',
          type: 'tahsilat',
          description: 'Oda 104 — konaklama tahsilatı',
          amount: 5200,
          currency: 'TRY',
          user: 'Arda Y.',
        },
      ],
      invoices: [],
      fxExchanges: [],
      stockItems: [],
    },
  });
  assert.match(text, /Oda 104/);
  assert.match(text, /Listelenen 1/);
});

test('live — GR300 canlı veri', () => {
  const report = findLegacyReport('GR300')!;
  const text = renderLegacyEodReport(report, ctx);
  const priceRows = buildLiveGuestPriceRows(ctx);
  if (priceRows.length > 0) {
    assert.match(text, new RegExp(priceRows[0]!.guest.slice(0, 8)));
  }
  assert.doesNotMatch(text, /Bu rapor Elektra/);
});

const financeCtx = {
  ...ctx,
  finance: {
    businessDate: '2026-06-27',
    cashEntries: [
      {
        id: 'ce-1',
        time: '09:12',
        register: 'Ana Kasa',
        type: 'tahsilat' as const,
        description: 'Oda 104 — konaklama tahsilatı',
        amount: 5200,
        currency: 'TRY' as const,
        user: 'Arda Y.',
      },
    ],
    invoices: [
      {
        id: 'inv-1',
        no: 'F-2026-0999',
        date: '2026-06-27',
        guest: 'Test Misafir',
        amount: 1250,
        status: 'paid',
        type: 'invoice',
      },
    ],
    fxExchanges: [],
    stockItems: [],
  },
};

test('live — GR401N net kasa canlı veri', () => {
  const rows = buildLiveNetKasaRows(financeCtx);
  assert.equal(rows.length, 1);
  assert.match(rows[0]!.note, /ODA|104/);

  const report = findLegacyReport('GR401N')!;
  const text = renderLegacyEodReport(report, financeCtx);
  assert.match(text, /TAHSİLAT/);
  assert.match(text, /Listelenen 1/);
});

test('live — GR502 fatura kontrol canlı veri', () => {
  const report = findLegacyReport('GR502')!;
  const text = renderLegacyEodReport(report, financeCtx);
  assert.match(text, /F-2026-099/);
  assert.match(text, /TEST MISAFIR/);
});

test('live — GR501 departman gelir folyo', () => {
  const deptRows = buildLiveDeptRevenueRows(ctx);
  assert.ok(deptRows.length > 0);
  assert.ok(deptRows.some((r) => r.dept.includes('ROOM')));

  const report = findLegacyReport('GR501')!;
  const text = renderLegacyEodReport(report, ctx);
  assert.match(text, /01 ROOM/);
});

test('live — GR602 fatura toplam canlı veri', () => {
  const report = findLegacyReport('GR602')!;
  const text = renderLegacyEodReport(report, financeCtx);
  assert.match(text, /KESİLEN FATURA/);
  assert.match(text, /1.250,00/);
});

test('live — GR503 krediye kaldırılan city ledger', () => {
  const creditCtx = {
    ...financeCtx,
    finance: {
      ...financeCtx.finance,
      invoices: [
        {
          id: 'inv-cl',
          no: 'CL-1001',
          date: '2026-06-27',
          guest: 'Fatma Kaya',
          amount: 5200,
          status: 'issued',
          type: 'konaklama',
          companyName: 'ACME CORP',
        },
      ],
    },
  };
  const report = findLegacyReport('GR503')!;
  const text = renderLegacyEodReport(report, creditCtx);
  assert.match(text, /CL-1001/);
  assert.match(text, /ACME|FATMA KAYA/);
});

test('live — GR401 bilanço canlı veri', () => {
  const report = findLegacyReport('GR401')!;
  const text = renderLegacyEodReport(report, ctx);
  assert.match(text, /99 GENEL TOPLAM/);
  assert.match(text, /01 ROOM/);
});

test('live — GR602F faturalı kesilmeyen taslak', () => {
  const draftCtx = {
    ...financeCtx,
    finance: {
      ...financeCtx.finance,
      invoices: [
        {
          id: 'inv-draft',
          no: 'DR-001',
          date: '2026-06-27',
          guest: 'Draft Guest',
          amount: 900,
          status: 'draft',
          type: 'ekstra',
        },
      ],
    },
  };
  const report = findLegacyReport('GR602F')!;
  const text = renderLegacyEodReport(report, draftCtx);
  assert.match(text, /DR-001/);
  assert.match(text, /DRAFT GUEST/);
});

test('live — GR350 main current konaklayan folyo', () => {
  const rows = buildLiveMainCurrentRows(ctx);
  assert.ok(rows.length >= 4);
  assert.ok(rows.some((r) => r.name.includes('FATMA')));

  const report = findLegacyReport('GR350')!;
  const text = renderLegacyEodReport(report, ctx);
  assert.match(text, /FATMA KAYA/);
  assert.doesNotMatch(text, /Marina Terranova/);
});

test('live — GR701 resmi müşteri fatura', () => {
  const officialCtx = {
    ...financeCtx,
    finance: {
      ...financeCtx.finance,
      invoices: [
        {
          id: 'inv-off',
          no: 'F-2026-1000',
          date: '2026-06-27',
          guest: 'Kurum',
          amount: 8500,
          status: 'issued',
          type: 'konaklama',
          companyName: 'T.C. Kültür ve Turizm Bakanlığı',
        },
      ],
    },
  };
  const rows = buildLiveOfficialGuestRows(officialCtx);
  assert.equal(rows.length, 1);
  assert.match(rows[0]!.guest, /KÜLTÜR/);

  const report = findLegacyReport('GR701')!;
  const text = renderLegacyEodReport(report, officialCtx);
  assert.match(text, /KÜLTÜR/);
  assert.match(text, /Listelenen 1/);
});

test('live — GRMAL stok canlı veri', () => {
  const stockCtx = {
    ...ctx,
    finance: {
      businessDate: '2026-06-27',
      cashEntries: [],
      invoices: [],
      fxExchanges: [],
      stockItems: [
        {
          id: 'st-1',
          sku: 'COLA330',
          name: 'Coca Cola 330ml',
          category: '11 Otomat',
          unit: 'adet',
          qty: 24,
          unitCost: 20,
        },
      ],
    },
  };
  const rows = buildLiveStockRows(stockCtx);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.amount, 480);

  const report = findLegacyReport('GRMAL')!;
  const text = renderLegacyEodReport(report, stockCtx);
  assert.match(text, /COCA COLA/);
  assert.match(text, /480,00/);
});

test('live — MASTERFOLYOKONTORL voucher grubu', () => {
  const sharedVoucher = 'GRP-9922004';
  const groupCtx = {
    ...ctx,
    reservations: ctx.reservations.map((r) =>
      r.id === 'rez-14' || r.id === 'rez-15'
        ? { ...r, extraData: { ...r.extraData, voucherNo: sharedVoucher, masterFolioNo: sharedVoucher } }
        : r,
    ),
  };
  const groups = buildLiveMasterFolioGroups(groupCtx);
  assert.equal(groups.length, 1);
  assert.equal(groups[0]!.rows.length, 2);

  const report = findLegacyReport('MASTERFOLYOKONTORL')!;
  const text = renderLegacyEodReport(report, groupCtx);
  assert.match(text, /GRP-9922004/);
  assert.match(text, /HANS WEBER|SARAH JOHNSON/);
});

test('live — GR220 HK oda durumu', () => {
  const rows = buildLiveHkRows(ctx);
  assert.ok(rows.length > 4);
  assert.ok(rows.some((r) => r.room === '104' && r.guest.includes('FATMA')));

  const report = findLegacyReport('GR220')!;
  const text = renderLegacyEodReport(report, ctx);
  assert.match(text, /FATMA KAYA/);
  assert.doesNotMatch(text, /ABDULLA ALAMERI/);
});

test('live — GR221 oda değişim planı', () => {
  const changeCtx = {
    ...ctx,
    businessDate: '2026-06-27',
    reservations: ctx.reservations.map((r) =>
      r.id === 'rez-14'
        ? {
            ...r,
            extraData: {
              ...r.extraData,
              plannedRoomNo: '207',
              roomChangeDate: '2026-06-27',
              roomChangeTime: '14:22',
              roomChangeNotes: 'Deniz manzarası',
            },
          }
        : r,
    ),
  };
  const rows = buildLiveRoomChangeRows(changeCtx);
  assert.equal(rows.length, 1);
  assert.match(rows[0]!.guest, /HANS/);

  const report = findLegacyReport('GR221')!;
  const text = renderLegacyEodReport(report, changeCtx);
  assert.match(text, /HANS WEBER/);
  assert.match(text, /207/);
});

test('live — RGC bugün çıkış odaları', () => {
  const depCtx = { ...ctx, businessDate: '2026-06-21' };
  const rows = buildLiveDepartureRoomRows(depCtx);
  assert.ok(rows.some((r) => r.label.includes('205')));

  const report = findLegacyReport('RGC')!;
  const text = renderLegacyEodReport(report, depCtx);
  assert.match(text, /Ayrıl 205/);
  assert.doesNotMatch(text, /Ayrıl 404/);
});

test('live — GR302K kümülatif dept canlı veri', () => {
  const rows = buildLiveCumulativeDeptRows(ctx);
  assert.ok(rows.length > 0);
  assert.ok(rows.some((r) => r.dept.includes('ROOM')));

  const report = findLegacyReport('GR302K')!;
  const text = renderLegacyEodReport(report, ctx);
  assert.match(text, /01 ROOM/);
  assert.match(text, /01-27\.06/);
  assert.doesNotMatch(text, /892450/);
});

test('live — GR222 polis listesi konaklayan', () => {
  const rows = buildLivePoliceRows(ctx);
  assert.ok(rows.length >= 4);
  assert.ok(rows.some((r) => r.last.includes('KAYA') || r.first.includes('FATMA')));

  const report = findLegacyReport('GR222')!;
  const text = renderLegacyEodReport(report, ctx);
  assert.match(text, /FATMA|KAYA/);
  assert.match(text, /Listelenen 4|Listelenen 5|Listelenen 6/);
  assert.doesNotMatch(text, /ABDULLA ALAMERI/);
});

test('live — GR222 EGM kimlik kaydı', () => {
  const egmCtx = {
    ...ctx,
    egmRecords: [
      {
        id: 'egm-1',
        reservationId: 'rez-13',
        refNo: '13',
        guestName: 'Fatma Kaya',
        firstName: 'Fatma',
        lastName: 'Kaya',
        roomNo: '104',
        nationality: 'TR',
        idNo: '12345678901',
        idType: 'TCKN' as const,
        birthDate: '1990-05-12',
        birthPlace: 'Antalya',
        fatherName: 'Mehmet',
        motherName: 'Ayşe',
        checkIn: '2026-06-17',
        checkOut: '2026-06-20',
        status: 'ready' as const,
        createdAt: '2026-06-17T10:00:00Z',
      },
    ],
  };
  const rows = buildLivePoliceRows(egmCtx);
  const fatma = rows.find((r) => r.room === '104');
  assert.ok(fatma);
  assert.equal(fatma!.id, '12345678901');
  assert.match(fatma!.birthPlace, /ANTALYA/);

  const report = findLegacyReport('GR222')!;
  const text = renderLegacyEodReport(report, egmCtx);
  assert.match(text, /12345678901/);
  assert.match(text, /MEHMET/);
});

test('live — GR310 departman işlem folyo', () => {
  const rows = buildLiveDeptTxRows(ctx);
  assert.ok(rows.length > 0);
  assert.ok(rows.some((r) => r.deptName === 'ROOM'));

  const report = findLegacyReport('GR310')!;
  const text = renderLegacyEodReport(report, ctx);
  assert.match(text, /Grup : 01 \(ROOM\)/);
  assert.match(text, /Listelenen/);
  assert.doesNotMatch(text, /OF-32340.*BOOKING-N/);
});
