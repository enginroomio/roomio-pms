import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import type { Reservation } from '@/lib/types/reservation';

function collectPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export async function buildReservationPdfKit(
  title: string,
  meta: { hotel: string; businessDate: string; generatedAt: string },
  rows: Reservation[],
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#444');
  doc.text(`${meta.hotel}  ·  İş günü: ${meta.businessDate}  ·  ${meta.generatedAt}`);
  doc.moveDown(1);
  doc.fillColor('#000').fontSize(9);

  const colX = [50, 110, 220, 280, 340, 400, 460];
  const headers = ['Rez.No', 'Misafir', 'Giriş', 'Çıkış', 'Tip', 'Oda', 'Durum'];
  headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 90, continued: false }));
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc');
  doc.moveDown(0.3);

  for (const r of rows.slice(0, 45)) {
    if (doc.y > 720) {
      doc.addPage();
      doc.fontSize(9);
    }
    const y = doc.y;
    doc.text(r.refNo, colX[0], y, { width: 55 });
    doc.text(r.guestName.slice(0, 18), colX[1], y, { width: 105 });
    doc.text(r.checkIn, colX[2], y, { width: 55 });
    doc.text(r.checkOut, colX[3], y, { width: 55 });
    doc.text(r.roomType, colX[4], y, { width: 55 });
    doc.text(r.roomNo ?? '—', colX[5], y, { width: 55 });
    doc.text(r.status, colX[6], y, { width: 80 });
    doc.moveDown(0.9);
  }

  doc.moveDown(1);
  doc.fontSize(8).fillColor('#666').text(`Toplam ${rows.length} kayıt · Roomio PMS`, { align: 'center' });
  return collectPdf(doc);
}

export async function buildEodPdfKit(
  businessDate: string,
  occupancy: number,
  revenue: number,
  closedBy: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.fontSize(20).text('Gün Sonu Raporu', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(12);
  doc.text(`İş günü: ${businessDate}`);
  doc.text(`Doluluk: %${occupancy}`);
  doc.text(`Gelir: ₺${revenue.toLocaleString('tr-TR')}`);
  doc.text(`Kapatan: ${closedBy}`);
  doc.text(`Oluşturma: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`);
  doc.moveDown(1.5);
  doc.fontSize(11).text('Paket içeriği:', { underline: true });
  doc.moveDown(0.5);
  ['FO Günlük Durum', 'Kasa Özet', 'HK Oda Durumu', 'Rezervasyon Özet'].forEach((line) => {
    doc.text(`✓  ${line}`);
  });
  return collectPdf(doc);
}

export async function buildGenericTablePdfKit(
  title: string,
  meta: { hotel: string; businessDate: string; module: string; generatedAt: string },
  headers: string[],
  rows: string[][],
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: headers.length > 6 ? 'landscape' : 'portrait' });
  const pageWidth = headers.length > 6 ? 762 : 515;
  const colW = Math.min(120, Math.floor((pageWidth - 80) / Math.max(headers.length, 1)));

  doc.fontSize(16).text(title, { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(9).fillColor('#444');
  doc.text(`${meta.hotel}  ·  ${meta.module}  ·  İş günü: ${meta.businessDate}`);
  doc.text(meta.generatedAt);
  doc.moveDown(0.8);
  doc.fillColor('#000').fontSize(8);

  let x0 = 40;
  let y = doc.y;
  headers.forEach((h, i) => {
    doc.text(h, x0 + i * colW, y, { width: colW - 4, lineBreak: false });
  });
  doc.moveDown(0.4);
  doc.moveTo(40, doc.y).lineTo(pageWidth - 40, doc.y).stroke('#ccc');
  doc.moveDown(0.3);

  for (const row of rows.slice(0, 50)) {
    if (doc.y > (headers.length > 6 ? 520 : 740)) {
      doc.addPage();
      doc.fontSize(8);
    }
    y = doc.y;
    row.forEach((cell, i) => {
      doc.text(String(cell).slice(0, 24), x0 + i * colW, y, { width: colW - 4, lineBreak: false });
    });
    doc.moveDown(0.75);
  }

  doc.moveDown(0.5);
  doc.fontSize(8).fillColor('#666').text(`Toplam ${rows.length} kayıt · Roomio PMS`, { align: 'center' });
  return collectPdf(doc);
}

export async function buildCategoryPdfKit(category: string, lines: string[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.fontSize(18).text(`Rapor: ${category}`, { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(10);
  lines.forEach((l) => doc.text(l));
  return collectPdf(doc);
}
