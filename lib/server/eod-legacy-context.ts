import type { FolioLine } from '@/lib/data/reception-queries';
import type { EodInvoiceRow } from '@/lib/reports/eod-finance-types';
import type { LegacyRenderContext } from '@/lib/reports/eod-legacy-render-utils';
import { getAuditLogsServer } from '@/lib/server/audit-log';
import { getFxExchangesServer } from '@/lib/server/fx-exchanges';
import {
  getCashEntriesServer,
  getFolioBalancesServer,
  getFolioLinesServer,
} from '@/lib/server/folio-cash';
import { getHkRoomMap } from '@/lib/server/housekeeping-service';
import {
  getAllReservationsServer,
  getBusinessDate,
  getEgmIdentities,
  getInvoices,
  getProperty,
  getStockItems,
  type Invoice,
} from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapInvoices(rows: Invoice[]): EodInvoiceRow[] {
  return rows.map((inv) => ({
    id: inv.id,
    no: inv.no,
    date: inv.date,
    guest: inv.guest,
    amount: inv.amount,
    status: inv.status,
    type: inv.type,
    companyName: inv.companyName,
  }));
}

export async function buildLegacyRenderContextServer(
  propertyId?: string,
  businessDate?: string,
  userName = 'GUNSONU',
): Promise<LegacyRenderContext> {
  const prop = pid(propertyId);
  const date = businessDate ?? (await getBusinessDate(prop));
  const property = await getProperty(prop);
  const reservations = await getAllReservationsServer(prop);
  const inHouseIds = reservations.filter((r) => r.status === 'CHECKED_IN').map((r) => r.id);

  const [
    folioBalances,
    cashEntries,
    invoices,
    fxExchanges,
    stockItems,
    egmRecords,
    auditLogs,
    hkRooms,
  ] = await Promise.all([
    getFolioBalancesServer(inHouseIds, prop),
    getCashEntriesServer(prop, date),
    getInvoices(prop),
    getFxExchangesServer(prop, date),
    getStockItems(prop),
    getEgmIdentities(prop),
    getAuditLogsServer(prop, { businessDate: date, limit: 500 }),
    getHkRoomMap(prop),
  ]);

  const folioLinesByReservation: Record<string, FolioLine[]> = {};
  await Promise.all(
    inHouseIds.map(async (id) => {
      const lines = await getFolioLinesServer(id, prop);
      if (lines.length > 0) folioLinesByReservation[id] = lines;
    }),
  );

  return {
    hotelName: (property?.name ?? 'HOTEL').toUpperCase(),
    businessDate: date,
    userName,
    generatedAt: new Date(),
    reservations,
    folioBalances,
    folioLinesByReservation,
    finance: {
      businessDate: date,
      cashEntries,
      invoices: mapInvoices(invoices),
      fxExchanges,
      stockItems,
    },
    hkRooms,
    egmRecords,
    auditLogs,
  };
}
