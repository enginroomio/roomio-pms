import { getAllReservationsServer, getProperties } from '@/lib/server/pms-store';

export type PropertyReportRow = {
  propertyId: string;
  code: string;
  name: string;
  city: string | null;
  totalRooms: number;
  reservations: number;
  checkedIn: number;
  arrivalsToday: number;
  occupancyPct: number;
};

export type ConsolidatedReport = {
  generatedAt: string;
  properties: PropertyReportRow[];
  totals: {
    properties: number;
    rooms: number;
    reservations: number;
    checkedIn: number;
  };
};

export async function buildConsolidatedReport(businessDate?: string): Promise<ConsolidatedReport> {
  const today = businessDate ?? new Date().toISOString().slice(0, 10);
  const properties = await getProperties();
  const rows: PropertyReportRow[] = [];

  for (const p of properties) {
    const reservations = await getAllReservationsServer(p.id);
    const checkedIn = reservations.filter((r) => r.status === 'CHECKED_IN').length;
    const arrivalsToday = reservations.filter((r) => r.checkIn === today && r.status !== 'CANCELLED').length;
    const occupancyPct = p.totalRooms > 0 ? Math.round((checkedIn / p.totalRooms) * 1000) / 10 : 0;

    rows.push({
      propertyId: p.id,
      code: p.code,
      name: p.name,
      city: p.city ?? null,
      totalRooms: p.totalRooms,
      reservations: reservations.length,
      checkedIn,
      arrivalsToday,
      occupancyPct,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    properties: rows,
    totals: {
      properties: rows.length,
      rooms: rows.reduce((s, r) => s + r.totalRooms, 0),
      reservations: rows.reduce((s, r) => s + r.reservations, 0),
      checkedIn: rows.reduce((s, r) => s + r.checkedIn, 0),
    },
  };
}

export async function buildConsolidatedCsv(): Promise<string> {
  const report = await buildConsolidatedReport();
  const header = ['Tesis', 'Kod', 'Şehir', 'Oda', 'Rezervasyon', 'Konaklayan', 'Bugün Giriş', 'Doluluk %'];
  const lines = [header.join(',')];
  for (const r of report.properties) {
    lines.push([
      r.name, r.code, r.city ?? '', r.totalRooms, r.reservations,
      r.checkedIn, r.arrivalsToday, r.occupancyPct,
    ].join(','));
  }
  lines.push([
    'TOPLAM', '', '', report.totals.rooms, report.totals.reservations,
    report.totals.checkedIn, '', '',
  ].join(','));
  return lines.join('\n');
}
