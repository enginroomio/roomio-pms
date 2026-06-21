import bcrypt from 'bcryptjs';
import { DEFAULT_HK_ROOMS } from '@/lib/data/hk-defaults';
import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { DEMO_ROOM_BLOCKS } from '@/lib/data/room-blocks';
import { PROPERTY } from '@/lib/navigation';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';

const DEMO_PASSWORD = 'roomio123';
const PROP_IST = DEFAULT_PROPERTY_ID;
const PROP_ANT = 'prop-sapphire-ant';

const DEFAULT_TEMPLATES = [
  { id: 'tpl-fo-daily', name: 'FO Günlük Durum', module: 'Önbüro', columns: '["refNo","guestName","checkIn","checkOut","status"]' },
  { id: 'tpl-hk-room', name: 'HK Oda Durumu', module: 'Kat Hizmetleri', columns: '["roomNo","status","hkStatus"]' },
  { id: 'tpl-cs-cash', name: 'Kasa Defteri Özet', module: 'Ön Kasa', columns: '["time","register","amount","type"]' },
];

const LOCALE_SEED = [
  { locale: 'tr', key: 'nav.home', value: 'Ana Sayfa' },
  { locale: 'tr', key: 'nav.reservations', value: 'Rezervasyon' },
  { locale: 'tr', key: 'nav.reception', value: 'Resepsiyon' },
  { locale: 'en', key: 'nav.home', value: 'Home' },
  { locale: 'en', key: 'nav.reservations', value: 'Reservations' },
  { locale: 'en', key: 'nav.reception', value: 'Front Office' },
];

export async function seedDatabaseIfEmpty(): Promise<boolean> {
  const count = await prisma.property.count();
  if (count > 0) return false;

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date().toISOString().slice(0, 10);

  await prisma.$transaction([
    prisma.property.createMany({
      data: [
        { id: PROP_IST, code: 'SAPPHIRE-IST', name: 'Hotel Sapphire İstanbul', city: 'İstanbul', totalRooms: 77, isDefault: true, createdAt: now },
        { id: PROP_ANT, code: 'SAPPHIRE-ANT', name: 'Hotel Sapphire Antalya', city: 'Antalya', totalRooms: 120, isDefault: false, createdAt: now },
      ],
    }),
    prisma.appState.createMany({
      data: [
        { propertyId: PROP_IST, businessDate: PROPERTY.businessDate },
        { propertyId: PROP_ANT, businessDate: PROPERTY.businessDate },
      ],
    }),
    prisma.user.createMany({
      data: [
        { id: 'user-arda', email: 'arda@hotelsapphire.com', name: 'Arda Yılmaz', role: 'fo_manager', passwordHash: hash },
        { id: 'user-admin', email: 'admin@roomio.local', name: 'Sistem Admin', role: 'admin', passwordHash: hash },
        { id: 'user-hk', email: 'hk@hotelsapphire.com', name: 'Elif Kaya', role: 'hk', passwordHash: hash },
        { id: 'user-acc', email: 'muhasebe@hotelsapphire.com', name: 'Selin Demir', role: 'accounting', passwordHash: hash },
      ],
    }),
    prisma.reservation.createMany({
      data: DEMO_RESERVATIONS.map((r) => ({
        propertyId: PROP_IST,
        id: r.id,
        refNo: r.refNo,
        guestName: r.guestName,
        email: r.email ?? null,
        phone: r.phone ?? null,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        roomType: r.roomType,
        roomNo: r.roomNo ?? null,
        adults: r.adults,
        children: r.children,
        mealPlan: r.mealPlan,
        rate: r.rate,
        currency: r.currency,
        agency: r.agency,
        market: r.market,
        status: r.status,
        createdAt: r.createdAt,
        notes: r.notes ?? null,
      })),
    }),
    prisma.roomBlock.createMany({
      data: DEMO_ROOM_BLOCKS.map((b) => ({
        propertyId: PROP_IST,
        id: b.id,
        roomNo: b.roomNo,
        fromDate: b.from,
        toDate: b.to,
        reason: b.reason,
        blockedBy: b.blockedBy,
        status: b.status,
      })),
    }),
    prisma.eodArchive.createMany({
      data: [
        { id: 'arc-1', propertyId: PROP_IST, businessDate: '2026-06-17', closedAt: '2026-06-17 23:58', closedBy: 'Murat S.', occupancy: 72, revenue: 284500 },
        { id: 'arc-2', propertyId: PROP_IST, businessDate: '2026-06-16', closedAt: '2026-06-16 23:55', closedBy: 'Selin K.', occupancy: 68, revenue: 251200 },
      ],
    }),
    prisma.identityNotification.createMany({
      data: [
        {
          id: 'id-1', propertyId: PROP_IST, reservationId: '11', refNo: 'RSV-2026-0152',
          guestName: 'Marco Rossi', firstName: 'Marco', lastName: 'Rossi',
          roomNo: '118', nationality: 'IT', idNo: 'YA1234567', idType: 'PASSPORT',
          birthDate: '1985-03-12', birthPlace: 'Roma', gender: 'E',
          fatherName: 'Giuseppe', motherName: 'Maria',
          checkIn: '2026-06-18', checkOut: '2026-06-22', status: 'sent',
          sentAt: '2026-06-18 15:02', egmRef: 'EGM-DEMO-001', createdAt: '2026-06-18 14:55',
        },
        {
          id: 'id-2', propertyId: PROP_IST, reservationId: '10', refNo: 'RSV-2026-0151',
          guestName: 'Zeynep Ak', firstName: 'Zeynep', lastName: 'Ak',
          roomNo: '215', nationality: 'TR', idNo: '12345678901', idType: 'TCKN',
          birthDate: '1992-07-08', birthPlace: 'İstanbul', gender: 'K',
          fatherName: 'Mehmet', motherName: 'Ayşe',
          checkIn: '2026-06-18', checkOut: '2026-06-20', status: 'ready',
          createdAt: '2026-06-18 16:10',
        },
      ],
    }),
    prisma.invoice.createMany({
      data: [
        { id: 'inv-1', propertyId: PROP_IST, no: 'FTR-2026-0892', date: '2026-06-18', guest: 'Ayşe Yılmaz', amount: 20800, vat: 3744, status: 'paid', type: 'konaklama' },
        { id: 'inv-2', propertyId: PROP_IST, no: 'FTR-2026-0893', date: '2026-06-18', guest: 'Tech Summit Gala', amount: 145000, vat: 26100, status: 'issued', type: 'banket' },
        { id: 'inv-3', propertyId: PROP_IST, no: 'FTR-2026-0894', date: '2026-06-17', guest: 'James Miller', amount: 3500, vat: 630, status: 'paid', type: 'konaklama' },
      ],
    }),
    prisma.stockItem.createMany({
      data: [
        { id: 'st-1', propertyId: PROP_IST, sku: 'HK-TWL-001', name: 'Havlu (banyo)', category: 'HK', unit: 'adet', qty: 420, minQty: 200, unitCost: 85 },
        { id: 'st-2', propertyId: PROP_IST, sku: 'FB-MN-012', name: 'Minibar su 0.33', category: 'F&B', unit: 'adet', qty: 180, minQty: 100, unitCost: 12 },
        { id: 'st-3', propertyId: PROP_ANT, sku: 'HK-TWL-001', name: 'Havlu (banyo)', category: 'HK', unit: 'adet', qty: 600, minQty: 300, unitCost: 85 },
      ],
    }),
    prisma.ledgerEntry.createMany({
      data: [
        { id: 'lg-1', propertyId: PROP_IST, date: '2026-06-18', account: 'Booking.com', description: 'HAZİRAN tahakkuk', debit: 42800, credit: 0, ref: 'FTR-0890' },
        { id: 'lg-2', propertyId: PROP_IST, date: '2026-06-18', account: 'Booking.com', description: 'Tahsilat', debit: 0, credit: 38200, ref: 'TH-4412' },
      ],
    }),
    prisma.reportTemplate.createMany({
      data: DEFAULT_TEMPLATES.map((t) => ({
        ...t,
        propertyId: PROP_IST,
        updatedAt: '2026-06-10',
      })),
    }),
    prisma.localeEntry.createMany({
      data: LOCALE_SEED.map((e, i) => ({
        id: `loc-${i}`,
        propertyId: PROP_IST,
        locale: e.locale,
        key: e.key,
        value: e.value,
      })),
    }),
    prisma.roomHousekeeping.createMany({
      data: Object.entries(DEFAULT_HK_ROOMS).map(([roomNo, row]) => ({
        id: `hk-${PROP_IST}-${roomNo}`,
        propertyId: PROP_IST,
        roomNo,
        hkStatus: row.hkStatus,
        assignedTo: row.assignedTo ?? null,
        notes: row.notes ?? null,
        updatedAt: now,
      })),
    }),
  ]);

  return true;
}
