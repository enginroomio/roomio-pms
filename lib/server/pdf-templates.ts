import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import type { Reservation } from '@/lib/types/reservation';
import type { PropertyReportRow } from '@/lib/server/report-consolidation';
import type { Invoice } from '@/lib/server/pms-store';
import { buildPdfTheme, type PdfTheme, PDF_BRAND, PDF_BRAND_LIGHT, PDF_MUTED } from '@/lib/server/pdf-theme';

const BRAND = PDF_BRAND;
const BRAND_LIGHT = PDF_BRAND_LIGHT;
const MUTED = PDF_MUTED;

function collectPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

type PdfMeta = {
  hotel: string;
  businessDate: string;
  generatedAt: string;
  module?: string;
};

function drawBrandingHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  meta: PdfMeta,
  theme?: Pick<PdfTheme, 'brand' | 'brandLight' | 'muted' | 'hotel'>,
): number {
  const brand = theme?.brand ?? BRAND;
  const pageWidth = doc.page.width;
  doc.save();
  doc.rect(0, 0, pageWidth, 72).fill(brand);
  doc.circle(36, 36, 18).fill('#ffffff');
  doc.fillColor(brand).fontSize(14).text('R', 30, 28, { width: 20, align: 'center' });
  doc.fillColor('#ffffff').fontSize(16).text('Roomio PMS', 64, 18, { continued: false });
  doc.fontSize(9).text(theme?.hotel ?? meta.hotel, 64, 38, { width: pageWidth - 120 });
  doc.fontSize(8).text(
    `İş günü: ${meta.businessDate}  ·  ${meta.generatedAt}`,
    64,
    52,
    { width: pageWidth - 120 },
  );
  doc.restore();

  doc.y = 88;
  doc.fillColor('#0f172a').fontSize(15).text(title, 50, doc.y, { align: 'left' });
  if (meta.module) {
    doc.fontSize(9).fillColor(MUTED).text(meta.module, 50, doc.y + 2);
  }
  doc.moveDown(1.2);
  return doc.y;
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  headers: string[],
  colX: number[],
  colW: number[],
  theme?: Pick<PdfTheme, 'brandLight'>,
): void {
  const y = doc.y;
  doc.save();
  doc.rect(50, y - 2, doc.page.width - 100, 16).fill(theme?.brandLight ?? BRAND_LIGHT);
  doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold');
  headers.forEach((h, i) => {
    doc.text(h, colX[i], y, { width: colW[i], lineBreak: false });
  });
  doc.restore();
  doc.y = y + 18;
}

function drawFooter(doc: PDFKit.PDFDocument, note: string): void {
  const bottom = doc.page.height - 40;
  doc.fontSize(7).fillColor(MUTED);
  doc.text(note, 50, bottom, { align: 'center', width: doc.page.width - 100 });
  doc.text(`Sayfa ${doc.bufferedPageRange().count}`, 50, bottom + 10, {
    align: 'right',
    width: doc.page.width - 100,
  });
}

export async function buildReservationPdfKit(
  title: string,
  meta: PdfMeta,
  rows: Reservation[],
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  drawBrandingHeader(doc, title, meta);

  const colX = [50, 108, 218, 278, 338, 388, 448];
  const colW = [55, 105, 55, 55, 45, 55, 90];
  const headers = ['Rez.No', 'Misafir', 'Giriş', 'Çıkış', 'Tip', 'Oda', 'Durum'];
  drawTableHeader(doc, headers, colX, colW);

  doc.font('Helvetica').fontSize(8).fillColor('#0f172a');
  rows.slice(0, 45).forEach((r, idx) => {
    if (doc.y > 700) {
      drawFooter(doc, `Toplam ${rows.length} kayıt · Roomio PMS`);
      doc.addPage();
      drawBrandingHeader(doc, title, meta);
      drawTableHeader(doc, headers, colX, colW);
      doc.font('Helvetica').fontSize(8);
    }
    const y = doc.y;
    if (idx % 2 === 1) {
      doc.save();
      doc.rect(50, y - 1, doc.page.width - 100, 14).fill('#f8fafc');
      doc.restore();
    }
    doc.fillColor('#0f172a');
    doc.text(r.refNo, colX[0], y, { width: colW[0], lineBreak: false });
    doc.text(r.guestName.slice(0, 20), colX[1], y, { width: colW[1], lineBreak: false });
    doc.text(r.checkIn, colX[2], y, { width: colW[2], lineBreak: false });
    doc.text(r.checkOut, colX[3], y, { width: colW[3], lineBreak: false });
    doc.text(r.roomType, colX[4], y, { width: colW[4], lineBreak: false });
    doc.text(r.roomNo ?? '—', colX[5], y, { width: colW[5], lineBreak: false });
    doc.text(r.status, colX[6], y, { width: colW[6], lineBreak: false });
    doc.y = y + 14;
  });

  doc.moveDown(0.5);
  drawFooter(doc, `Toplam ${rows.length} kayıt · ${meta.hotel} · Roomio PMS`);
  return collectPdf(doc);
}

export async function buildConsolidatedPdfKit(
  meta: { generatedAt: string; businessDate: string },
  rows: PropertyReportRow[],
  totals: { rooms: number; reservations: number; checkedIn: number },
): Promise<Buffer> {
  const theme = await buildPdfTheme(undefined, { hotel: 'Tüm Şubeler', businessDate: meta.businessDate });
  const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
  drawBrandingHeader(doc, 'Konsolide Tesis Raporu', {
    hotel: theme.hotel,
    businessDate: meta.businessDate,
    generatedAt: meta.generatedAt,
    module: 'Çoklu şube',
  }, theme);

  doc.fontSize(9).fillColor(MUTED).text(
    `${rows.length} tesis · ${totals.rooms} oda · ${totals.checkedIn} konaklayan`,
    50,
    doc.y,
  );
  doc.moveDown(0.8);

  if (rows.length > 0) {
    const cardW = (doc.page.width - 100 - (rows.length - 1) * 8) / Math.min(rows.length, 4);
    const cardY = doc.y;
    rows.slice(0, 4).forEach((r, i) => {
      const x = 50 + i * (cardW + 8);
      doc.save();
      doc.rect(x, cardY, cardW, 48).fill(theme.brandLight);
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(r.name, x + 8, cardY + 8, { width: cardW - 16 });
      doc.font('Helvetica').fontSize(7).fillColor(MUTED);
      doc.text(`${r.city ?? r.code} · %${r.occupancyPct} doluluk`, x + 8, cardY + 22, { width: cardW - 16 });
      doc.text(`${r.checkedIn}/${r.totalRooms} oda · ${r.arrivalsToday} giriş`, x + 8, cardY + 34, { width: cardW - 16 });
      doc.restore();
    });
    doc.y = cardY + 58;
  }

  const colX = [50, 200, 280, 330, 400, 470, 540, 610];
  const colW = [145, 75, 45, 65, 65, 65, 65, 55];
  const headers = ['Tesis', 'Şehir', 'Oda', 'Rezervasyon', 'Konaklayan', 'Giriş', 'Doluluk %', 'Kod'];
  drawTableHeader(doc, headers, colX, colW, theme);

  doc.font('Helvetica').fontSize(8);
  rows.forEach((r, idx) => {
    const y = doc.y;
    if (idx % 2 === 1) {
      doc.save();
      doc.rect(50, y - 1, doc.page.width - 100, 14).fill('#f8fafc');
      doc.restore();
    }
    doc.fillColor('#0f172a');
    doc.text(r.name, colX[0], y, { width: colW[0], lineBreak: false });
    doc.text(r.city ?? '—', colX[1], y, { width: colW[1], lineBreak: false });
    doc.text(String(r.totalRooms), colX[2], y, { width: colW[2], lineBreak: false });
    doc.text(String(r.reservations), colX[3], y, { width: colW[3], lineBreak: false });
    doc.text(String(r.checkedIn), colX[4], y, { width: colW[4], lineBreak: false });
    doc.text(String(r.arrivalsToday), colX[5], y, { width: colW[5], lineBreak: false });
    doc.text(`%${r.occupancyPct}`, colX[6], y, { width: colW[6], lineBreak: false });
    doc.text(r.code, colX[7], y, { width: colW[7], lineBreak: false });
    doc.y = y + 14;
  });

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text(
    `TOPLAM: ${rows.length} tesis · ${totals.rooms} oda · ${totals.reservations} rezervasyon · ${totals.checkedIn} konaklayan`,
    50,
    doc.y,
  );
  drawFooter(doc, 'Konsolide rapor · Roomio PMS');
  return collectPdf(doc);
}

export async function buildEodPdfKit(
  businessDate: string,
  occupancy: number,
  revenue: number,
  closedBy: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  drawBrandingHeader(doc, 'Gün Sonu Raporu', {
    hotel: 'Hotel Sapphire',
    businessDate,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    module: 'Gün Sonu',
  });
  doc.fontSize(11).fillColor('#0f172a');
  doc.text(`Doluluk: %${occupancy}`);
  doc.text(`Gelir: ₺${revenue.toLocaleString('tr-TR')}`);
  doc.text(`Kapatan: ${closedBy}`);
  doc.moveDown(1);
  doc.fontSize(11).text('Paket içeriği:', { underline: true });
  doc.moveDown(0.5);
  ['FO Günlük Durum', 'Kasa Özet', 'HK Oda Durumu', 'Rezervasyon Özet'].forEach((line) => {
    doc.text(`✓  ${line}`);
  });
  drawFooter(doc, 'Gün sonu arşivi · Roomio PMS');
  return collectPdf(doc);
}

export async function buildGenericTablePdfKit(
  title: string,
  meta: PdfMeta,
  headers: string[],
  rows: string[][],
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: headers.length > 6 ? 'landscape' : 'portrait' });
  const pageWidth = headers.length > 6 ? 762 : 515;
  const colW = Math.min(120, Math.floor((pageWidth - 100) / Math.max(headers.length, 1)));

  drawBrandingHeader(doc, title, meta);
  const colX = headers.map((_, i) => 50 + i * colW);
  drawTableHeader(doc, headers, colX, headers.map(() => colW - 4));

  doc.font('Helvetica').fontSize(8).fillColor('#0f172a');
  for (const row of rows.slice(0, 50)) {
    if (doc.y > (headers.length > 6 ? 520 : 700)) {
      doc.addPage();
      drawBrandingHeader(doc, title, meta);
      drawTableHeader(doc, headers, colX, headers.map(() => colW - 4));
    }
    const y = doc.y;
    row.forEach((cell, i) => {
      doc.text(String(cell).slice(0, 28), colX[i], y, { width: colW - 4, lineBreak: false });
    });
    doc.y = y + 14;
  }

  drawFooter(doc, `Toplam ${rows.length} kayıt · Roomio PMS`);
  return collectPdf(doc);
}

export async function buildCategoryPdfKit(category: string, lines: string[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  drawBrandingHeader(doc, `Rapor: ${category}`, {
    hotel: 'Hotel Sapphire',
    businessDate: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    module: category,
  });
  doc.fontSize(10).fillColor('#0f172a');
  lines.forEach((l) => doc.text(l));
  drawFooter(doc, 'Roomio PMS');
  return collectPdf(doc);
}

function fmtTry(n: number): string {
  return `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function buildCashClosePdfKit(report: import('@/lib/server/cash-deposit').CashCloseReport): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const pageW = 762;

  drawBrandingHeader(doc, 'Günlük Kasa Kapanış Raporu', {
    hotel: report.hotel,
    businessDate: report.businessDate,
    generatedAt: report.generatedAt,
    module: 'Ön Kasa · Fidelio uyumlu',
  });

  const kpiY = doc.y;
  const kpiW = (pageW - 100) / 4;
  const kpis = [
    ['Tahsilat', fmtTry(report.summary.totalTahsilat)],
    ['Depozit', fmtTry(report.summary.totalDepozit)],
    ['Ödeme / devir', fmtTry(report.summary.totalOdeme)],
    ['Toplam fark', fmtTry(report.summary.totalVariance)],
  ];
  kpis.forEach(([label, val], i) => {
    const x = 50 + i * kpiW;
    doc.save();
    doc.rect(x, kpiY, kpiW - 8, 42).fill(BRAND_LIGHT);
    doc.fillColor(MUTED).fontSize(7).text(label, x + 8, kpiY + 8, { width: kpiW - 16 });
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(val, x + 8, kpiY + 22, { width: kpiW - 16 });
    doc.restore();
  });
  doc.y = kpiY + 52;
  doc.font('Helvetica');

  doc.fontSize(10).fillColor('#0f172a').text('Kasa kapanış özeti', 50, doc.y);
  doc.moveDown(0.6);

  const regHeaders = ['Kasa', 'Durum', 'Açılış', 'Beklenen', 'Sayım', 'Fark', 'Kapanış'];
  const colW = [100, 52, 72, 72, 72, 62, 90];
  const colX = colW.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? 50 : acc[i - 1]! + colW[i - 1]!);
    return acc;
  }, []);
  drawTableHeader(doc, regHeaders, colX, colW);

  doc.font('Helvetica').fontSize(8);
  for (const r of report.registers) {
    const y = doc.y;
    const cells = [
      r.register,
      r.status === 'open' ? 'Açık' : 'Kapalı',
      fmtTry(r.openingBalance),
      fmtTry(r.expectedBalance),
      r.closingBalance != null ? fmtTry(r.closingBalance) : '—',
      fmtTry(r.variance),
      r.closedAt ?? '—',
    ];
    cells.forEach((cell, i) => {
      doc.text(cell, colX[i], y, { width: colW[i] - 4, lineBreak: false });
    });
    doc.y = y + 14;
  }

  doc.moveDown(1.2);
  doc.fontSize(10).text('Günlük kasa hareketleri', 50, doc.y);
  doc.moveDown(0.5);

  const movHeaders = ['Saat', 'Kasa', 'Tip', 'Açıklama', 'Tutar', 'Kullanıcı'];
  const mColW = [42, 88, 52, 280, 72, 72];
  const mColX = mColW.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? 50 : acc[i - 1]! + mColW[i - 1]!);
    return acc;
  }, []);
  drawTableHeader(doc, movHeaders, mColX, mColW);

  for (const e of report.entries.slice(0, 40)) {
    if (doc.y > 500) {
      doc.addPage();
      drawBrandingHeader(doc, 'Günlük Kasa Kapanış Raporu (devam)', {
        hotel: report.hotel,
        businessDate: report.businessDate,
        generatedAt: report.generatedAt,
        module: 'Hareketler',
      });
      drawTableHeader(doc, movHeaders, mColX, mColW);
    }
    const y = doc.y;
    [e.time, e.register, e.type, e.description.slice(0, 48), fmtTry(e.amount), e.user].forEach((cell, i) => {
      doc.text(String(cell), mColX[i], y, { width: mColW[i] - 4, lineBreak: false });
    });
    doc.y = y + 13;
  }

  doc.moveDown(2);
  const sigY = Math.min(doc.y + 20, 520);
  doc.fontSize(8).fillColor(MUTED);
  doc.text('Vardiya sorumlusu', 50, sigY);
  doc.text('Muhasebe onayı', 280, sigY);
  doc.text('Genel müdür', 510, sigY);
  doc.moveTo(50, sigY + 28).lineTo(200, sigY + 28).stroke(MUTED);
  doc.moveTo(280, sigY + 28).lineTo(430, sigY + 28).stroke(MUTED);
  doc.moveTo(510, sigY + 28).lineTo(660, sigY + 28).stroke(MUTED);

  drawFooter(doc, `Fidelio uyumlu kasa kapanış · ${report.entries.length} hareket · Roomio PMS`);
  return collectPdf(doc);
}

const AUDIT_MODULE_LABELS: Record<string, string> = {
  eod: 'Gün sonu',
  folio: 'Folyo',
  reception: 'Resepsiyon',
  cash: 'Kasa',
  deposit: 'Depozit',
  reservation: 'Rezervasyon',
  group: 'Grup',
};

export async function buildNightAuditPdfKit(
  report: {
    hotel: string;
    businessDate: string;
    generatedAt: string;
    logs: Array<{
      createdAt: string;
      module: string;
      action: string;
      user: string;
      detail?: string;
      entityType?: string;
      entityId?: string;
    }>;
  },
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  drawBrandingHeader(doc, 'Gece Denetim İzi (Night Audit Trail)', {
    hotel: report.hotel,
    businessDate: report.businessDate,
    generatedAt: report.generatedAt,
    module: 'Gün Sonu · Fidelio uyumlu',
  });

  const summary = report.logs.reduce<Record<string, number>>((acc, row) => {
    acc[row.module] = (acc[row.module] ?? 0) + 1;
    return acc;
  }, {});
  const summaryText = Object.entries(summary)
    .map(([k, n]) => `${AUDIT_MODULE_LABELS[k] ?? k}: ${n}`)
    .join('  ·  ');
  doc.fontSize(9).fillColor(MUTED).text(summaryText || 'Kayıt yok', 50, doc.y);
  doc.moveDown(1);

  const headers = ['Saat', 'Modül', 'İşlem', 'Kullanıcı', 'Detay', 'Varlık'];
  const colW = [72, 72, 72, 72, 250, 120];
  const colX = colW.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? 50 : acc[i - 1]! + colW[i - 1]!);
    return acc;
  }, []);
  drawTableHeader(doc, headers, colX, colW);

  doc.font('Helvetica').fontSize(7.5).fillColor('#0f172a');
  for (const row of report.logs) {
    if (doc.y > 500) {
      drawFooter(doc, `Gece denetim · ${report.logs.length} kayıt`);
      doc.addPage();
      drawBrandingHeader(doc, 'Gece Denetim İzi (devam)', {
        hotel: report.hotel,
        businessDate: report.businessDate,
        generatedAt: report.generatedAt,
        module: 'Gün Sonu',
      });
      drawTableHeader(doc, headers, colX, colW);
      doc.font('Helvetica').fontSize(7.5);
    }
    const y = doc.y;
    const cells = [
      row.createdAt,
      AUDIT_MODULE_LABELS[row.module] ?? row.module,
      row.action,
      row.user,
      (row.detail ?? '—').slice(0, 80),
      row.entityId ? `${row.entityType ?? ''} ${row.entityId}`.trim().slice(0, 28) : '—',
    ];
    cells.forEach((cell, i) => {
      doc.text(String(cell), colX[i], y, { width: colW[i] - 4, lineBreak: false });
    });
    doc.y = y + 13;
  }

  drawFooter(doc, `Gece denetim izi · ${report.logs.length} kayıt · Roomio PMS`);
  return collectPdf(doc);
}

export async function buildGroupPickupPdfKit(
  report: import('@/lib/server/group-pickup-report').GroupPickupReport,
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  drawBrandingHeader(doc, 'Grup Pickup / Allotment Raporu', {
    hotel: report.hotel,
    businessDate: report.businessDate,
    generatedAt: report.generatedAt,
    module: 'Rezervasyon · Fidelio uyumlu',
  });

  doc.fontSize(9).fillColor(MUTED).text(
    `Toplam ${report.totals.groups} grup · ${report.totals.roomsPickedUp}/${report.totals.roomsAllotted} oda alındı (%${report.totals.pickupPct})`,
    50,
    doc.y,
  );
  doc.moveDown(1);

  const headers = ['Ref', 'Grup', 'Giriş', 'Çıkış', 'Allotment', 'Alınan', 'Pickup %', 'DBL', 'SUI', 'TRP'];
  const colW = [52, 120, 58, 58, 52, 52, 48, 40, 40, 40];
  const colX = colW.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? 50 : acc[i - 1]! + colW[i - 1]!);
    return acc;
  }, []);
  drawTableHeader(doc, headers, colX, colW);

  doc.font('Helvetica').fontSize(7.5).fillColor('#0f172a');
  for (const row of report.rows) {
    const y = doc.y;
    const cells = [
      row.refNo,
      row.name.slice(0, 22),
      row.checkIn,
      row.checkOut,
      String(row.totalAllotted),
      String(row.totalPickedUp),
      `%${row.pickupPct}`,
      `${row.pickedUp.DBL ?? 0}/${row.allotment.DBL ?? 0}`,
      `${row.pickedUp.SUI ?? 0}/${row.allotment.SUI ?? 0}`,
      `${row.pickedUp.TRP ?? 0}/${row.allotment.TRP ?? 0}`,
    ];
    cells.forEach((cell, i) => {
      doc.text(String(cell), colX[i], y, { width: colW[i] - 4, lineBreak: false });
    });
    doc.y = y + 13;
  }

  drawFooter(doc, `Grup pickup · ${report.rows.length} kayıt · Roomio PMS`);
  return collectPdf(doc);
}

export async function buildCashLedgerPdfKit(
  report: Awaited<ReturnType<typeof import('@/lib/server/reception-ops').getCashLedgerReportServer>>,
  hotel: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  drawBrandingHeader(doc, 'Günlük Kasa Defteri', {
    hotel,
    businessDate: report.businessDate,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    module: 'Ön Kasa · Fidelio uyumlu',
  });

  doc.fontSize(9).fillColor(MUTED).text(
    `Tahsilat ${fmtTry(report.summary.tahsilat)} · Ödeme ${fmtTry(report.summary.odeme)} · Depozit ${fmtTry(report.summary.depozit)} · Net ${fmtTry(report.summary.net)}`,
    50,
    doc.y,
  );
  doc.moveDown(1);

  const headers = ['Saat', 'Kasa', 'Tip', 'Açıklama', 'Tutar', 'Kullanıcı'];
  const colW = [48, 72, 52, 280, 72, 72];
  const colX = colW.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? 50 : acc[i - 1]! + colW[i - 1]!);
    return acc;
  }, []);
  drawTableHeader(doc, headers, colX, colW);

  doc.font('Helvetica').fontSize(7.5);
  for (const e of report.entries) {
    const y = doc.y;
    [e.time, e.register, e.type, e.description.slice(0, 52), fmtTry(e.amount), e.user].forEach((cell, i) => {
      doc.text(String(cell), colX[i], y, { width: colW[i] - 4, lineBreak: false });
    });
    doc.y = y + 13;
  }

  drawFooter(doc, `Kasa defteri · ${report.entries.length} hareket · Roomio PMS`);
  return collectPdf(doc);
}

export async function buildNightAuditPackagePdfKit(
  pkg: import('@/lib/server/night-audit-package').NightAuditPackage,
  propertyId?: string,
): Promise<Buffer> {
  const theme = await buildPdfTheme(propertyId, { hotel: pkg.hotel, businessDate: pkg.businessDate });
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  drawBrandingHeader(doc, 'Gece Denetim Paketi (Night Audit)', {
    hotel: pkg.hotel,
    businessDate: pkg.businessDate,
    generatedAt: pkg.generatedAt,
    module: `Durum: ${pkg.ready ? 'Hazır' : 'Uyarı var'}`,
  }, theme);

  doc.fontSize(9).fillColor(MUTED).text(
    `${theme.company} · ${theme.taxOffice} · VKN ${theme.taxNumber}`,
    50,
    doc.y,
  );
  doc.moveDown(0.8);

  doc.fontSize(10).fillColor('#0f172a').text('Ön kontrol özeti', 50, doc.y);
  doc.moveDown(0.5);
  for (const c of pkg.checks) {
    doc.fontSize(8).fillColor(MUTED).text(`• [${c.status.toUpperCase()}] ${c.label}: ${c.detail}`);
  }

  doc.moveDown(1);
  doc.fontSize(10).fillColor('#0f172a').text(`Denetim izi (${pkg.auditLogs.length} kayıt)`, 50, doc.y);
  doc.moveDown(0.5);
  for (const row of pkg.auditLogs.slice(0, 40)) {
    doc.fontSize(7.5).fillColor(MUTED).text(
      `${row.createdAt} · ${row.module}/${row.action} · ${row.user} · ${row.detail ?? ''}`.slice(0, 120),
    );
  }

  drawFooter(doc, 'Gece denetim paketi · Roomio PMS');
  return collectPdf(doc);
}

const INVOICE_STATUS_LABEL: Record<Invoice['status'], string> = {
  draft: 'Taslak',
  issued: 'Kesildi',
  paid: 'Tahsil edildi',
};

const INVOICE_TYPE_LABEL: Record<Invoice['type'], string> = {
  konaklama: 'Konaklama',
  ekstra: 'Ekstra',
  banket: 'Banket',
};

export async function buildInvoicePdfKit(invoice: Invoice, propertyId?: string): Promise<Buffer> {
  const theme = await buildPdfTheme(propertyId, { businessDate: invoice.date });
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

  drawBrandingHeader(doc, 'Fatura / Invoice', {
    hotel: theme.hotel,
    businessDate: invoice.date,
    generatedAt,
    module: `No: ${invoice.no}`,
  }, theme);

  doc.fontSize(9).fillColor(MUTED).text(theme.company, 50, doc.y);
  doc.text(`${theme.taxOffice} · VKN ${theme.taxNumber}`, 50, doc.y + 2);
  doc.text(theme.address, 50, doc.y + 2);
  doc.text(`${theme.phone} · ${theme.email}`, 50, doc.y + 2);
  doc.moveDown(1.2);

  const boxY = doc.y;
  doc.save();
  doc.rect(50, boxY, doc.page.width - 100, 88).stroke(theme.brand);
  doc.restore();

  doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold');
  doc.text('Misafir / Cari', 60, boxY + 12);
  doc.font('Helvetica').fontSize(11).text(invoice.guest, 60, boxY + 28);
  doc.fontSize(9).fillColor(MUTED).text(`Tip: ${INVOICE_TYPE_LABEL[invoice.type]}`, 60, boxY + 46);
  doc.text(`Durum: ${INVOICE_STATUS_LABEL[invoice.status]}`, 60, boxY + 60);

  const net = invoice.amount;
  const vat = invoice.vat;
  const gross = net + vat;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
  doc.text('Tutar özeti', 320, boxY + 12);
  doc.font('Helvetica').fontSize(9);
  doc.text(`Net: ${fmtTry(net)}`, 320, boxY + 30);
  doc.text(`KDV: ${fmtTry(vat)}`, 320, boxY + 44);
  doc.font('Helvetica-Bold').fontSize(11).text(`Toplam: ${fmtTry(gross)}`, 320, boxY + 62);

  doc.y = boxY + 100;
  doc.moveDown(0.5);

  const headers = ['Kalem', 'Açıklama', 'Tutar'];
  const colX = [50, 180, 420];
  const colW = [125, 235, 100];
  drawTableHeader(doc, headers, colX, colW, theme);

  const y = doc.y;
  doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
  doc.text('1', colX[0], y, { width: colW[0], lineBreak: false });
  doc.text(`${INVOICE_TYPE_LABEL[invoice.type]} — ${invoice.guest}`.slice(0, 42), colX[1], y, { width: colW[1], lineBreak: false });
  doc.text(fmtTry(gross), colX[2], y, { width: colW[2], lineBreak: false });
  doc.y = y + 16;

  doc.moveDown(2);
  doc.fontSize(8).fillColor(MUTED).text(
    `Para birimi: ${theme.currency} · Tesis kodu: ${theme.propertyCode} · Roomio PMS`,
    50,
    doc.y,
  );

  drawFooter(doc, `Fatura ${invoice.no} · ${theme.hotel}`);
  return collectPdf(doc);
}
