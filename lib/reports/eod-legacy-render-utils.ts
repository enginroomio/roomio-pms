import type { Reservation } from '@/lib/types/reservation';
import type { FolioLine } from '@/lib/data/reception-queries';
import type { AuditEntry } from '@/lib/server/audit-log';
import type { EodFinanceSnapshot } from './eod-finance-types';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { EgmIdentityRecord } from '@/lib/egm/types';

export type LegacyRenderContext = {
  hotelName: string;
  businessDate: string;
  userName: string;
  generatedAt: Date;
  reservations: Reservation[];
  /** Canlı folyo bakiyeleri — `/api/folio?ids=` */
  folioBalances?: Record<string, number>;
  /** Sunucu folyo satırları — paket render */
  folioLinesByReservation?: Record<string, FolioLine[]>;
  /** Kasa, fatura, döviz, stok */
  finance?: EodFinanceSnapshot;
  /** HK oda durumları — `/api/housekeeping/rooms` */
  hkRooms?: Record<string, HkRoomRecord>;
  /** EGM kimlik kayıtları — `/api/egm/identity` */
  egmRecords?: EgmIdentityRecord[];
  /** Denetim izi — folyo audit raporları */
  auditLogs?: AuditEntry[];
};

export function pad(text: string, width: number, align: 'left' | 'right' = 'left'): string {
  const s = text.slice(0, width);
  return align === 'right' ? s.padStart(width) : s.padEnd(width);
}

export function fmtShortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
}

export function fmtFullDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function fmtMoney(n: number): string {
  const neg = n < 0;
  const abs = Math.abs(n);
  const [intPart, decPart = '00'] = abs.toFixed(2).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}${grouped},${decPart}`;
}

export function reportHeader(ctx: LegacyRenderContext, title: string): string[] {
  const date = fmtFullDate(ctx.businessDate);
  const time = ctx.generatedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const user = ctx.userName.toUpperCase();
  return [
    `${pad(ctx.hotelName, 18)}${pad(title, 42, 'left')}${pad(`Tarih : ${date}`, 24, 'right')}`,
    `${''.padEnd(60)}${pad(`Saat  : ${time}`, 24, 'right')}`,
    `${''.padEnd(60)}${pad(`Kullanıcı : ${user}`, 24, 'right')}`,
    '',
  ];
}

export function reportHeaderRoomPrice(ctx: LegacyRenderContext, title: string): string[] {
  const date = fmtFullDate(ctx.businessDate);
  const taken = fmtFullDate(addDaysIso(ctx.businessDate, 1));
  const time = ctx.generatedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return [
    `${pad(ctx.hotelName, 18)}${pad(title, 42, 'left')}${pad(`Tarih : ${date}`, 24, 'right')}`,
    `${''.padEnd(60)}${pad(`Saat  : ${time}`, 24, 'right')}`,
    `${''.padEnd(60)}${pad(`Alındığı T. : ${taken}`, 24, 'right')}`,
    '',
  ];
}
