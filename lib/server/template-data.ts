/**
 * Şablon export — departman bazlı gerçek / demo veri satırları
 */

import { fieldSample } from '@/lib/reports/field-catalog';
import { getAllRoomsServer } from '@/lib/server/room-inventory-bridge';
import { STATUS_LABELS, type Reservation } from '@/lib/types/reservation';
import type { RoomHkStatus } from '@/lib/types/room';
import {
  getAllReservationsServer,
  getBusinessDate,
  getEodArchiveServer,
  getIdentityNotifications,
  getInvoices,
  getLedgerEntries,
  getStockItems,
  type Invoice,
  type LedgerEntry,
  type ReportTemplate,
  type StockItem,
} from '@/lib/server/pms-store';

type RowDict = Record<string, string>;

const HK_LABELS: Record<RoomHkStatus, string> = {
  CLEAN: 'Temiz',
  DIRTY: 'Kirli',
  INSPECT: 'Onay bekliyor',
  OOO: 'Arızalı',
  DND: 'Rahatsız etmeyin',
  OOS: 'Servis dışı',
};

const HK_ASSIGN: Record<string, { assignedTo?: string; notes?: string }> = {
  '108': { assignedTo: 'Elif K.' },
  '204': { assignedTo: 'Murat S.' },
  '305': { assignedTo: 'Elif K.' },
  '415': { notes: 'Klima arızası' },
};

function nights(ci: string, co: string): number {
  const ms = new Date(co).getTime() - new Date(ci).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

function reservationRow(r: Reservation): RowDict {
  const n = nights(r.checkIn, r.checkOut);
  return {
    refNo: r.refNo,
    guestName: r.guestName,
    email: r.email ?? '',
    phone: r.phone ?? '',
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    roomType: r.roomType,
    roomNo: r.roomNo ?? '',
    adults: String(r.adults),
    children: String(r.children),
    mealPlan: r.mealPlan,
    rate: r.currency === 'TRY' ? `₺${r.rate.toLocaleString('tr-TR')}` : `${r.rate.toLocaleString('tr-TR')} ${r.currency}`,
    totalAmount: `₺${(r.rate * n).toLocaleString('tr-TR')}`,
    nights: String(n),
    agency: r.agency,
    market: r.market,
    status: STATUS_LABELS[r.status],
    notes: r.notes ?? '',
    balance: '₺1.250',
    nationality: 'TR',
    vip: '—',
    vipLevel: '—',
    arrivalTime: '14:00',
    departureTime: '12:00',
    contract: '2026 BAR',
    rooms: String(n),
    revenue: `₺${(r.rate * n).toLocaleString('tr-TR')}`,
    share: '—',
    period: 'Haziran 2026',
  };
}

async function hkRows(reservations: Reservation[], propertyId?: string): Promise<RowDict[]> {
  const inHouse = new Map(
    reservations.filter((r) => r.status === 'CHECKED_IN' && r.roomNo).map((r) => [r.roomNo!, r]),
  );
  const rooms = await getAllRoomsServer(propertyId);
  return rooms.map((room) => {
    const res = inHouse.get(room.roomNo);
    const extra = HK_ASSIGN[room.roomNo];
    return {
      roomNo: room.roomNo,
      floor: String(room.floor),
      roomType: room.typeShort,
      hkStatus: HK_LABELS[room.hkStatus],
      status: res ? 'Dolu' : 'Boş',
      guestName: res?.guestName ?? '',
      checkOut: res?.checkOut ?? '',
      task: room.hkStatus === 'DIRTY' ? 'Checkout temizlik' : room.hkStatus === 'INSPECT' ? 'Onay' : 'Rutin',
      assignedTo: extra?.assignedTo ?? '',
      priority: room.hkStatus === 'DIRTY' ? 'Yüksek' : 'Normal',
      minibar: res ? 'Kontrol' : '—',
      notes: extra?.notes ?? room.specialInfo ?? '',
    };
  });
}

function stockRow(s: StockItem): RowDict {
  return {
    sku: s.sku,
    name: s.name,
    category: s.category,
    qty: String(s.qty),
    minQty: String(s.minQty),
    unit: s.unit,
    unitCost: `₺${s.unitCost}`,
    movement: '—',
    date: '—',
    warehouse: 'Ana depo',
  };
}

function ledgerRow(e: LedgerEntry): RowDict {
  const amount = e.debit > 0 ? e.debit : e.credit;
  return {
    date: e.date,
    invoiceNo: e.ref ?? '—',
    guest: e.description,
    account: e.account,
    description: e.description,
    debit: e.debit > 0 ? `₺${e.debit.toLocaleString('tr-TR')}` : '—',
    credit: e.credit > 0 ? `₺${e.credit.toLocaleString('tr-TR')}` : '—',
    amount: `₺${amount.toLocaleString('tr-TR')}`,
    vat: '—',
    status: 'Kayıtlı',
    type: 'Cari',
    time: e.date,
    register: e.account,
    currency: 'TRY',
    paymentMethod: '—',
    ref: e.ref ?? '',
    user: '—',
    balance: '—',
    roomNo: '—',
  };
}

function invoiceRow(inv: Invoice): RowDict {
  return {
    invoiceNo: inv.no,
    guest: inv.guest,
    date: inv.date,
    amount: `₺${inv.amount.toLocaleString('tr-TR')}`,
    vat: `₺${inv.vat.toLocaleString('tr-TR')}`,
    status: inv.status === 'paid' ? 'Ödendi' : inv.status === 'issued' ? 'Kesildi' : 'Taslak',
    type: inv.type === 'konaklama' ? 'Konaklama' : inv.type === 'banket' ? 'Banket' : 'Ekstra',
    account: inv.guest,
    description: inv.type,
    debit: `₺${inv.amount}`,
    credit: '—',
  };
}

function demoRows(module: string, columns: string[], count = 8): RowDict[] {
  return Array.from({ length: count }, (_, i) => {
    const row: RowDict = {};
    for (const col of columns) {
      const base = fieldSample(module, col);
      row[col] = i === 0 ? base : base.replace(/\d/g, (d) => String((Number(d) + i) % 10));
    }
    return row;
  });
}

function toMatrix(columns: string[], records: RowDict[]): string[][] {
  return records.map((rec) => columns.map((col) => rec[col] ?? '—'));
}

export async function templateDataRows(tpl: ReportTemplate, propertyId?: string): Promise<string[][]> {
  const { module, columns } = tpl;

  switch (module) {
    case 'Rezervasyon':
    case 'Resepsiyon':
    case 'Önbüro':
    case 'Satış & Pazarlama': {
      const reservations = await getAllReservationsServer(propertyId);
      let rows = reservations.map(reservationRow);
      if (module === 'Resepsiyon') {
        rows = rows.filter((r) => r.status === 'Konaklıyor' || r.status === 'Onaylı');
      }
      return toMatrix(columns, rows);
    }
    case 'Kat Hizmetleri': {
      const reservations = await getAllReservationsServer(propertyId);
      return toMatrix(columns, await hkRows(reservations, propertyId));
    }
    case 'Stok & Envanter': {
      const items = await getStockItems(propertyId);
      const rows = items.length ? items.map(stockRow) : demoRows(module, columns);
      return toMatrix(columns, rows);
    }
    case 'Muhasebe': {
      const hasInvoiceCols = columns.some((c) => ['invoiceNo', 'vat', 'type'].includes(c));
      if (hasInvoiceCols) {
        const invoices = await getInvoices(propertyId);
        const rows = invoices.length ? invoices.map(invoiceRow) : demoRows(module, columns);
        return toMatrix(columns, rows);
      }
      const ledger = await getLedgerEntries(propertyId);
      const rows = ledger.length ? ledger.map(ledgerRow) : demoRows(module, columns);
      return toMatrix(columns, rows);
    }
    case 'Ön Kasa': {
      const ledger = await getLedgerEntries(propertyId);
      const rows = ledger.length ? ledger.map(ledgerRow) : demoRows(module, columns);
      return toMatrix(columns, rows);
    }
    case 'Gün Sonu': {
      const archives = await getEodArchiveServer(propertyId);
      const businessDate = await getBusinessDate(propertyId);
      const rows: RowDict[] = archives.length
        ? archives.map((a) => ({
            businessDate: a.businessDate,
            closedAt: a.closedAt,
            closedBy: a.closedBy,
            occupancy: String(a.occupancy),
            roomsSold: '—',
            revenue: `₺${a.revenue.toLocaleString('tr-TR')}`,
            adr: '—',
            revpar: '—',
            reportType: 'Gün sonu paketi',
            date: a.businessDate,
          }))
        : [{
            businessDate,
            closedAt: '—',
            closedBy: '—',
            occupancy: '—',
            revenue: '—',
            adr: '—',
            revpar: '—',
            reportType: 'Henüz kapanmadı',
            date: businessDate,
          }];
      return toMatrix(columns, rows);
    }
    case 'Misafir İlişkileri': {
      const notes = await getIdentityNotifications(propertyId);
      const reservations = await getAllReservationsServer(propertyId);
      if (notes.length) {
        const rows = notes.map((n) => ({
          guestName: n.guestName,
          roomNo: n.roomNo,
          topic: 'Kimlik bildirimi',
          traceType: 'KBS',
          status: n.status === 'sent' ? 'Gönderildi' : 'Bekliyor',
          priority: 'Normal',
          assignedTo: 'Resepsiyon',
          createdAt: n.createdAt,
          resolvedAt: n.sentAt ?? '—',
          rating: '—',
          comment: '—',
          notes: n.nationality,
          checkIn: n.checkIn,
          vipLevel: '—',
        }));
        return toMatrix(columns, rows);
      }
      const vipRows = reservations
        .filter((r) => r.rate > 8000)
        .map((r) => ({
          guestName: r.guestName,
          roomNo: r.roomNo ?? '—',
          vipLevel: 'Gold',
          topic: 'VIP konaklama',
          traceType: 'VIP',
          status: 'Aktif',
          priority: 'Yüksek',
          assignedTo: 'GR',
          createdAt: r.checkIn,
          resolvedAt: '—',
          rating: '—',
          comment: '—',
          notes: r.notes ?? '',
          checkIn: r.checkIn,
        }));
      return toMatrix(columns, vipRows.length ? vipRows : demoRows(module, columns));
    }
    default:
      return toMatrix(columns, demoRows(module, columns));
  }
}
