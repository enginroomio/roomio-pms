import type { Invoice } from '@/lib/server/pms-store';
import { getCompanyByCodeServer } from '@/lib/server/companies';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { appendAuditLog } from '@/lib/server/audit-log';
import {
  addInvoice,
  addLedgerEntry,
  getAllReservationsServer,
  getBusinessDate,
  init,
} from '@/lib/server/pms-store';
import {
  folioBalance,
  getFolioLinesServer,
  postFolioPaymentServer,
} from '@/lib/server/folio-cash';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

export async function issueCompanyFolioInvoice(
  reservationId: string,
  opts: { user?: string; propertyId?: string } = {},
): Promise<{ invoice: Invoice; clearedBalance: number }> {
  await init();
  const prop = pid(opts.propertyId);
  const user = opts.user ?? 'Muhasebe';
  const businessDate = await getBusinessDate(prop);

  const reservations = await getAllReservationsServer(prop);
  const reservation = reservations.find((r) => r.id === reservationId);
  if (!reservation) throw new Error('Rezervasyon bulunamadı');

  const companyLines = await getFolioLinesServer(reservationId, prop, 'company');
  const balance = folioBalance(companyLines);
  if (balance <= 0) throw new Error('Şirket folyosunda faturalanacak bakiye yok');

  const companyCode = String(reservation.extraData?.companyCode ?? '').trim();
  const companyFromDb = companyCode ? await getCompanyByCodeServer(companyCode, prop) : null;
  const companyName =
    companyFromDb?.name
    || String(reservation.extraData?.companyName ?? '').trim()
    || (reservation.extraData?.payerType === 'Şirket' ? reservation.guestName : '')
    || `Şirket — ${reservation.guestName}`;

  const net = Math.round(balance / 1.1 * 100) / 100;
  const vat = Math.round((balance - net) * 100) / 100;
  const invoiceNo = `SF-${businessDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

  const invoice = await addInvoice({
    no: invoiceNo,
    date: businessDate,
    guest: companyName,
    amount: balance,
    vat,
    status: 'issued',
    type: 'konaklama',
    reservationId,
    companyName,
    ref: reservation.refNo,
  }, prop);

  await addLedgerEntry({
    date: businessDate,
    account: '120 Alacaklar',
    description: `Şirket folyo faturası ${invoiceNo} — ${companyName}`,
    debit: balance,
    credit: 0,
    ref: invoiceNo,
  }, prop);

  await addLedgerEntry({
    date: businessDate,
    account: '600 Konaklama Geliri',
    description: `Şirket folyo faturası ${invoiceNo}`,
    debit: 0,
    credit: net,
    ref: invoiceNo,
  }, prop);

  if (vat > 0) {
    await addLedgerEntry({
      date: businessDate,
      account: '391 Hesaplanan KDV',
      description: `KDV — ${invoiceNo}`,
      debit: 0,
      credit: vat,
      ref: invoiceNo,
    }, prop);
  }

  await postFolioPaymentServer(reservationId, balance, {
    register: 'Ana Kasa',
    user,
    description: `Şirket faturası ${invoiceNo}`,
    propertyId: prop,
    window: 'company',
  });

  await appendAuditLog({
    module: 'folio',
    action: 'company_invoice',
    entityType: 'Invoice',
    entityId: invoice.id,
    user,
    detail: `${invoiceNo} · ${companyName} · ${balance} TRY`,
  }, prop);

  bustReadCaches(prop);
  return { invoice, clearedBalance: balance };
}
