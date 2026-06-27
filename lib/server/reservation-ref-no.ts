import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { init } from '@/lib/server/pms-store';
import { prisma } from '@/lib/server/prisma';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function parseRefSequence(refNo: string): number | null {
  const trimmed = refNo.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const tail = trimmed.match(/(\d+)$/);
  if (tail) return parseInt(tail[1], 10);
  return null;
}

/** Tesis bazlı sıradaki rezervasyon numarası — 1'den başlar. */
export async function nextReservationRefNoServer(propertyId?: string): Promise<string> {
  await init();
  const prop = pid(propertyId);
  const rows = await prisma.reservation.findMany({
    where: { propertyId: prop },
    select: { refNo: true },
  });
  let max = 0;
  for (const { refNo } of rows) {
    const n = parseRefSequence(refNo);
    if (n != null && n > max) max = n;
  }
  return String(max + 1);
}
