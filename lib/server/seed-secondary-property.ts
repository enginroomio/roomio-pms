import { prisma } from '@/lib/server/prisma';
import { PROPERTY } from '@/lib/navigation';

const PROP_ANT = 'prop-sapphire-ant';
const BUSINESS_DATE = PROPERTY.businessDate;

const ANTALYA_RESERVATIONS = [
  {
    id: 'ant-r1',
    refNo: 'RSV-ANT-0001',
    guestName: 'Deniz Korkmaz',
    email: 'deniz@example.com',
    checkIn: BUSINESS_DATE,
    checkOut: '2026-06-22',
    roomType: 'DBL',
    roomNo: '201',
    adults: 2,
    children: 0,
    mealPlan: 'BB',
    rate: 4200,
    agency: 'Direct',
    market: 'FIT',
    status: 'CHECKED_IN',
    createdAt: '2026-06-10',
  },
  {
    id: 'ant-r2',
    refNo: 'RSV-ANT-0002',
    guestName: 'Anna Becker',
    email: 'anna@example.de',
    checkIn: BUSINESS_DATE,
    checkOut: '2026-06-25',
    roomType: 'SUI',
    roomNo: '305',
    adults: 2,
    children: 1,
    mealPlan: 'HB',
    rate: 8900,
    agency: 'Booking.com',
    market: 'OTA',
    status: 'CHECKED_IN',
    createdAt: '2026-06-12',
  },
  {
    id: 'ant-r3',
    refNo: 'RSV-ANT-0003',
    guestName: 'Mehmet Öz',
    checkIn: BUSINESS_DATE,
    checkOut: '2026-06-19',
    roomType: 'DBL',
    adults: 2,
    children: 0,
    mealPlan: 'RO',
    rate: 3800,
    agency: 'Direct',
    market: 'FIT',
    status: 'CONFIRMED',
    createdAt: '2026-06-15',
  },
  {
    id: 'ant-r4',
    refNo: 'RSV-ANT-0004',
    guestName: 'Sofia Marin',
    checkIn: '2026-06-17',
    checkOut: BUSINESS_DATE,
    roomType: 'TWN',
    roomNo: '118',
    adults: 2,
    children: 0,
    mealPlan: 'BB',
    rate: 4100,
    agency: 'Expedia',
    market: 'OTA',
    status: 'CHECKED_IN',
    createdAt: '2026-06-08',
  },
  {
    id: 'ant-r5',
    refNo: 'RSV-ANT-0005',
    guestName: 'Corporate Group A',
    checkIn: '2026-06-20',
    checkOut: '2026-06-23',
    roomType: 'TRP',
    adults: 3,
    children: 0,
    mealPlan: 'FB',
    rate: 12500,
    agency: 'TUI',
    market: 'Group',
    status: 'CONFIRMED',
    createdAt: '2026-06-01',
  },
];

const ANTALYA_HK_ROOMS: Array<{ roomNo: string; hkStatus: string; assignedTo?: string }> = [
  { roomNo: '101', hkStatus: 'CLEAN', assignedTo: 'Ayşe H.' },
  { roomNo: '102', hkStatus: 'DIRTY' },
  { roomNo: '118', hkStatus: 'DIRTY', assignedTo: 'Fatma D.' },
  { roomNo: '201', hkStatus: 'CLEAN' },
  { roomNo: '215', hkStatus: 'INSPECT' },
  { roomNo: '305', hkStatus: 'CLEAN', assignedTo: 'Ayşe H.' },
  { roomNo: '401', hkStatus: 'OOO' },
];

let seeded = false;

/** İkincil şube (Antalya) — canlı çoklu tesis verisi */
export async function seedSecondaryPropertyIfEmpty(): Promise<boolean> {
  if (seeded) return false;
  const prop = await prisma.property.findUnique({ where: { id: PROP_ANT } });
  if (!prop) return false;

  const resCount = await prisma.reservation.count({ where: { propertyId: PROP_ANT } });
  if (resCount > 0) {
    seeded = true;
    return false;
  }

  const now = new Date().toISOString().slice(0, 10);

  await prisma.$transaction([
    prisma.reservation.createMany({
      data: ANTALYA_RESERVATIONS.map((r) => ({
        propertyId: PROP_ANT,
        id: r.id,
        refNo: r.refNo,
        guestName: r.guestName,
        email: r.email ?? null,
        phone: null,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        roomType: r.roomType,
        roomNo: r.roomNo ?? null,
        adults: r.adults,
        children: r.children,
        mealPlan: r.mealPlan,
        rate: r.rate,
        currency: 'TRY',
        agency: r.agency,
        market: r.market,
        status: r.status,
        createdAt: r.createdAt,
        notes: null,
      })),
    }),
    prisma.roomHousekeeping.createMany({
      data: ANTALYA_HK_ROOMS.map((r) => ({
        id: `hk-${PROP_ANT}-${r.roomNo}`,
        propertyId: PROP_ANT,
        roomNo: r.roomNo,
        hkStatus: r.hkStatus,
        assignedTo: r.assignedTo ?? null,
        notes: null,
        updatedAt: now,
      })),
    }),
    prisma.invoice.createMany({
      data: [
        {
          id: 'inv-ant-1',
          propertyId: PROP_ANT,
          no: 'FTR-ANT-0101',
          date: BUSINESS_DATE,
          guest: 'Deniz Korkmaz',
          amount: 16800,
          vat: 3024,
          status: 'paid',
          type: 'konaklama',
        },
        {
          id: 'inv-ant-2',
          propertyId: PROP_ANT,
          no: 'FTR-ANT-0102',
          date: BUSINESS_DATE,
          guest: 'Beach Event Co.',
          amount: 89000,
          vat: 16020,
          status: 'issued',
          type: 'banket',
        },
      ],
    }),
    prisma.ledgerEntry.createMany({
      data: [
        {
          id: 'lg-ant-1',
          propertyId: PROP_ANT,
          date: BUSINESS_DATE,
          account: 'TUI',
          description: 'Grup avans',
          debit: 25000,
          credit: 0,
          ref: 'AV-ANT-01',
        },
      ],
    }),
    prisma.reportTemplate.createMany({
      data: [
        {
          id: 'tpl-ant-fo',
          propertyId: PROP_ANT,
          name: 'FO Günlük Durum (Antalya)',
          module: 'Önbüro',
          columns: '["refNo","guestName","checkIn","checkOut","status"]',
          kind: 'report',
          pageId: null,
          layout: null,
          updatedAt: now,
        },
      ],
    }),
  ]);

  seeded = true;
  return true;
}
