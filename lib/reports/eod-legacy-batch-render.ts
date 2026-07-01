import type { EodLegacyReportDef } from './eod-legacy-catalog';
import {
  buildLiveBilancoRows,
  buildLiveCashRows,
  buildLiveCityLedgerInvoices,
  buildLiveCreditInvoiceRows,
  buildLiveCumulativeDeptRows,
  buildLiveCustomerRows,
  buildLiveDailyInvoiceRows,
  buildLiveDailyTxRows,
  buildLiveDeptRevenueRows,
  buildLiveDeptTxRows,
  buildLiveDepartureRoomRows,
  buildLiveDiscountRefundRows,
  buildLiveFolioBalanceRows,
  buildLiveFolioExtreRows,
  buildLiveFolioAuditRows,
  buildLiveFolioCorrectionRows,
  buildLiveFolioTransferRows,
  buildLiveEmailGuestRows,
  buildLiveFxRows,
  buildLiveGuestPriceRows,
  buildLiveHkRows,
  buildLiveInvoiceControlRows,
  buildLiveInvoiceTotals,
  buildLiveKasaLedgerRows,
  buildLiveMainCurrentRows,
  buildLiveMasterFolioGroups,
  buildLiveMgmtSummary,
  buildLiveNetKasaRows,
  buildLiveOfficialGuestRows,
  buildLivePoliceRows,
  buildLiveRoomChangeRows,
  buildLiveStockRows,
  buildLiveUnbilledInvoiceRows,
  liveVipGuests,
  type NetKasaRow,
} from './eod-legacy-live';
import type { LegacyRenderContext } from './eod-legacy-render-utils';
import {
  pad,
  fmtMoney,
  fmtFullDate,
  fmtShortDate,
  reportHeader,
  reportHeaderRoomPrice,
} from './eod-legacy-render-utils';

function emptyReport(ctx: LegacyRenderContext, title: string, headerLine: string, footer = 'Listelenen 0'): string {
  return [
    ...reportHeaderRoomPrice(ctx, title),
    headerLine,
    '-'.repeat(118),
    '',
    pad(footer, 24),
  ].join('\n');
}

// ── GR222 Günlük Polis Listesi ──────────────────────────────────────────────

const DEMO_POLICE = [
  { room: '208', id: '', first: 'ABDULLA', last: 'ALAMERI', birthPlace: 'RIYADH', birth: '15.03.1985', father: 'IBRAHIM', mother: 'FATIMA', idType: 'PASAPORT', serial: 'P1234567', nat: 'SAU' },
  { room: '213', id: '', first: 'TATIANA', last: 'MACHULA', birthPlace: 'MOSKVA', birth: '22.07.1990', father: 'IVAN', mother: 'ELENA', idType: 'PASAPORT', serial: '72 1234567', nat: 'RUS' },
  { room: '301', id: '', first: 'MUSTAFA', last: 'BAYBAGAN', birthPlace: 'ANKARA', birth: '10.01.1978', father: 'AHMET', mother: 'ZEYNEP', idType: 'NÜFUS CÜZDANI', serial: 'A12B34567', nat: 'TC' },
  { room: '401', id: '', first: 'ILDAR', last: 'VALIULIN', birthPlace: 'KAZAN', birth: '05.11.1982', father: 'RUSTAM', mother: 'GULNARA', idType: 'PASAPORT', serial: '76 9876543', nat: 'RUS' },
  { room: '411', id: '', first: 'FATMA', last: 'LAJPURIA', birthPlace: 'LAHORE', birth: '18.09.1975', father: 'MOHAMMED', mother: 'AISHA', idType: 'PASAPORT', serial: 'PK9876543', nat: 'GBR' },
];

function renderGr222(ctx: LegacyRenderContext): string {
  const live = buildLivePoliceRows(ctx);
  const data = live.length > 0 ? live : DEMO_POLICE;
  const header =
    pad('Oda No', 7) +
    pad('TC Kimlik No', 14) +
    pad('Ad', 14) +
    pad('Soyad', 16) +
    pad('Doğum Yeri', 12) +
    pad('Doğum Tarihi', 13) +
    pad('Baba Adı', 12) +
    pad('Anne Adı', 12) +
    pad('Kimlik Türü', 14) +
    pad('K. Seri No', 12) +
    'Uyruk';
  const lines = [...reportHeaderRoomPrice(ctx, 'Günlük Polis Listesi'), header, '-'.repeat(130)];
  for (const r of data) {
    lines.push(
      pad(r.room, 7) +
        pad(r.id, 14) +
        pad(r.first, 14) +
        pad(r.last, 16) +
        pad(r.birthPlace, 12) +
        pad(r.birth, 13) +
        pad(r.father, 12) +
        pad(r.mother, 12) +
        pad(r.idType, 14) +
        pad(r.serial, 12) +
        r.nat,
    );
  }
  lines.push('', '-'.repeat(130), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR303 Folyo Düzeltme ───────────────────────────────────────────────────

function renderGr303(ctx: LegacyRenderContext): string {
  const live = buildLiveFolioCorrectionRows(ctx);
  const header =
    pad('DEP.', 5) +
    pad('DEPARTMAN', 12) +
    pad('SAAT', 7) +
    pad('ODA NO', 7) +
    pad('MİSAFİR 1', 22) +
    pad('FOLYO NO', 10) +
    pad('ÖDEYEN', 10) +
    pad('TOPLAM', 12, 'right') +
    pad('YETKİLİ', 10) +
    'AÇIKLAMA';
  const lines = [...reportHeaderRoomPrice(ctx, 'FOLYO DÜZELTME LİSTESİ'), header, '-'.repeat(118)];
  if (live.length === 0) {
    lines.push('', pad('Listelenen 0', 24));
    return lines.join('\n');
  }
  for (const r of live) {
    lines.push(
      pad(r.dept, 5) +
        pad(r.deptName, 12) +
        pad(r.time, 7) +
        pad(r.room, 7) +
        pad(r.guest, 22) +
        pad(r.folio, 10) +
        pad(r.payer, 10) +
        pad(fmtMoney(r.total), 12, 'right') +
        pad(r.user, 10) +
        r.note,
    );
  }
  lines.push('', '-'.repeat(118), pad(`Listelenen ${live.length}`, 24));
  return lines.join('\n');
}

// ── GR310 Günlük Departman İşlem ───────────────────────────────────────────

type DeptTx = { deptNo: string; deptName: string; revGroup: string; agency: string; room: string; pax: string; folio: string; time: string; doc: string; user: string; total: number };

const DEMO_DEPT_TX: DeptTx[] = [
  { deptNo: '01', deptName: 'ROOM', revGroup: 'ODA', agency: 'BOOKING-N', room: '208', pax: '1', folio: 'F-20801', time: '00:04', doc: 'OF-32340', user: 'OĞUZHAN', total: 5343 },
  { deptNo: '01', deptName: 'ROOM', revGroup: 'ODA', agency: 'BOOKING C', room: '213', pax: '2', folio: 'F-21301', time: '00:04', doc: 'OF-32341', user: 'OĞUZHAN', total: 4750 },
  { deptNo: '11', deptName: 'OTOMAT', revGroup: 'İÇECEK', agency: '', room: 'T9999', pax: '', folio: 'F-T9999', time: '00:04', doc: 'OF-32345', user: 'OĞUZHAN', total: 80 },
  { deptNo: '90', deptName: 'CASH', revGroup: 'ODA', agency: '', room: '401', pax: '1', folio: 'F-40101', time: '10:14', doc: 'OF-32346', user: 'OĞUZHAN', total: -5000 },
  { deptNo: '90', deptName: 'CASH', revGroup: 'ODA', agency: '', room: '411', pax: '1', folio: 'F-41101', time: '18:22', doc: 'OF-32347', user: 'HALİT', total: -9000 },
  { deptNo: '92', deptName: 'C.LEDGER', revGroup: 'İÇECEK', agency: '', room: 'T9999', pax: '', folio: 'F-T9999', time: '00:04', doc: 'OF-32348', user: 'OĞUZHAN', total: -80 },
];

function renderDeptTxRow(r: DeptTx): string {
  return (
    pad(r.deptNo, 5) +
    pad(r.deptName, 12) +
    pad(r.revGroup, 10) +
    pad(r.agency, 12) +
    pad(r.room, 6) +
    pad(r.pax, 5, 'right') +
    pad(r.folio, 10) +
    pad(r.time, 7) +
    pad(r.doc, 10) +
    pad(r.user, 10) +
    pad(fmtMoney(r.total), 12, 'right')
  );
}

function renderGr310(ctx: LegacyRenderContext): string {
  const live = buildLiveDeptTxRows(ctx);
  const data = live.length > 0 ? live : DEMO_DEPT_TX;
  const header =
    pad('Dep No', 6) +
    pad('Departman Adı', 14) +
    pad('Gelir Grubu', 12) +
    pad('Acenta', 12) +
    pad('Oda No', 7) +
    pad('Kişi', 5, 'right') +
    pad('Folyo No', 10) +
    pad('Saat', 7) +
    pad('Evrak No', 10) +
    pad('Kaydeden', 10) +
    pad('Toplam', 12, 'right');
  const lines = [...reportHeaderRoomPrice(ctx, 'Günlük Departman İşlem Listesi'), header, '-'.repeat(118)];
  const groups = new Map<string, DeptTx[]>();
  for (const row of data) {
    const key = `${row.deptNo} (${row.deptName})`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  for (const [group, rows] of groups) {
    lines.push(pad(`Grup : ${group}`, 118));
    lines.push(...rows.map(renderDeptTxRow));
    const sub = rows.reduce((s, r) => s + r.total, 0);
    lines.push(pad(`Adet: ${rows.length}`, 94) + pad(fmtMoney(sub), 12, 'right'), '');
  }
  lines.push('-'.repeat(118), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR350 Main Current ─────────────────────────────────────────────────────

const DEMO_MAIN_CURRENT = [
  { name: 'Marina Terranova', opening: -16685.32, room: 0, fb: 0, other: 0, total: 0, collected: 0, credit: 0, discount: 0, closing: -16685.32 },
  { name: 'Ahmad Tamim Tarin', opening: -12450.0, room: 0, fb: 0, other: 0, total: 0, collected: 0, credit: 0, discount: 0, closing: -12450.0 },
  { name: 'SELİM EROĞLU', opening: -8750.5, room: 0, fb: 0, other: 0, total: 0, collected: 0, credit: 0, discount: 0, closing: -8750.5 },
];

function renderGr350(ctx: LegacyRenderContext): string {
  const live = buildLiveMainCurrentRows(ctx);
  const data =
    live.length > 0
      ? live.map((r) => ({
          name: r.name,
          opening: r.opening,
          room: r.roomRev,
          fb: r.fbRev,
          other: r.otherRev,
          total: r.total,
          collected: r.collected,
          credit: r.credit,
          discount: r.discount,
          closing: r.closing,
        }))
      : DEMO_MAIN_CURRENT;
  const header =
    pad('ODANO', 7) +
    pad('ADI1', 24) +
    pad('DDEVIR', 12, 'right') +
    pad('ODAGELIR', 10, 'right') +
    pad('FBGELIR', 10, 'right') +
    pad('DGELIR', 10, 'right') +
    pad('TOPLAM', 10, 'right') +
    pad('TAHSILAT', 10, 'right') +
    pad('KREDI', 10, 'right') +
    pad('INDIRIM', 10, 'right') +
    pad('YDEVIR', 12, 'right');
  const lines = [...reportHeaderRoomPrice(ctx, 'MAIN CURRENT RAPORU'), header, '-'.repeat(118)];
  for (const r of data) {
    lines.push(
      pad('', 7) +
        pad(r.name, 24) +
        pad(fmtMoney(r.opening), 12, 'right') +
        pad(fmtMoney(r.room), 10, 'right') +
        pad(fmtMoney(r.fb), 10, 'right') +
        pad(fmtMoney(r.other), 10, 'right') +
        pad(fmtMoney(r.total), 10, 'right') +
        pad(fmtMoney(r.collected), 10, 'right') +
        pad(fmtMoney(r.credit), 10, 'right') +
        pad(fmtMoney(r.discount), 10, 'right') +
        pad(fmtMoney(r.closing), 12, 'right'),
    );
  }
  lines.push('', '-'.repeat(118), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR401N Net Kasa ────────────────────────────────────────────────────────

function formatNetKasaRow(r: NetKasaRow): string {
  return (
    pad(r.date, 11) +
    pad(r.time, 7) +
    pad(r.dept, 6) +
    pad(r.name, 12) +
    pad(r.authorized, 10) +
    pad(r.room === '—' ? '' : r.room, 7) +
    pad(r.entryNo, 8) +
    pad(r.note, 16) +
    pad(r.kind, 10) +
    pad(r.fxCode, 10) +
    pad(fmtMoney(r.amount), 12, 'right') +
    pad(fmtMoney(r.tlAmount), 12, 'right') +
    pad('1,00', 8, 'right')
  );
}

function renderNetKasaReport(ctx: LegacyRenderContext, title: string, live: NetKasaRow[]): string {
  const header =
    pad('Tarih', 11) +
    pad('Saat', 7) +
    pad('Dept.', 6) +
    pad('Adi', 12) +
    pad('Yetkili', 10) +
    pad('OdaNo', 7) +
    pad('ENo', 8) +
    pad('AÇIKLAMA', 16) +
    pad('İslem', 10) +
    pad('DövizKodu', 10) +
    pad('Tutar', 12, 'right') +
    pad('TLTutar', 12, 'right') +
    pad('KUR', 8, 'right');
  const lines = [...reportHeaderRoomPrice(ctx, title), header, '-'.repeat(118)];

  const groups = new Map<string, NetKasaRow[]>();
  for (const r of live) {
    const g = groups.get(r.currencyGroup) ?? [];
    g.push(r);
    groups.set(r.currencyGroup, g);
  }

  let totalTl = 0;
  for (const [groupName, rows] of groups) {
    lines.push(pad(groupName, 118));
    for (const r of rows) {
      totalTl += r.tlAmount;
      lines.push(formatNetKasaRow(r));
    }
  }
  lines.push('', '-'.repeat(118), pad('', 82) + pad(fmtMoney(totalTl), 12, 'right'), pad(`Listelenen ${live.length}`, 24));
  return lines.join('\n');
}

function renderGr401N(ctx: LegacyRenderContext): string {
  const live = buildLiveNetKasaRows(ctx);
  if (live.length > 0) {
    return renderNetKasaReport(ctx, 'CS2 - NET KASA İŞLEM RAPORU', live);
  }

  const header =
    pad('Tarih', 11) +
    pad('Saat', 7) +
    pad('Dept.', 6) +
    pad('Adi', 12) +
    pad('Yetkili', 10) +
    pad('OdaNo', 7) +
    pad('ENo', 8) +
    pad('AÇIKLAMA', 16) +
    pad('İslem', 10) +
    pad('DövizKodu', 10) +
    pad('Tutar', 12, 'right') +
    pad('TLTutar', 12, 'right') +
    pad('KUR', 8, 'right');
  const lines = [...reportHeaderRoomPrice(ctx, 'CS2 - NET KASA İŞLEM RAPORU'), header, '-'.repeat(118)];
  lines.push(pad('Grup 90 (TL)', 118));
  lines.push(
    pad('27.06.2026', 11) +
      pad('00:04', 7) +
      pad('90', 6) +
      pad('CASH', 12) +
      pad('OĞUZHAN', 10) +
      pad('', 7) +
      pad('', 8) +
      pad('Günlük Otomatik Avans', 16) +
      pad('AVANS', 10) +
      pad('TL', 10) +
      pad(fmtMoney(0), 12, 'right') +
      pad(fmtMoney(0), 12, 'right') +
      pad('1,00', 8, 'right'),
  );
  lines.push(
    pad('27.06.2026', 11) +
      pad('10:14', 7) +
      pad('90', 6) +
      pad('CASH', 12) +
      pad('OĞUZHAN', 10) +
      pad('401', 7) +
      pad('E-4412', 8) +
      pad('ODA', 16) +
      pad('TAHSİLAT', 10) +
      pad('TL', 10) +
      pad(fmtMoney(5000), 12, 'right') +
      pad(fmtMoney(5000), 12, 'right') +
      pad('1,00', 8, 'right'),
  );
  lines.push(
    pad('27.06.2026', 11) +
      pad('18:22', 7) +
      pad('90', 6) +
      pad('CASH', 12) +
      pad('HALİT', 10) +
      pad('411', 7) +
      pad('E-4413', 8) +
      pad('ODA', 16) +
      pad('TAHSİLAT', 10) +
      pad('TL', 10) +
      pad(fmtMoney(9000), 12, 'right') +
      pad(fmtMoney(9000), 12, 'right') +
      pad('1,00', 8, 'right'),
  );
  lines.push(pad('Grup 94 (EURO)', 118));
  lines.push(pad('... 12 TAHSİLAT kaydı ...', 118));
  lines.push('', '-'.repeat(118), pad('', 82) + pad(fmtMoney(296461.96), 12, 'right'), pad('Listelenen 15', 24));
  return lines.join('\n');
}

function renderGr401K(ctx: LegacyRenderContext): string {
  const live = buildLiveNetKasaRows(ctx);
  if (live.length > 0) {
    return renderNetKasaReport(ctx, 'CS1 - BRÜT KASA İŞLEM RAPORU', live);
  }
  return renderGr401N(ctx).replace('CS2 - NET KASA İŞLEM RAPORU', 'CS1 - BRÜT KASA İŞLEM RAPORU').replace('296.461,96', '312.580,40');
}

// ── GR402 Döviz Bozdurma ───────────────────────────────────────────────────

function renderGr402(ctx: LegacyRenderContext): string {
  const live = buildLiveFxRows(ctx);
  const header =
    pad('Oda No', 7) +
    pad('Sıra No', 7) +
    pad('Tarih', 11) +
    pad('Alınan', 8) +
    pad('Tutar', 12, 'right') +
    pad('Verilen', 8) +
    pad('Tutar', 12, 'right') +
    pad('Yetkili', 10) +
    pad('EvrakNo', 10) +
    pad('TL Tutar', 12, 'right');

  if (live.length === 0) {
    return emptyReport(ctx, 'DÖVİZ BOZDURMA LİSTESİ', header);
  }

  const lines = [...reportHeaderRoomPrice(ctx, 'DÖVİZ BOZDURMA LİSTESİ'), header, '-'.repeat(118)];
  for (const r of live) {
    lines.push(
      pad(r.room, 7) +
        pad(String(r.rowNo), 7) +
        pad(r.date, 11) +
        pad(r.received, 8) +
        pad(fmtMoney(r.receivedAmt), 12, 'right') +
        pad(r.given, 8) +
        pad(fmtMoney(r.givenAmt), 12, 'right') +
        pad(r.user, 10) +
        pad(r.docNo, 10) +
        pad(fmtMoney(r.tlAmount), 12, 'right'),
    );
  }
  lines.push('', '-'.repeat(118), pad(`Listelenen ${live.length}`, 24));
  return lines.join('\n');
}

// ── GR502 Fatura Kontrol ───────────────────────────────────────────────────

function renderGr502(ctx: LegacyRenderContext): string {
  const live = buildLiveInvoiceControlRows(ctx);
  const header =
    pad('DEPT', 5) +
    pad('TUTAR', 12, 'right') +
    pad('DTUTAR', 12, 'right') +
    pad('DOVIZKODU', 10) +
    pad('FATNO', 10) +
    pad('NOTE', 8) +
    pad('ÖŞEKLI', 14) +
    'ADI';

  if (live.length > 0) {
    const lines = [...reportHeaderRoomPrice(ctx, 'FATURA KONTROL LİSTESİ'), header, '-'.repeat(118)];
    const groups = new Map<string, typeof live>();
    for (const r of live) {
      const g = groups.get(r.currencyGroup) ?? [];
      g.push(r);
      groups.set(r.currencyGroup, g);
    }
    for (const [groupName, rows] of groups) {
      lines.push(pad(groupName, 118));
      for (const r of rows) {
        lines.push(
          pad(r.dept, 5) +
            pad(fmtMoney(r.amount), 12, 'right') +
            pad(fmtMoney(r.foreignAmount), 12, 'right') +
            pad(r.fxCode, 10) +
            pad(r.invNo, 10) +
            pad(r.note, 8) +
            pad(r.paymentMethod, 14) +
            r.guestName,
        );
      }
    }
    lines.push('', '-'.repeat(118), pad(`Listelenen ${live.length}`, 24));
    return lines.join('\n');
  }

  const lines = [...reportHeaderRoomPrice(ctx, 'FATURA KONTROL LİSTESİ'), header, '-'.repeat(118)];
  lines.push(pad('Grup 90 (TL)', 118));
  lines.push(
    pad('90', 5) +
      pad(fmtMoney(1250), 12, 'right') +
      pad(fmtMoney(1250), 12, 'right') +
      pad('TL', 10) +
      pad('F-0891', 10) +
      pad('', 8) +
      pad('CASH', 14) +
      'SELİM EROĞLU',
  );
  lines.push(
    pad('90', 5) +
      pad(fmtMoney(1250), 12, 'right') +
      pad(fmtMoney(1250), 12, 'right') +
      pad('TL', 10) +
      pad('F-0892', 10) +
      pad('', 8) +
      pad('CASH', 14) +
      'EMİN SALİH ERGİN',
  );
  lines.push(pad('Grup 94 (EURO)', 118));
  lines.push(pad('FATMA BIBI LAJPURIA — NON-CREDIT CARD', 118));
  lines.push(pad('LUMINITA ALEXANDRU — NON-CREDIT CARD', 118));
  lines.push(pad('Grup 95 (USD)', 118));
  lines.push(pad('SOTVALDIEV BOTIR — NON-CREDIT CARD', 118));
  lines.push('', '-'.repeat(118), pad('Listelenen 5', 24));
  return lines.join('\n');
}

// ── GR503 Krediye Kaldırılan ─────────────────────────────────────────────────

function renderGr503(ctx: LegacyRenderContext): string {
  const live = buildLiveCreditInvoiceRows(ctx);
  const header =
    pad('Fat.No', 10) +
    pad('Acenta', 12) +
    pad('Odano', 7) +
    pad('CITARIHI', 11) +
    pad('COTARIHI', 11) +
    pad('VBO', 8) +
    pad('Misafir', 22) +
    pad('Fatura Ttr.', 12, 'right') +
    pad('Folyo Ttr.', 12, 'right');

  if (live.length === 0) {
    return emptyReport(ctx, 'GÜNLÜK KREDİYE KALDIRILAN HESAPLAR LİSTESİ', header);
  }

  const lines = [...reportHeaderRoomPrice(ctx, 'GÜNLÜK KREDİYE KALDIRILAN HESAPLAR LİSTESİ'), header, '-'.repeat(118)];
  for (const r of live) {
    lines.push(
      pad(r.invNo, 10) +
        pad(r.agency, 12) +
        pad(r.room, 7) +
        pad(r.checkIn, 11) +
        pad(r.checkOut, 11) +
        pad(r.voucher, 8) +
        pad(r.guest, 22) +
        pad(fmtMoney(r.invoiceAmount), 12, 'right') +
        pad(fmtMoney(r.folioAmount), 12, 'right'),
    );
  }
  lines.push('', '-'.repeat(118), pad(`Listelenen ${live.length}`, 24));
  return lines.join('\n');
}

// ── GR700 / GRMAIL Misafir fiyat listesi ────────────────────────────────────

const DEMO_GR700 = [
  { no: 1, room: '208', agency: 'BOOKING-NRF', guest: 'ABDULLA ALAMERI', pax: 2, in: '27.06', out: '05.07', price: 3279, fno: '' },
  { no: 2, room: '213', agency: 'BOOKING.COM', guest: 'TATIANA MACHULA', pax: 2, in: '24.06', out: '01.07', price: 5343, fno: '' },
  { no: 3, room: '301', agency: 'W-INT TC', guest: 'MUSTAFA BAYBAĞAN', pax: 1, in: '27.06', out: '28.06', price: 2500, fno: '' },
  { no: 4, room: '401', agency: 'W.INT', guest: 'ILDAR VALIULIN', pax: 1, in: '26.06', out: '02.07', price: 4750, fno: '' },
  { no: 5, room: '411', agency: 'BOOKING ÖDE', guest: 'FATMA BIBI LAJPURIA', pax: 2, in: '25.06', out: '30.06', price: 4680, fno: '' },
];

function renderGuestPriceList(ctx: LegacyRenderContext, title: string, rows = DEMO_GR700): string {
  const header =
    pad('NO', 4) +
    pad('Oda', 6) +
    pad('Acenta', 14) +
    pad('Misafir', 24) +
    pad('Kişi', 5, 'right') +
    pad('Geliş', 8) +
    pad('Ayrılış', 8) +
    pad('Fiyat', 12, 'right') +
    'FNO';
  const lines = [...reportHeaderRoomPrice(ctx, title), header, '-'.repeat(90)];
  for (const r of rows) {
    lines.push(
      pad(String(r.no), 4) +
        pad(r.room, 6) +
        pad(r.agency, 14) +
        pad(r.guest, 24) +
        pad(String(r.pax), 5, 'right') +
        pad(r.in, 8) +
        pad(r.out, 8) +
        pad(fmtMoney(r.price), 12, 'right') +
        r.fno,
    );
  }
  lines.push('', '-'.repeat(90), pad(`Listelenen ${rows.length}`, 24));
  return lines.join('\n');
}

function renderGr700(ctx: LegacyRenderContext): string {
  const live = buildLiveGuestPriceRows(ctx);
  const fullRows =
    live.length > 0
      ? live
      : Array.from({ length: 22 }, (_, i) => {
          const base = DEMO_GR700[i % DEMO_GR700.length]!;
          return { ...base, no: i + 1, room: String(208 + i * 3) };
        });
  return renderGuestPriceList(ctx, 'Günlük Misafir Fiyat Listesi', fullRows);
}

function renderGrMail(ctx: LegacyRenderContext): string {
  const live = buildLiveEmailGuestRows(ctx);
  if (live.length > 0) {
    return renderGuestPriceList(ctx, 'E-Posta Misafir Listesi', live);
  }
  const header =
    pad('NO', 4) +
    pad('Oda', 6) +
    pad('Acenta', 14) +
    pad('Misafir', 24) +
    pad('Kişi', 5, 'right') +
    pad('Geliş', 8) +
    pad('Ayrılış', 8) +
    pad('Fiyat', 12, 'right') +
    'FNO';
  return emptyReport(ctx, 'E-Posta Misafir Listesi', header);
}

// ── GRKASAISLEM Günlük Kasa Defteri ─────────────────────────────────────────

function renderGrKasaIslem(ctx: LegacyRenderContext): string {
  const live = buildLiveKasaLedgerRows(ctx);
  const header =
    pad('DOVIZ', 6) +
    pad('DEPT', 5) +
    pad('ODA NO', 7) +
    pad('MAMUL', 22) +
    pad('SAAT', 7) +
    pad('AÇIKLAMA', 12) +
    pad('TUTAR', 12, 'right') +
    'YETKILI';
  const lines = [...reportHeaderRoomPrice(ctx, 'GÜNLÜK KASA DEFTERİ LİSTESİ'), header, '-'.repeat(90)];

  if (live.length > 0) {
    for (const r of live) {
      lines.push(
        pad(r.currency, 6) +
          pad('90', 5) +
          pad(r.room, 7) +
          pad(r.guest, 22) +
          pad(r.time, 7) +
          pad(r.desc, 12) +
          pad(fmtMoney(r.amount), 12, 'right') +
          r.user,
      );
    }
    const total = live.reduce((s, r) => s + r.amount, 0);
    lines.push('', '-'.repeat(90), pad('', 54) + pad(fmtMoney(total), 12, 'right'), pad(`Listelenen ${live.length}`, 24));
    return lines.join('\n');
  }

  lines.push(
    pad('TL', 6) +
      pad('90', 5) +
      pad('401', 7) +
      pad('MUSTAFA BAYBAĞAN', 22) +
      pad('10:14', 7) +
      pad('ODA', 12) +
      pad(fmtMoney(5000), 12, 'right') +
      'OĞUZHAN',
  );
  lines.push(
    pad('TL', 6) +
      pad('90', 5) +
      pad('411', 7) +
      pad('ILDAR VALIULIN', 22) +
      pad('18:22', 7) +
      pad('ODA', 12) +
      pad(fmtMoney(9000), 12, 'right') +
      'HALİT',
  );
  lines.push(pad('Grup 92', 90));
  lines.push(
    pad('TL', 6) +
      pad('92', 5) +
      pad('T9999', 7) +
      pad('CASH 27.06.2026', 22) +
      pad('00:04', 7) +
      pad('OTOMAT', 12) +
      pad(fmtMoney(80), 12, 'right') +
      'OĞUZHAN',
  );
  lines.push('', '-'.repeat(90), pad('', 54) + pad(fmtMoney(14080), 12, 'right'), pad('Listelenen 3', 24));
  return lines.join('\n');
}

// ── GRFOLYOBAKIYE2 ───────────────────────────────────────────────────────────

const DEMO_FOLIO_BALANCE = [
  { room: '208', agency: 'BOOKING-NRF', guest: 'ABDULLA ALAMERI', in: '27.06.2026', out: '05.07.2026', balance: -22851.64 },
  { room: '213', agency: 'BOOKING.COM', guest: 'TATIANA MACHULA', in: '24.06.2026', out: '01.07.2026', balance: -16030.4 },
  { room: '301', agency: 'W-INT TC', guest: 'MUSTAFA BAYBAĞAN', in: '27.06.2026', out: '28.06.2026', balance: -2500 },
];

function renderGrFolyoBakiye(ctx: LegacyRenderContext): string {
  const live = buildLiveFolioBalanceRows(ctx);
  const rows =
    live.length > 0
      ? live
      : Array.from({ length: 23 }, (_, i) => {
          const base = DEMO_FOLIO_BALANCE[i % DEMO_FOLIO_BALANCE.length]!;
          return { ...base, room: String(208 + i * 4) };
        });
  const header =
    pad('ODA NO', 7) +
    pad('ACENTA', 14) +
    pad('MİSAFİR ADI', 24) +
    pad('GELİŞ TARİHİ', 13) +
    pad('AYRILIŞ TARİHİ', 14) +
    pad('BAKİYE', 14, 'right');
  const lines = [...reportHeaderRoomPrice(ctx, 'FOLYO BAKİYE LİSTESİ'), header, '-'.repeat(90)];
  let total = 0;
  for (const r of rows) {
    total += r.balance;
    lines.push(
      pad(r.room, 7) +
        pad(r.agency, 14) +
        pad(r.guest, 24) +
        pad(r.in, 13) +
        pad(r.out, 14) +
        pad(fmtMoney(r.balance), 14, 'right'),
    );
  }
  lines.push('', '-'.repeat(90), pad('', 62) + pad(fmtMoney(total), 14, 'right'), pad(`Listelenen ${rows.length}`, 24));
  return lines.join('\n');
}

// ── MASTERFOLYOKONTORL ───────────────────────────────────────────────────────

function renderMasterFolyo(ctx: LegacyRenderContext): string {
  const liveGroups = buildLiveMasterFolioGroups(ctx);
  const header =
    pad('ODANO', 7) +
    pad('VNO', 12) +
    pad('ACENTAKODU', 14) +
    pad('MISAFIRADI', 24) +
    pad('CITARIHI', 11) +
    pad('COUTTARIHI', 11) +
    pad('HNO', 10) +
    'MASTER FOLYONO';
  const lines = [...reportHeaderRoomPrice(ctx, 'MASTER FOLYO KONTROL LISTESI'), header, '-'.repeat(118)];

  if (liveGroups.length > 0) {
    let total = 0;
    for (const group of liveGroups) {
      lines.push(pad(`Grup : ${group.groupKey}`, 118));
      for (const r of group.rows) {
        total += 1;
        lines.push(
          pad(r.room, 7) +
            pad(r.voucher, 12) +
            pad(r.agency, 14) +
            pad(r.guest, 24) +
            pad(r.checkIn, 11) +
            pad(r.checkOut, 11) +
            pad(r.accountNo, 10) +
            r.masterFolioNo,
        );
      }
    }
    lines.push('', '-'.repeat(118), pad(`Listelenen ${total}`, 24));
    return lines.join('\n');
  }

  lines.push(pad('Grup : 6923372004', 118));
  const guests = ['ABDULLA ALAMERI', 'IVAN TELGUZOV', 'ALI AZZAM', 'MATTEO ZANDONA', 'TATIANA MACHULA'];
  for (const g of guests) {
    lines.push(
      pad('208', 7) +
        pad('6923372004', 12) +
        pad('BOOKING-NRF', 14) +
        pad(g, 24) +
        pad('27.06.2026', 11) +
        pad('05.07.2026', 11) +
        pad('H-20801', 10) +
        '6923372004',
    );
  }
  lines.push('', '-'.repeat(118), pad(`Listelenen ${guests.length}`, 24));
  return lines.join('\n');
}

// ── RGC Ayrılış odaları ──────────────────────────────────────────────────────

function renderRgc(ctx: LegacyRenderContext): string {
  const live = buildLiveDepartureRoomRows(ctx);
  const rooms =
    live.length > 0
      ? live
      : ['404', '408', '409', '412', '415', '418'].map((room) => ({ label: `Ayrıl ${room}`, count: 1 }));
  const lines = [
    ...reportHeader(ctx, 'Ayrılış Odaları Özeti'),
    pad('Oda', 12) + pad('Adet', 8, 'right'),
    '-'.repeat(24),
  ];
  for (const row of rooms) {
    lines.push(pad(row.label, 12) + pad('1,00', 8, 'right'));
  }
  lines.push('', pad(`Adet : ${rooms.length}`, 24), pad(`Listelenen ${rooms.length}`, 24));
  return lines.join('\n');
}

// ── GR300 Folyo Extre Listesi ────────────────────────────────────────────────

type FolioExtreRow = {
  folio: string;
  room: string;
  guest: string;
  type: string;
  desc: string;
  amount: number;
  balance: number;
  user: string;
};

const DEMO_FOLIO_EXTRE: FolioExtreRow[] = [
  { folio: 'F-20801', room: '208', guest: 'ABDULLA ALAMERI', type: 'ODA', desc: 'ROOM CHARGE', amount: 5343, balance: 5343, user: 'OĞUZHAN' },
  { folio: 'F-20801', room: '208', guest: 'ABDULLA ALAMERI', type: 'İÇECEK', desc: 'MINIBAR', amount: 120, balance: 5463, user: 'OĞUZHAN' },
  { folio: 'F-21301', room: '213', guest: 'TATIANA MACHULA', type: 'ODA', desc: 'ROOM CHARGE', amount: 4750, balance: 4750, user: 'OĞUZHAN' },
  { folio: 'F-40101', room: '401', guest: 'ILDAR VALIULIN', type: 'TAHSİLAT', desc: 'CASH PAYMENT', amount: -5000, balance: -250, user: 'OĞUZHAN' },
  { folio: 'F-41101', room: '411', guest: 'FATMA BIBI LAJPURIA', type: 'ODA', desc: 'ROOM CHARGE', amount: 4680, balance: 4680, user: 'HALİT' },
];

function renderGr300(ctx: LegacyRenderContext): string {
  const live = buildLiveFolioExtreRows(ctx);
  const data = live.length > 0 ? live : DEMO_FOLIO_EXTRE;
  const header =
    pad('Folyo No', 10) +
    pad('Oda', 5) +
    pad('Misafir', 24) +
    pad('İşlem', 10) +
    pad('Açıklama', 16) +
    pad('Tutar', 12, 'right') +
    pad('Bakiye', 12, 'right') +
    'Kullanıcı';
  const lines = [...reportHeaderRoomPrice(ctx, 'Folyo Extre Listesi'), header, '-'.repeat(118)];
  for (const r of data) {
    lines.push(
      pad(r.folio, 10) +
        pad(r.room, 5) +
        pad(r.guest, 24) +
        pad(r.type, 10) +
        pad(r.desc, 16) +
        pad(fmtMoney(r.amount), 12, 'right') +
        pad(fmtMoney(r.balance), 12, 'right') +
        r.user,
    );
  }
  const total = data.reduce((s, r) => s + r.amount, 0);
  lines.push('', '-'.repeat(118), pad(`Listelenen ${data.length}`, 24) + pad(fmtMoney(total), 12, 'right'));
  return lines.join('\n');
}

// ── GR203 VIP Misafir ──────────────────────────────────────────────────────

const DEMO_VIP = [
  { guest: 'MARINA TERRANOVA', room: '501', vip: 'VIP1', in: '25.06.2026', out: '02.07.2026', agency: 'DIRECT', note: 'SUITE UPGRADE' },
  { guest: 'AHMAD TAMIM TARIN', room: '502', vip: 'VIP2', in: '26.06.2026', out: '01.07.2026', agency: 'CORPORATE', note: 'LATE CHECKOUT' },
];

function renderGr203(ctx: LegacyRenderContext): string {
  const vipLive = liveVipGuests(ctx);
  const vipRows =
    vipLive.length > 0
      ? vipLive.map((g) => ({
          guest: g.guestName.toUpperCase(),
          room: g.roomNo ?? '—',
          vip: (g.extraData?.vip ?? 'VIP').slice(0, 6),
          in: fmtFullDate(g.checkIn),
          out: fmtFullDate(g.checkOut),
          agency: (g.agency ?? 'DIRECT').slice(0, 12).toUpperCase(),
          note: (g.notes ?? g.extraData?.vipNote ?? '').slice(0, 14).toUpperCase(),
        }))
      : DEMO_VIP;
  const header =
    pad('Misafir', 24) +
    pad('Oda', 5) +
    pad('Vip', 6) +
    pad('Giriş', 12) +
    pad('Çıkış', 12) +
    pad('Acenta', 12) +
    'Not';
  const lines = [...reportHeaderRoomPrice(ctx, 'VIP Misafir Listesi'), header, '-'.repeat(90)];
  for (const r of vipRows) {
    lines.push(
      pad(r.guest, 24) +
        pad(r.room, 5) +
        pad(r.vip, 6) +
        pad(r.in, 12) +
        pad(r.out, 12) +
        pad(r.agency, 12) +
        r.note,
    );
  }
  lines.push('', '-'.repeat(90), pad(`Listelenen ${vipRows.length}`, 24));
  return lines.join('\n');
}

// ── GR400K Günlük Kasa Toplam ───────────────────────────────────────────────

function renderGr400K(ctx: LegacyRenderContext): string {
  const live = buildLiveCashRows(ctx);
  const date = fmtFullDate(ctx.businessDate);
  const header =
    pad('Açıklama', 24) +
    pad('Tutar', 14, 'right') +
    pad('Döviz', 6) +
    pad('Borç', 14, 'right') +
    pad('Alacak', 14, 'right') +
    pad('Tarih', 11) +
    'Kullanıcı';
  const lines = [...reportHeader(ctx, 'Günlük Kasa Toplam'), header, '-'.repeat(100)];

  if (live.length > 0) {
    const byCur = new Map<string, typeof live>();
    for (const row of live) {
      const list = byCur.get(row.cur) ?? [];
      list.push(row);
      byCur.set(row.cur, list);
    }
    for (const [cur, rows] of byCur) {
      lines.push(pad(`Grup (${cur})`, 100));
      for (const r of rows) {
        lines.push(
          pad(r.desc.slice(0, 24), 24) +
            pad(fmtMoney(r.amount), 14, 'right') +
            pad(r.cur, 6) +
            pad(fmtMoney(r.debit), 14, 'right') +
            pad(fmtMoney(r.credit), 14, 'right') +
            pad(date, 11) +
            r.user,
        );
      }
    }
    lines.push('', '-'.repeat(100), pad(`Listelenen ${live.length}`, 24));
    return lines.join('\n');
  }

  lines.push(pad('Grup 90 (TL)', 100));
  lines.push(
    pad('Günlük Otomatik Avans', 24) +
      pad(fmtMoney(0), 14, 'right') +
      pad('TL', 6) +
      pad(fmtMoney(0), 14, 'right') +
      pad(fmtMoney(0), 14, 'right') +
      pad('27.06.2026', 11) +
      'OĞUZHAN',
  );
  lines.push(
    pad('Oda Tahsilatları', 24) +
      pad(fmtMoney(14000), 14, 'right') +
      pad('TL', 6) +
      pad(fmtMoney(0), 14, 'right') +
      pad(fmtMoney(14000), 14, 'right') +
      pad('27.06.2026', 11) +
      'OĞUZHAN',
  );
  lines.push(pad('Grup 94 (EURO)', 100));
  lines.push(
    pad('Döviz Tahsilatları', 24) +
      pad(fmtMoney(1250), 14, 'right') +
      pad('EUR', 6) +
      pad(fmtMoney(0), 14, 'right') +
      pad(fmtMoney(1250), 14, 'right') +
      pad('27.06.2026', 11) +
      'HALİT',
  );
  lines.push('', '-'.repeat(100), pad('Listelenen 4', 24));
  return lines.join('\n');
}

// ── GR500 Kasa Raporu ───────────────────────────────────────────────────────

function renderGr500(ctx: LegacyRenderContext): string {
  const live = buildLiveCashRows(ctx);
  const data =
    live.length > 0
      ? live.map((r) => ({
          desc: r.desc,
          amount: r.amount,
          cur: r.cur,
          debit: r.debit,
          credit: r.credit,
          user: r.user,
        }))
      : [
    { desc: 'Nakit Tahsilat — Oda 401', amount: 5000, cur: 'TL', debit: 0, credit: 5000, user: 'OĞUZHAN' },
    { desc: 'Nakit Tahsilat — Oda 411', amount: 9000, cur: 'TL', debit: 0, credit: 9000, user: 'HALİT' },
    { desc: 'Kredi Kartı — BAR', amount: 850, cur: 'TL', debit: 0, credit: 850, user: 'OĞUZHAN' },
    { desc: 'Döviz Bozdurma EUR→TL', amount: 2280, cur: 'TL', debit: 2280, credit: 0, user: 'OĞUZHAN' },
  ];
  const header =
    pad('Açıklama', 28) +
    pad('Tutar', 14, 'right') +
    pad('Döviz', 6) +
    pad('Borç', 14, 'right') +
    pad('Alacak', 14, 'right') +
    pad('Tarih', 11) +
    'Kullanıcı';
  const lines = [...reportHeader(ctx, 'Kasa Raporu'), header, '-'.repeat(100)];
  for (const r of data) {
    lines.push(
      pad(r.desc, 28) +
        pad(fmtMoney(r.amount), 14, 'right') +
        pad(r.cur, 6) +
        pad(fmtMoney(r.debit), 14, 'right') +
        pad(fmtMoney(r.credit), 14, 'right') +
        pad('27.06.2026', 11) +
        r.user,
    );
  }
  lines.push('', '-'.repeat(100), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR501 Departman Gelir ─────────────────────────────────────────────────────

const DEMO_DEPT_REVENUE = [
  { dept: '01 ROOM', revenue: 125430.5, debit: 0, credit: 125430.5 },
  { dept: '11 OTOMAT', revenue: 3840.0, debit: 0, credit: 3840.0 },
  { dept: '20 RESTAURANT', revenue: 22150.75, debit: 0, credit: 22150.75 },
  { dept: '90 CASH', revenue: -17130.0, debit: 17130.0, credit: 0 },
  { dept: '92 C.LEDGER', revenue: -2280.0, debit: 2280.0, credit: 0 },
  { dept: '94 EURO KASA', revenue: 5420.0, debit: 0, credit: 5420.0 },
];

function renderGr501(ctx: LegacyRenderContext): string {
  const live = buildLiveDeptRevenueRows(ctx);
  const data = live.length > 0 ? live : DEMO_DEPT_REVENUE;
  const date = fmtFullDate(ctx.businessDate);
  const header =
    pad('Departman', 20) +
    pad('Gelir', 14, 'right') +
    pad('Borç', 14, 'right') +
    pad('Alacak', 14, 'right') +
    pad('Net', 14, 'right') +
    'Tarih';
  const lines = [...reportHeaderRoomPrice(ctx, 'Departman Gelir'), header, '-'.repeat(90)];
  for (const r of data) {
    const net = r.credit - r.debit;
    lines.push(
      pad(r.dept, 20) +
        pad(fmtMoney(r.revenue), 14, 'right') +
        pad(fmtMoney(r.debit), 14, 'right') +
        pad(fmtMoney(r.credit), 14, 'right') +
        pad(fmtMoney(net), 14, 'right') +
        date,
    );
  }
  const total = data.reduce((s, r) => s + r.revenue, 0);
  lines.push('', '-'.repeat(90), pad(`Listelenen ${data.length}`, 24) + pad(fmtMoney(total), 14, 'right'));
  return lines.join('\n');
}

// ── GR600 City Ledger Fatura ────────────────────────────────────────────────

const DEMO_CL_INVOICE = [
  { inv: 'CL-0891', guest: 'MARINA TERRANOVA', amount: 16685.32, account: 'CITY LEDGER', status: 'AÇIK' },
  { inv: 'CL-0892', guest: 'AHMAD TAMIM TARIN', amount: 12450.0, account: 'CITY LEDGER', status: 'AÇIK' },
  { inv: 'CL-0893', guest: 'SELİM EROĞLU', amount: 8750.5, account: 'CITY LEDGER', status: 'KAPALI' },
];

function renderGr600(ctx: LegacyRenderContext): string {
  const live = buildLiveCityLedgerInvoices(ctx);
  const data = live.length > 0 ? live : DEMO_CL_INVOICE;
  const date = fmtFullDate(ctx.businessDate);
  const header =
    pad('Fatura No', 10) +
    pad('Misafir', 24) +
    pad('Tutar', 14, 'right') +
    pad('Borç', 14, 'right') +
    pad('Hesap', 14) +
    pad('Durum', 8) +
    'Tarih';
  const lines = [...reportHeaderRoomPrice(ctx, 'City Ledger Fatura Raporu'), header, '-'.repeat(100)];
  for (const r of data) {
    lines.push(
      pad(r.inv, 10) +
        pad(r.guest, 24) +
        pad(fmtMoney(r.amount), 14, 'right') +
        pad(fmtMoney(r.amount), 14, 'right') +
        pad(r.account, 14) +
        pad(r.status, 8) +
        date,
    );
  }
  lines.push('', '-'.repeat(100), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR601 Günlük Kesilen Fatura ─────────────────────────────────────────────

const DEMO_DAILY_INV = [
  { inv: 'F-2026-0891', guest: 'SELİM EROĞLU', amount: 1250, account: 'CASH', status: 'KESİLDİ' },
  { inv: 'F-2026-0892', guest: 'EMİN SALİH ERGİN', amount: 1250, account: 'CASH', status: 'KESİLDİ' },
  { inv: 'F-2026-0893', guest: 'FATMA BIBI LAJPURIA', amount: 4680, account: 'CC', status: 'KESİLDİ' },
  { inv: 'F-2026-0894', guest: 'LUMINITA ALEXANDRU', amount: 5343, account: 'CC', status: 'KESİLDİ' },
];

function renderGr601(ctx: LegacyRenderContext): string {
  const live = buildLiveDailyInvoiceRows(ctx);
  const data = live.length > 0 ? live : DEMO_DAILY_INV;
  const date = fmtFullDate(ctx.businessDate);
  const header =
    pad('Fatura No', 12) +
    pad('Misafir', 24) +
    pad('Tutar', 14, 'right') +
    pad('Borç', 14, 'right') +
    pad('Hesap', 10) +
    pad('Durum', 8) +
    'Tarih';
  const lines = [...reportHeaderRoomPrice(ctx, 'Günlük Kesilen Fatura'), header, '-'.repeat(100)];
  for (const r of data) {
    lines.push(
      pad(r.inv, 12) +
        pad(r.guest, 24) +
        pad(fmtMoney(r.amount), 14, 'right') +
        pad(fmtMoney(r.amount), 14, 'right') +
        pad(r.account, 10) +
        pad(r.status, 8) +
        date,
    );
  }
  const total = data.reduce((s, r) => s + r.amount, 0);
  lines.push('', '-'.repeat(100), pad(`Listelenen ${data.length}`, 24) + pad(fmtMoney(total), 14, 'right'));
  return lines.join('\n');
}

// ── GR701 Resmi Müşteri Listesi ─────────────────────────────────────────────

const DEMO_OFFICIAL = [
  { guest: 'T.C. KÜLTÜR VE TURİZM BAK.', room: '—', in: '01.06.2026', out: '30.06.2026', agency: 'RESMİ', status: 'AKTİF' },
  { guest: 'ANTALYA BÜYÜKŞEHİR BELEDİYESİ', room: '—', in: '15.06.2026', out: '28.06.2026', agency: 'RESMİ', status: 'AKTİF' },
  { guest: 'TÜRK HAVA YOLLARI A.O.', room: '—', in: '20.06.2026', out: '27.06.2026', agency: 'KURUMSAL', status: 'KAPALI' },
];

function renderGr701(ctx: LegacyRenderContext): string {
  const live = buildLiveOfficialGuestRows(ctx);
  const data = live.length > 0 ? live : DEMO_OFFICIAL;
  const header =
    pad('Misafir / Kurum', 32) +
    pad('Oda', 5) +
    pad('Giriş', 12) +
    pad('Çıkış', 12) +
    pad('Acenta', 12) +
    'Durum';
  const lines = [...reportHeaderRoomPrice(ctx, 'Resmi Müşteri Listesi'), header, '-'.repeat(90)];
  for (const r of data) {
    lines.push(
      pad(r.guest, 32) +
        pad(r.room, 5) +
        pad(r.in, 12) +
        pad(r.out, 12) +
        pad(r.agency, 12) +
        r.status,
    );
  }
  lines.push('', '-'.repeat(90), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR220 House Keeping ─────────────────────────────────────────────────────

const DEMO_HK = [
  { room: '101', type: 'STD', status: 'KİRLİ', guest: '—', out: '27.06.2026', note: 'DND' },
  { room: '208', type: 'DEL', status: 'TEMİZ', guest: 'ABDULLA ALAMERI', out: '05.07.2026', note: '' },
  { room: '213', type: 'STD', status: 'KİRLİ', guest: 'TATIANA MACHULA', out: '01.07.2026', note: 'LATE C/O' },
  { room: '301', type: 'STD', status: 'TEMİZ', guest: 'MUSTAFA BAYBAGAN', out: '28.06.2026', note: '' },
  { room: '319', type: 'DSU', status: 'KONTROL', guest: 'ILDAR VALIULIN', out: '02.07.2026', note: 'MINIBAR' },
  { room: '401', type: 'STD', status: 'TEMİZ', guest: 'FATMA BIBI LAJPURIA', out: '30.06.2026', note: '' },
  { room: '411', type: 'DEL', status: 'KİRLİ', guest: 'LUMINITA ALEXANDRU', out: '27.06.2026', note: '' },
  { room: '501', type: 'SUI', status: 'TEMİZ', guest: 'MARINA TERRANOVA', out: '02.07.2026', note: 'VIP' },
];

function renderGr220(ctx: LegacyRenderContext): string {
  const hkLive = buildLiveHkRows(ctx);
  const data = hkLive.length > 0 ? hkLive.slice(0, 24) : DEMO_HK;
  const header =
    pad('Oda', 5) +
    pad('Tip', 5) +
    pad('Durum', 10) +
    pad('Misafir', 24) +
    pad('Çıkış', 12) +
    'Not';
  const lines = [...reportHeaderRoomPrice(ctx, 'House Keeping'), header, '-'.repeat(70)];
  for (const r of data) {
    lines.push(
      pad(r.room, 5) +
        pad(r.type, 5) +
        pad(r.status, 10) +
        pad(r.guest, 24) +
        pad(r.out, 12) +
        r.note,
    );
  }
  lines.push('', '-'.repeat(70), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR221 Oda Değişim ───────────────────────────────────────────────────────

const DEMO_ROOM_CHANGE = [
  { guest: 'ABDULLA ALAMERI', from: '208', to: '210', time: '14:22', user: 'OĞUZHAN', note: 'DENİZ MANZARASI' },
  { guest: 'TATIANA MACHULA', from: '213', to: '215', time: '16:05', user: 'HALİT', note: 'GÜRÜLTÜ' },
  { guest: 'MUSTAFA BAYBAGAN', from: '301', to: '303', time: '18:40', user: 'OĞUZHAN', note: '' },
];

function renderGr221(ctx: LegacyRenderContext): string {
  const live = buildLiveRoomChangeRows(ctx);
  const data = live.length > 0 ? live : DEMO_ROOM_CHANGE;
  const header =
    pad('Misafir', 24) +
    pad('Eski Oda', 10) +
    pad('Yeni Oda', 10) +
    pad('Saat', 8) +
    pad('Kullanıcı', 10) +
    'Not';
  const lines = [...reportHeaderRoomPrice(ctx, 'Oda Değişim Listesi'), header, '-'.repeat(80)];
  for (const r of data) {
    lines.push(
      pad(r.guest, 24) +
        pad(r.from, 10) +
        pad(r.to, 10) +
        pad(r.time, 8) +
        pad(r.user, 10) +
        r.note,
    );
  }
  lines.push('', '-'.repeat(80), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR301I / GR301S / GR302 Folyo işlemleri ─────────────────────────────────

function renderFolioAuditReport(ctx: LegacyRenderContext, title: string, kind: Parameters<typeof buildLiveFolioAuditRows>[1]): string {
  const live = buildLiveFolioAuditRows(ctx, kind);
  const header =
    pad('Folyo No', 10) +
    pad('Oda', 5) +
    pad('Misafir', 24) +
    pad('İşlem', 10) +
    pad('Açıklama', 16) +
    pad('Tutar', 12, 'right') +
    pad('Bakiye', 12, 'right') +
    'Kullanıcı';
  const lines = [...reportHeaderRoomPrice(ctx, title), header, '-'.repeat(118)];
  if (live.length === 0) {
    lines.push('', pad('Listelenen 0', 24));
    return lines.join('\n');
  }
  for (const r of live) {
    lines.push(
      pad(r.folio, 10) +
        pad(r.room, 5) +
        pad(r.guest, 24) +
        pad(r.type, 10) +
        pad(r.desc, 16) +
        pad(fmtMoney(r.amount), 12, 'right') +
        pad(fmtMoney(r.balance), 12, 'right') +
        r.user,
    );
  }
  lines.push('', '-'.repeat(118), pad(`Listelenen ${live.length}`, 24));
  return lines.join('\n');
}

function renderGr301I(ctx: LegacyRenderContext): string {
  return renderFolioAuditReport(ctx, 'İptal Folyo İşlemleri', 'cancelled');
}

function renderGr301S(ctx: LegacyRenderContext): string {
  return renderFolioAuditReport(ctx, 'Silinen Folyo İşlemleri', 'deleted');
}

function renderGr302(ctx: LegacyRenderContext): string {
  const live = buildLiveFolioTransferRows(ctx);
  const header =
    pad('Folyo No', 10) +
    pad('Kaynak Oda', 10) +
    pad('Hedef Oda', 10) +
    pad('Misafir', 22) +
    pad('Tutar', 12, 'right') +
    pad('Açıklama', 16) +
    'Kullanıcı';
  const lines = [...reportHeaderRoomPrice(ctx, 'Folyo İşlem Transfer'), header, '-'.repeat(118)];
  if (live.length === 0) {
    lines.push('', pad('Listelenen 0', 24));
    return lines.join('\n');
  }
  for (const r of live) {
    lines.push(
      pad(r.folio, 10) +
        pad(r.fromRoom, 10) +
        pad(r.toRoom, 10) +
        pad(r.guest, 22) +
        pad(fmtMoney(r.amount), 12, 'right') +
        pad(r.desc, 16) +
        r.user,
    );
  }
  lines.push('', '-'.repeat(118), pad(`Listelenen ${live.length}`, 24));
  return lines.join('\n');
}

// ── GR400 Günlük Yönetim ────────────────────────────────────────────────────

function renderGr400(ctx: LegacyRenderContext): string {
  const live = buildLiveMgmtSummary(ctx);
  const date = fmtFullDate(ctx.businessDate);
  const user = ctx.userName.toUpperCase();

  if (live) {
    const lines = [
      ...reportHeader(ctx, 'Günlük Yönetim Raporu'),
      pad('İş Günü', 14) + pad('Doluluk %', 12, 'right') + pad('Gelir', 14, 'right') + pad('ADR', 12, 'right') + pad('RevPAR', 12, 'right') + 'Kapatan',
      '-'.repeat(80),
      pad(date, 14) +
        pad(live.occupancyPct, 12, 'right') +
        pad(fmtMoney(live.revenue), 14, 'right') +
        pad(fmtMoney(live.adr), 12, 'right') +
        pad(fmtMoney(live.revpar), 12, 'right') +
        user,
      '',
      pad('Satılan Oda', 20) + pad(String(live.soldRooms), 8, 'right'),
      pad('Boş Oda', 20) + pad(String(live.vacantRooms), 8, 'right'),
      pad('Giriş', 20) + pad(String(live.arrivals), 8, 'right'),
      pad('Çıkış', 20) + pad(String(live.departures), 8, 'right'),
      pad('Konaklayan', 20) + pad(String(live.inHouse), 8, 'right'),
      '',
      '-'.repeat(80),
      pad('Listelenen 1', 24),
    ];
    return lines.join('\n');
  }

  const lines = [
    ...reportHeader(ctx, 'Günlük Yönetim Raporu'),
    pad('İş Günü', 14) + pad('Doluluk %', 12, 'right') + pad('Gelir', 14, 'right') + pad('ADR', 12, 'right') + pad('RevPAR', 12, 'right') + 'Kapatan',
    '-'.repeat(80),
    pad('27.06.2026', 14) + pad('%78,5', 12, 'right') + pad(fmtMoney(187432.5), 14, 'right') + pad(fmtMoney(4120.3), 12, 'right') + pad(fmtMoney(3234.5), 12, 'right') + 'OĞUZHAN',
    '',
    pad('Satılan Oda', 20) + pad('94', 8, 'right'),
    pad('Boş Oda', 20) + pad('26', 8, 'right'),
    pad('Giriş', 20) + pad('18', 8, 'right'),
    pad('Çıkış', 20) + pad('12', 8, 'right'),
    pad('Konaklayan', 20) + pad('118', 8, 'right'),
    '',
    '-'.repeat(80),
    pad('Listelenen 1', 24),
  ];
  return lines.join('\n');
}

// ── GR401 Günlük Bilanço ────────────────────────────────────────────────────

const DEMO_BILANCO = [
  { dept: '01 ROOM', debit: 0, credit: 125430.5, balance: 125430.5 },
  { dept: '11 OTOMAT', debit: 0, credit: 3840.0, balance: 3840.0 },
  { dept: '20 RESTAURANT', debit: 0, credit: 22150.75, balance: 22150.75 },
  { dept: '90 CASH', debit: 17130.0, credit: 0, balance: -17130.0 },
  { dept: '92 C.LEDGER', debit: 2280.0, credit: 0, balance: -2280.0 },
  { dept: '94 EURO KASA', debit: 0, credit: 5420.0, balance: 5420.0 },
  { dept: '95 USD KASA', debit: 0, credit: 3180.0, balance: 3180.0 },
  { dept: '99 GENEL TOPLAM', debit: 19410.0, credit: 160021.25, balance: 140611.25 },
];

function renderGr401(ctx: LegacyRenderContext): string {
  const live = buildLiveBilancoRows(ctx);
  const data = live.length > 0 ? live : DEMO_BILANCO;
  const date = fmtFullDate(ctx.businessDate);
  const header =
    pad('Tarih', 12) +
    pad('Departman', 18) +
    pad('Borç', 14, 'right') +
    pad('Alacak', 14, 'right') +
    pad('Bakiye', 14, 'right');
  const lines = [...reportHeader(ctx, 'Günlük Bilanço'), header, '-'.repeat(80)];
  for (const r of data) {
    lines.push(
      pad(date, 12) +
        pad(r.dept, 18) +
        pad(fmtMoney(r.debit), 14, 'right') +
        pad(fmtMoney(r.credit), 14, 'right') +
        pad(fmtMoney(r.balance), 14, 'right'),
    );
  }
  lines.push('', '-'.repeat(80), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR302K Kümülatif Departman Gelir ────────────────────────────────────────

const DEMO_CUM_DEPT = [
  { dept: '01 ROOM', amount: 892450.0 },
  { dept: '11 OTOMAT', amount: 28430.5 },
  { dept: '20 RESTAURANT', amount: 156780.25 },
  { dept: '90 CASH', amount: -124500.0 },
  { dept: '92 C.LEDGER', amount: -18240.0 },
];

function renderGr302K(ctx: LegacyRenderContext): string {
  const live = buildLiveCumulativeDeptRows(ctx);
  const data = live.length > 0 ? live : DEMO_CUM_DEPT;
  const period = `01-${fmtShortDate(ctx.businessDate)}`;
  const header = pad('Departman', 20) + pad('Gelir', 16, 'right') + pad('Tarih', 12);
  const lines = [...reportHeaderRoomPrice(ctx, 'Kümülatif Departman Gelir'), header, '-'.repeat(50)];
  for (const r of data) {
    lines.push(pad(r.dept, 20) + pad(fmtMoney(r.amount), 16, 'right') + period);
  }
  const total = data.reduce((s, r) => s + r.amount, 0);
  lines.push('', '-'.repeat(50), pad(`Listelenen ${data.length}`, 24) + pad(fmtMoney(total), 16, 'right'));
  return lines.join('\n');
}

// ── GR501I Günlük İşlemler ──────────────────────────────────────────────────

const DEMO_DAILY_TX = [
  { folio: 'F-20801', room: '208', guest: 'ABDULLA ALAMERI', type: 'ODA', desc: 'ROOM CHARGE', amount: 5343, user: 'OĞUZHAN' },
  { folio: 'F-21301', room: '213', guest: 'TATIANA MACHULA', type: 'ODA', desc: 'ROOM CHARGE', amount: 4750, user: 'OĞUZHAN' },
  { folio: 'F-T9999', room: 'T9999', guest: '—', type: 'İÇECEK', desc: 'MINIBAR AUTO', amount: 80, user: 'OĞUZHAN' },
  { folio: 'F-40101', room: '401', guest: 'ILDAR VALIULIN', type: 'TAHSİLAT', desc: 'CASH', amount: -5000, user: 'OĞUZHAN' },
  { folio: 'F-41101', room: '411', guest: 'FATMA BIBI LAJPURIA', type: 'TAHSİLAT', desc: 'CC', amount: -9000, user: 'HALİT' },
  { folio: 'F-50101', room: '501', guest: 'MARINA TERRANOVA', type: 'FB', desc: 'RESTAURANT', amount: 1250, user: 'OĞUZHAN' },
];

function renderGr501I(ctx: LegacyRenderContext): string {
  const live = buildLiveDailyTxRows(ctx);
  const data = live.length > 0 ? live : DEMO_DAILY_TX;
  const header =
    pad('Folyo No', 10) +
    pad('Oda', 5) +
    pad('Misafir', 24) +
    pad('İşlem', 10) +
    pad('Açıklama', 16) +
    pad('Tutar', 12, 'right') +
    'Kullanıcı';
  const lines = [...reportHeaderRoomPrice(ctx, 'Günlük İşlemler Raporu'), header, '-'.repeat(100)];
  for (const r of data) {
    lines.push(
      pad(r.folio, 10) +
        pad(r.room, 5) +
        pad(r.guest, 24) +
        pad(r.type, 10) +
        pad(r.desc, 16) +
        pad(fmtMoney(r.amount), 12, 'right') +
        r.user,
    );
  }
  lines.push('', '-'.repeat(100), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GR602 Fatura Toplam ─────────────────────────────────────────────────────

const DEMO_INV_TOTAL = [
  { type: 'KESİLEN FATURA', count: 4, amount: 12523.0 },
  { type: 'KREDİYE KALDIRILAN', count: 0, amount: 0 },
  { type: 'FATURALI KESİLMEYEN', count: 2, amount: 3840.5 },
  { type: 'TOPLAM', count: 6, amount: 16363.5 },
];

function renderGr602(ctx: LegacyRenderContext): string {
  const live = buildLiveInvoiceTotals(ctx);
  const data = live.length > 0 ? live : DEMO_INV_TOTAL;
  const header = pad('Kategori', 24) + pad('Adet', 8, 'right') + pad('Tutar', 16, 'right');
  const lines = [...reportHeaderRoomPrice(ctx, 'Fatura Toplam'), header, '-'.repeat(50)];
  for (const r of data) {
    lines.push(pad(r.type, 24) + pad(String(r.count), 8, 'right') + pad(fmtMoney(r.amount), 16, 'right'));
  }
  lines.push('', '-'.repeat(50), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

function renderGr602F(ctx: LegacyRenderContext): string {
  const live = buildLiveUnbilledInvoiceRows(ctx);
  const header =
    pad('Fatura No', 12) +
    pad('Misafir', 24) +
    pad('Tutar', 14, 'right') +
    pad('Hesap', 10) +
    pad('Durum', 14) +
    'Tarih';

  if (live.length === 0) {
    return emptyReport(ctx, 'Faturalı Kesilmeyen', header);
  }

  const date = fmtFullDate(ctx.businessDate);
  const lines = [...reportHeaderRoomPrice(ctx, 'Faturalı Kesilmeyen'), header, '-'.repeat(100)];
  for (const r of live) {
    lines.push(
      pad(r.inv, 12) +
        pad(r.guest, 24) +
        pad(fmtMoney(r.amount), 14, 'right') +
        pad(r.account, 10) +
        pad(r.status, 14) +
        date,
    );
  }
  lines.push('', '-'.repeat(100), pad(`Listelenen ${live.length}`, 24));
  return lines.join('\n');
}

// ── GRMAL Mal Raporu ────────────────────────────────────────────────────────

const DEMO_STOCK = [
  { product: 'COCA COLA 330ML', dept: '11 OTOMAT', qty: 24, amount: 480.0 },
  { product: 'BIRA EFES 50CL', dept: '11 OTOMAT', qty: 12, amount: 720.0 },
  { product: 'SU 0.5L', dept: '11 OTOMAT', qty: 48, amount: 480.0 },
  { product: 'ÇIKOLATA', dept: '11 OTOMAT', qty: 8, amount: 320.0 },
  { product: 'ŞAMPANYA', dept: '20 BAR', qty: 2, amount: 1840.0 },
];

function renderGrMal(ctx: LegacyRenderContext): string {
  const live = buildLiveStockRows(ctx);
  const data = live.length > 0 ? live : DEMO_STOCK;
  const header =
    pad('Ürün', 24) +
    pad('Departman', 14) +
    pad('Adet', 8, 'right') +
    pad('Tutar', 14, 'right') +
    'Tarih';
  const lines = [...reportHeaderRoomPrice(ctx, 'Mal Raporu'), header, '-'.repeat(70)];
  for (const r of data) {
    lines.push(
      pad(r.product, 24) +
        pad(r.dept, 14) +
        pad(String(r.qty), 8, 'right') +
        pad(fmtMoney(r.amount), 14, 'right') +
        fmtShortDate(ctx.businessDate),
    );
  }
  const total = data.reduce((s, r) => s + r.amount, 0);
  lines.push('', '-'.repeat(70), pad(`Listelenen ${data.length}`, 24) + pad(fmtMoney(total), 14, 'right'));
  return lines.join('\n');
}

// ── GRMUSTERI Müşteri Raporu ────────────────────────────────────────────────

const DEMO_CUSTOMERS = [
  { guest: 'ABDULLA ALAMERI', agency: 'BOOKING-NRF', room: '208', in: '27.06.2026', out: '05.07.2026' },
  { guest: 'TATIANA MACHULA', agency: 'BOOKING.COM', room: '213', in: '24.06.2026', out: '01.07.2026' },
  { guest: 'MUSTAFA BAYBAGAN', agency: 'W-INT TC', room: '301', in: '27.06.2026', out: '28.06.2026' },
  { guest: 'ILDAR VALIULIN', agency: 'W.INT', room: '401', in: '26.06.2026', out: '02.07.2026' },
  { guest: 'FATMA BIBI LAJPURIA', agency: 'BOOKING ÖDE', room: '411', in: '25.06.2026', out: '30.06.2026' },
  { guest: 'LUMINITA ALEXANDRU', agency: 'DIRECT', room: '319', in: '22.06.2026', out: '27.06.2026' },
];

function renderGrMusteri(ctx: LegacyRenderContext): string {
  const live = buildLiveCustomerRows(ctx);
  const data = live.length > 0 ? live : DEMO_CUSTOMERS;
  const header =
    pad('Misafir', 24) +
    pad('Acenta', 14) +
    pad('Oda', 5) +
    pad('Giriş', 12) +
    'Çıkış';
  const lines = [...reportHeaderRoomPrice(ctx, 'Müşteri Raporu'), header, '-'.repeat(70)];
  for (const r of data) {
    lines.push(
      pad(r.guest, 24) +
        pad(r.agency, 14) +
        pad(r.room, 5) +
        pad(r.in, 12) +
        r.out,
    );
  }
  lines.push('', '-'.repeat(70), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── GUNLUKINDIRIMIADE Günlük İndirim İade ───────────────────────────────────

const DEMO_DISCOUNT = [
  { guest: 'SELİM EROĞLU', folio: 'F-0891', amount: -250, desc: 'YÖNETİM İNDİRİMİ', user: 'OĞUZHAN' },
  { guest: 'EMİN SALİH ERGİN', folio: 'F-0892', amount: -125, desc: 'İADE — BAR', user: 'HALİT' },
];

function renderGunlukIndirimIade(ctx: LegacyRenderContext): string {
  const live = buildLiveDiscountRefundRows(ctx);
  const data = live.length > 0 ? live : DEMO_DISCOUNT;
  const header =
    pad('Misafir', 24) +
    pad('Folyo No', 10) +
    pad('Tutar', 12, 'right') +
    pad('Açıklama', 20) +
    'Kullanıcı';
  const lines = [...reportHeaderRoomPrice(ctx, 'Günlük İndirim İade'), header, '-'.repeat(80)];
  for (const r of data) {
    lines.push(
      pad(r.guest, 24) +
        pad(r.folio, 10) +
        pad(fmtMoney(r.amount), 12, 'right') +
        pad(r.desc, 20) +
        r.user,
    );
  }
  lines.push('', '-'.repeat(80), pad(`Listelenen ${data.length}`, 24));
  return lines.join('\n');
}

// ── Registry ─────────────────────────────────────────────────────────────────

/** Batch raporları — ekran görüntülerinden eşleştirilmiş önizlemeler */
const BATCH_RENDERERS: Record<string, (ctx: LegacyRenderContext) => string> = {
  GR203: renderGr203,
  GR220: renderGr220,
  GR221: renderGr221,
  GR222: renderGr222,
  GR300: renderGr300,
  GR301I: renderGr301I,
  GR301S: renderGr301S,
  GR302: renderGr302,
  GR302K: renderGr302K,
  GR303: renderGr303,
  GR310: renderGr310,
  GR350: renderGr350,
  GR400: renderGr400,
  GR400K: renderGr400K,
  GR401: renderGr401,
  GR401K: renderGr401K,
  GR401N: renderGr401N,
  GR402: renderGr402,
  GR500: renderGr500,
  GR501: renderGr501,
  GR501I: renderGr501I,
  GR502: renderGr502,
  GR503: renderGr503,
  GR600: renderGr600,
  GR601: renderGr601,
  GR602: renderGr602,
  GR602F: renderGr602F,
  GR700: renderGr700,
  GR701: renderGr701,
  GRMAIL: renderGrMail,
  GRKASAISLEM: renderGrKasaIslem,
  GRFOLYOBAKIYE2: renderGrFolyoBakiye,
  GRMAL: renderGrMal,
  GRMUSTERI: renderGrMusteri,
  GUNLUKINDIRIMIADE: renderGunlukIndirimIade,
  MASTERFOLYOKONTORL: renderMasterFolyo,
  RGC: renderRgc,
};

export const EOD_BATCH_REPORT_IDS = Object.keys(BATCH_RENDERERS);

export function renderBatchEodReport(report: EodLegacyReportDef, ctx: LegacyRenderContext): string | undefined {
  const fn = BATCH_RENDERERS[report.id];
  return fn ? fn(ctx) : undefined;
}
