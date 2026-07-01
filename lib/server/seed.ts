import bcrypt from 'bcryptjs';
import { DEFAULT_HK_ROOMS } from '@/lib/data/hk-defaults';
import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { DEMO_ROOM_BLOCKS } from '@/lib/data/room-blocks';
import { PROPERTY } from '@/lib/navigation';
import { DEFAULT_PROPERTY_ID, DEMO_SECONDARY_PROPERTY_ID, DEMO_USER_PROPERTY_IDS } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { archiveEodDayPackage } from '@/lib/server/eod-archive-package';

const DEMO_PASSWORD = 'roomio123';
const PROP_IST = DEFAULT_PROPERTY_ID;
const PROP_ANT = DEMO_SECONDARY_PROPERTY_ID;

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

let seedPromise: Promise<boolean> | null = null;

const DEMO_USERS = [
  { id: 'user-arda', email: 'arda@hotelsapphire.com', name: 'Arda Yılmaz', role: 'fo_manager' },
  { id: 'user-admin', email: 'admin@roomio.local', name: 'Sistem Admin', role: 'admin' },
  { id: 'user-hk', email: 'hk@hotelsapphire.com', name: 'Elif Kaya', role: 'hk' },
  { id: 'user-acc', email: 'muhasebe@hotelsapphire.com', name: 'Selin Demir', role: 'accounting' },
  { id: 'user-viewer', email: 'viewer@hotelsapphire.com', name: 'Deniz Salt', role: 'viewer' },
  { id: 'user-reception', email: 'reception@hotelsapphire.com', name: 'Can Demir', role: 'reception' },
] as const;

/** Eksik demo kullanıcıları ekler (eski seed DB'ler için). */
async function ensureDemoUsers(): Promise<boolean> {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let created = false;
  for (const u of DEMO_USERS) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await prisma.user.create({ data: { ...u, passwordHash: hash } });
      const propertyIds = DEMO_USER_PROPERTY_IDS[u.id];
      if (propertyIds?.length) {
        await prisma.userProperty.createMany({
          data: propertyIds.map((propertyId) => ({ userId: u.id, propertyId })),
        });
      }
      created = true;
    }
  }
  return created;
}

async function performSeed(): Promise<boolean> {
  if (process.env.ROOMIO_SKIP_DEMO_SEED === '1') return false;

  const count = await prisma.property.count();
  if (count > 0) return false;

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date().toISOString().slice(0, 10);
  const forceAdminPwdChange =
    process.env.ROOMIO_FORCE_ADMIN_PASSWORD_CHANGE === '1'
    || (process.env.NODE_ENV === 'production' && process.env.ROOMIO_DEMO_AUTH !== '1');

  try {
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
      data: DEMO_USERS.map((u) => ({
        ...u,
        passwordHash: hash,
        mustChangePassword: u.role === 'admin' && forceAdminPwdChange,
      })),
    }),
    // Şube erişim ataması: admin rolü `userHasAllPropertyAccess` ile zaten
    // tüm şubelere erişir (UserProperty kaydına gerek yok). `fo_manager`
    // (Arda) her iki demo şubeyi de yönetir — e2e çoklu şube testleri bunu
    // bekler (bkz. e2e/multiproperty-live.spec.ts). Diğer roller varsayılan
    // olarak yalnızca ana şubeye (İstanbul) atanır; gerekirse Ayarlar >
    // Kullanıcılar ekranından genişletilebilir.
    prisma.userProperty.createMany({
      data: Object.entries(DEMO_USER_PROPERTY_IDS).flatMap(([userId, propertyIds]) =>
        propertyIds.map((propertyId) => ({ userId, propertyId })),
      ),
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
        extraData: r.extraData ? JSON.stringify(r.extraData) : null,
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
        { id: 'arc-1', propertyId: PROP_IST, businessDate: '2026-06-17', closedAt: '2026-06-17 23:58', closedBy: 'Murat S.', occupancy: 72, revenue: 284500, status: 'closed', reportCount: 51 },
        { id: 'arc-2', propertyId: PROP_IST, businessDate: '2026-06-16', closedAt: '2026-06-16 23:55', closedBy: 'Selin K.', occupancy: 68, revenue: 251200, status: 'closed', reportCount: 51 },
      ],
    }),
    prisma.identityNotification.createMany({
      data: [
        {
          id: 'id-1', propertyId: PROP_IST, reservationId: 'rez-08', refNo: '8',
          guestName: 'Marco Rossi', firstName: 'Marco', lastName: 'Rossi',
          roomNo: '118', nationality: 'IT', idNo: 'YA1234567', idType: 'PASSPORT',
          birthDate: '1985-03-12', birthPlace: 'Roma', gender: 'E',
          fatherName: 'Giuseppe', motherName: 'Maria',
          checkIn: '2026-06-18', checkOut: '2026-06-22', status: 'sent',
          sentAt: '2026-06-18 15:02', egmRef: 'EGM-DEMO-001', createdAt: '2026-06-18 14:55',
        },
        {
          id: 'id-2', propertyId: PROP_IST, reservationId: 'rez-07', refNo: '7',
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
    await ensureDemoGrSnapshots();
    return true;
  } catch (err) {
    if ((await prisma.property.count()) > 0) return false;
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
    if (code === 'P2002' || code === 'P2003') return false;
    throw err;
  }
}

async function ensureDemoGrSnapshots(): Promise<void> {
  const expectedSnapshots = 51;
  const archives = await prisma.eodArchive.findMany({
    where: { id: { in: ['arc-1', 'arc-2'] } },
    select: { id: true, propertyId: true, businessDate: true, closedBy: true },
  });
  for (const arc of archives) {
    const existing = await prisma.eodGrSnapshot.count({ where: { archiveId: arc.id } });
    if (existing >= expectedSnapshots) continue;
    try {
      const result = await archiveEodDayPackage(arc.id, arc.businessDate, arc.closedBy, arc.propertyId);
      console.log(`[seed] EOD arşiv: ${arc.id} → ${result.totalCount} rapor (önceki: ${existing})`);
      await prisma.eodArchive.update({
        where: { id: arc.id },
        data: { reportCount: result.totalCount, generatedAt: result.manifest.generatedAt },
      });
    } catch {
      // Demo snapshot üretimi başarısız olsa da seed devam etsin
    }
  }
}

export async function seedDatabaseIfEmpty(): Promise<boolean> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const full = await performSeed().catch(async (err) => {
        if ((await prisma.property.count()) > 0) return false;
        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
        if (code === 'P2002' || code === 'P2003') return false;
        throw err;
      });
      const users = await ensureDemoUsers();
      return full || users;
    })();
  }
  return seedPromise;
}
