'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { resolveAgencyCode, resolveAgencyDisplayName, resolveReservationRoomNo } from '@/lib/reservations/agency-code';
import type { AgencyContractRef } from '@/lib/reservations/agency-code';
import {
  formatDateElektra,
  formatGuestList,
  REZ_LIST_STATUS,
} from '@/lib/reservations/display';
import { formatMealPlanList } from '@/lib/reservations/meal-plan-display';
import { resolveRoomTypeTone } from '@/lib/reservations/room-type-colors';
import type { RezListColumnId } from '@/lib/reservations/list-columns';
import { agencyCellTone, reservationExtra, type ReservationListRow } from '@/lib/reservations/list-tabs';

export type RoomTypeLookup = Map<string, { short: string; name: string }>;

export type ColumnRenderContext = {
  agencyLookup: Map<string, string>;
  agencyContracts: AgencyContractRef[];
  roomTypeLookup: RoomTypeLookup;
  router: AppRouterInstance;
};

function RoomNoCell({ roomNo }: { roomNo?: string }) {
  const value = roomNo?.trim();
  return (
    <td className="roomio-rez-pro__room">
      {value ? (
        <Link href={`/rooms?focus=${value}`} className="roomio-link">
          <strong>{value}</strong>
        </Link>
      ) : null}
    </td>
  );
}

function formatRoomType(code: string, lookup: RoomTypeLookup): string {
  const row = lookup.get(code);
  if (row) return row.short || code;
  return code;
}

export function renderReservationListColumn(
  columnId: RezListColumnId,
  row: ReservationListRow,
  ctx: ColumnRenderContext,
): ReactNode {
  if (row.kind === 'block') {
    const { block } = row;
    switch (columnId) {
      case 'roomNo':
        return <RoomNoCell roomNo={block.roomNo} />;
      case 'agency':
        return (
          <td>
            <span className="roomio-rez-agency roomio-rez-agency--block">BLOKAJ</span>
          </td>
        );
      case 'guest':
        return <td className="roomio-rez-pro__guest">{block.reason}</td>;
      case 'voucher':
        return <td>—</td>;
      case 'refNo':
        return (
          <td>
            <Link href={`/rooms?tab=blocking&focus=${block.roomNo}`} className="roomio-link">
              <strong>{block.id}</strong>
            </Link>
          </td>
        );
      case 'checkIn':
        return <td>{formatDateElektra(block.from)}</td>;
      case 'checkOut':
        return <td>{formatDateElektra(block.to)}</td>;
      case 'roomType':
        return (
          <td>
            <span className="roomio-rez-agency roomio-rez-room-type--ooo" title="Out of Order">
              OOO
            </span>
          </td>
        );
      case 'mealPlan':
        return <td>—</td>;
      case 'adults':
      case 'children':
      case 'infants':
        return <td className="roomio-rez-pro__num">—</td>;
      case 'roomCount':
        return <td className="roomio-rez-pro__num">1</td>;
      case 'nationality':
        return <td>—</td>;
      case 'idNo':
        return <td className="roomio-rez-pro__mono">{block.blockedBy}</td>;
      case 'createdBy':
        return <td>{block.blockedBy}</td>;
      case 'status':
        return (
          <td>
            <span className="roomio-rez-status rez-status--option">Blokaj</span>
          </td>
        );
      default:
        return <td>—</td>;
    }
  }

  const r = row.reservation;
  const agencyCode = resolveAgencyCode(r, ctx.agencyLookup);
  const agencyLabel = resolveAgencyDisplayName(r, ctx.agencyContracts);
  const agencyTone = agencyCellTone(agencyCode);
  const roomNo = resolveReservationRoomNo(r);
  const status = REZ_LIST_STATUS[r.status];
  const voucher = reservationExtra(r, 'voucherNo') || r.refNo.slice(-8);
  const nationality = reservationExtra(r, 'nationality') || reservationExtra(r, 'uyruk') || '—';
  const idNo = reservationExtra(r, 'idNo') || reservationExtra(r, 'tckn') || '—';
  const infants = Number(reservationExtra(r, 'infants') || '0') || 0;
  const createdBy = reservationExtra(r, 'createdBy') || reservationExtra(r, 'kayitYapan') || '—';
  const meal = formatMealPlanList(r.mealPlan);

  switch (columnId) {
    case 'roomNo':
      return <RoomNoCell roomNo={roomNo} />;
    case 'agency':
      return (
        <td className="roomio-rez-pro__agency">
          <span className={`roomio-rez-agency roomio-rez-agency--${agencyTone}`} title={agencyCode}>
            {agencyLabel}
          </span>
        </td>
      );
    case 'guest':
      return <td className="roomio-rez-pro__guest">{formatGuestList(r.guestName)}</td>;
    case 'voucher':
      return (
        <td>
          <span className="roomio-rez-voucher">{voucher}</span>
        </td>
      );
    case 'refNo':
      return (
        <td>
          <Link href={`/reservations/${r.id}`} className="roomio-link">
            <strong>{r.refNo}</strong>
          </Link>
        </td>
      );
    case 'checkIn':
      return <td>{formatDateElektra(r.checkIn)}</td>;
    case 'checkOut':
      return <td>{formatDateElektra(r.checkOut)}</td>;
    case 'roomType': {
      const typeLabel = formatRoomType(r.roomType, ctx.roomTypeLookup);
      const typeTone = resolveRoomTypeTone(r.roomType);
      const typeName = ctx.roomTypeLookup.get(r.roomType)?.name;
      return (
        <td title={typeName}>
          <span className={`roomio-rez-agency roomio-rez-room-type--${typeTone}`}>
            {typeLabel}
          </span>
        </td>
      );
    }
    case 'mealPlan':
      return (
        <td title={`${meal.label} (${meal.code})`}>
          <span className="roomio-rez-meal">{meal.code}</span>
        </td>
      );
    case 'adults':
      return <td className="roomio-rez-pro__num">{r.adults}</td>;
    case 'children':
      return <td className="roomio-rez-pro__num">{r.children}</td>;
    case 'infants':
      return <td className="roomio-rez-pro__num">{infants}</td>;
    case 'roomCount':
      return <td className="roomio-rez-pro__num">1</td>;
    case 'nationality':
      return <td>{nationality}</td>;
    case 'idNo':
      return <td className="roomio-rez-pro__mono">{idNo}</td>;
    case 'createdBy':
      return <td>{createdBy}</td>;
    case 'status':
      return (
        <td>
          <span className={`roomio-rez-status ${status.className}`}>{status.label}</span>
        </td>
      );
    default:
      return <td>—</td>;
  }
}
