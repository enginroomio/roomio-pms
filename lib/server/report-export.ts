import {
  buildCategoryPdfKit,
  buildEodPdfKit,
  buildReservationPdfKit,
} from '@/lib/server/pdf-templates';
import { getAllReservationsServer, getBusinessDate, getProperty } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { CATEGORY_REPORTS } from '@/lib/data/eod';
import { PROPERTY } from '@/lib/navigation';
import type { Reservation } from '@/lib/types/reservation';

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function hotelName(propertyId?: string): Promise<string> {
  const prop = await getProperty(propertyId ?? DEFAULT_PROPERTY_ID);
  return prop?.name ?? PROPERTY.name;
}

export async function buildReservationCsv(propertyId?: string): Promise<string> {
  const rows = await getAllReservationsServer(propertyId);
  const header = ['Rez.No', 'Misafir', 'Giriş', 'Çıkış', 'Tip', 'Oda', 'Acenta', 'Fiyat', 'Durum'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      r.refNo, r.guestName, r.checkIn, r.checkOut, r.roomType,
      r.roomNo ?? '', r.agency, r.rate, r.status,
    ].map(escapeCsv).join(','));
  }
  return lines.join('\n');
}

export async function buildCategoryCsv(category: string, propertyId?: string): Promise<string> {
  const reports = CATEGORY_REPORTS[category] ?? [{ id: 'summary', name: `${category} Özet`, format: 'CSV' }];
  const reservations = await getAllReservationsServer(propertyId);
  const header = ['Rapor', 'Kayıt', 'Değer'];
  const lines = [header.join(',')];
  for (const rep of reports) {
    lines.push([rep.name, 'count', reservations.length].map(escapeCsv).join(','));
    lines.push([rep.name, 'generated', new Date().toISOString()].map(escapeCsv).join(','));
  }
  return lines.join('\n');
}

export async function buildReservationPdf(propertyId?: string): Promise<Buffer> {
  const rows = await getAllReservationsServer(propertyId);
  const businessDate = await getBusinessDate(propertyId);
  const hotel = await hotelName(propertyId);
  return buildReservationPdfKit('Rezervasyon Raporu', {
    hotel,
    businessDate,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  }, rows);
}

export async function buildEodPdf(businessDate: string, occupancy: number, revenue: number, closedBy = 'Sistem'): Promise<Buffer> {
  return buildEodPdfKit(businessDate, occupancy, revenue, closedBy);
}

export async function buildCategoryPdf(category: string, propertyId?: string): Promise<Buffer> {
  const reports = CATEGORY_REPORTS[category] ?? [];
  const reservations = await getAllReservationsServer(propertyId);
  const lines = [
    `Kategori: ${category}`,
    `Kayıt sayısı: ${reservations.length}`,
    `Oluşturma: ${new Date().toISOString()}`,
    '',
    ...reports.map((r) => `• ${r.name} (${r.format})`),
  ];
  return buildCategoryPdfKit(category, lines);
}

export function availabilityMatrix(reservations: Reservation[], from: string, days: number) {
  const start = new Date(from);
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const types = ['SGL', 'DBL', 'TWN', 'TRP', 'SUI'] as const;
  const capacity: Record<string, number> = { SGL: 12, DBL: 28, TWN: 18, TRP: 8, SUI: 4 };

  return dates.map((date) => {
    const booked = reservations.filter(
      (r) => r.status !== 'CANCELLED' && r.checkIn <= date && r.checkOut > date,
    );
    const byType = Object.fromEntries(types.map((t) => [t, booked.filter((r) => r.roomType === t).length])) as Record<string, number>;
    const cells = types.map((t) => ({
      type: t,
      booked: byType[t] ?? 0,
      available: Math.max(0, (capacity[t] ?? 0) - (byType[t] ?? 0)),
      total: capacity[t] ?? 0,
      occupancyPct:
        (capacity[t] ?? 0) > 0
          ? Math.round(((byType[t] ?? 0) / (capacity[t] ?? 0)) * 100)
          : 0,
    }));
    const totalRooms = cells.reduce((s, c) => s + c.total, 0);
    const totalBooked = cells.reduce((s, c) => s + c.booked, 0);
    const totalAvail = cells.reduce((s, c) => s + c.available, 0);
    const occupancyPct = totalRooms > 0 ? Math.round((totalBooked / totalRooms) * 100) : 0;
    return { date, cells, totalAvail, totalBooked, totalRooms, occupancyPct };
  });
}
