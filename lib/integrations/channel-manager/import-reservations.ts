import type { ChannelPulledReservation } from '@/lib/integrations/channel-manager/types';
import type { ChannelManagerConfig } from '@/lib/integrations/channel-manager/types';
import { CHANNEL_CATALOG } from '@/lib/integrations/channel-manager/types';
import { addReservationServer, getAllReservationsServer, init, updateReservationServer } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import type { Reservation } from '@/lib/types/reservation';

function channelAgency(channelId: string): string {
  return CHANNEL_CATALOG.find((c) => c.id === channelId)?.name ?? channelId;
}

function channelRefKey(channelId: string, externalRef: string): string {
  return `${channelId}:${externalRef}`;
}

function findByChannelRef(
  reservations: Reservation[],
  channelId: string,
  externalRef: string,
): Reservation | undefined {
  const key = channelRefKey(channelId, externalRef);
  return reservations.find((r) => r.extraData?.channelRef === key);
}

export async function importChannelReservations(
  pulled: ChannelPulledReservation[],
  config: ChannelManagerConfig,
  propertyId = DEFAULT_PROPERTY_ID,
): Promise<number> {
  if (!pulled.length) return 0;

  await init();
  const existing = await getAllReservationsServer(propertyId);
  let imported = 0;
  const now = new Date().toISOString();

  for (const row of pulled) {
    const found = findByChannelRef(existing, row.channelId, row.externalRef);

    if (row.status === 'cancelled') {
      if (found && found.status !== 'CANCELLED') {
        await updateReservationServer(found.id, { status: 'CANCELLED' }, propertyId);
        imported += 1;
      }
      continue;
    }

    if (found) {
      if (row.status === 'modified') {
        await updateReservationServer(
          found.id,
          {
            guestName: row.guestName,
            email: row.email,
            phone: row.phone,
            checkIn: row.checkIn,
            checkOut: row.checkOut,
            roomType: row.roomType,
            adults: row.adults,
            children: row.children ?? found.children,
            rate: row.rate,
            currency: row.currency,
            notes: `Kanal güncellemesi (${row.channelId})`,
          },
          propertyId,
        );
        imported += 1;
      }
      continue;
    }

    const refNo = `OTA-${row.channelId.toUpperCase().slice(0, 3)}-${row.externalRef}`;
    const reservation: Reservation = {
      id: `ch-${row.channelId}-${row.externalRef}-${Date.now()}`,
      refNo,
      guestName: row.guestName,
      email: row.email,
      phone: row.phone,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      roomType: row.roomType,
      adults: row.adults,
      children: row.children ?? 0,
      mealPlan: row.mealPlan ?? 'BB',
      rate: row.rate,
      currency: row.currency,
      agency: channelAgency(row.channelId),
      market: 'OTA',
      status: config.autoConfirmReservations ? 'CONFIRMED' : 'OPTION',
      createdAt: now,
      notes: `Kanal yöneticisi — ${channelAgency(row.channelId)}`,
      extraData: {
        channelRef: channelRefKey(row.channelId, row.externalRef),
        channelId: row.channelId,
        externalRef: row.externalRef,
      },
    };

    await addReservationServer(reservation, propertyId);
    imported += 1;
  }

  return imported;
}
