import type { FxExchange } from '@/lib/data/cash';
import { DEMO_FX_EXCHANGES } from '@/lib/data/cash';
import { foreignToTryExchange, rateMapFromRows } from '@/lib/exchange/money';
import { appendAuditLog } from '@/lib/server/audit-log';
import { getExchangeRatesSnapshot } from '@/lib/server/exchange-rates-service';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { getBusinessDate, init } from '@/lib/server/pms-store';
import { postManualCashEntryServer } from '@/lib/server/reception-ops';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

function mapRow(r: {
  id: string;
  time: string;
  guest: string;
  roomNo: string;
  fromCurrency: string;
  fromAmount: number;
  rate: number;
  tryAmount: number;
  user: string;
}): FxExchange {
  return {
    id: r.id,
    time: r.time,
    guest: r.guest,
    roomNo: r.roomNo,
    fromCurrency: r.fromCurrency as FxExchange['fromCurrency'],
    fromAmount: r.fromAmount,
    rate: r.rate,
    tryAmount: r.tryAmount,
    user: r.user,
  };
}

export async function seedFxExchangesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.fxExchange.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const businessDate = await getBusinessDate(prop);
  await prisma.fxExchange.createMany({
    data: DEMO_FX_EXCHANGES.map((fx) => ({
      id: `${prop}-${fx.id}`,
      propertyId: prop,
      businessDate,
      time: fx.time,
      guest: fx.guest,
      roomNo: fx.roomNo,
      fromCurrency: fx.fromCurrency,
      fromAmount: fx.fromAmount,
      rate: fx.rate,
      tryAmount: fx.tryAmount,
      user: fx.user,
    })),
  });
}

export async function getFxExchangesServer(
  propertyId?: string,
  businessDate?: string,
): Promise<FxExchange[]> {
  await init();
  await seedFxExchangesIfEmpty(propertyId);
  const prop = pid(propertyId);
  const date = businessDate ?? await getBusinessDate(prop);
  const rows = await prisma.fxExchange.findMany({
    where: { propertyId: prop, businessDate: date },
    orderBy: { time: 'desc' },
  });
  return rows.map(mapRow);
}

export async function postFxExchangeServer(
  data: {
    guest: string;
    roomNo: string;
    reservationId?: string;
    fromCurrency: 'EUR' | 'USD' | 'GBP';
    fromAmount: number;
    user?: string;
    register?: string;
  },
  propertyId?: string,
): Promise<FxExchange> {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const snapshot = await getExchangeRatesSnapshot(prop);
  const map = rateMapFromRows(snapshot.rates);
  const row = map.get(data.fromCurrency);
  if (!row?.tryPerUnitExchange) {
    throw new Error(`${data.fromCurrency} kuru bulunamadı`);
  }

  const rate = row.tryPerUnitExchange;
  const tryAmount = Math.round(foreignToTryExchange(data.fromAmount, data.fromCurrency, map));
  const time = nowTime();
  const user = data.user ?? 'Resepsiyon';
  const id = `fx-${Date.now()}`;

  await prisma.fxExchange.create({
    data: {
      id,
      propertyId: prop,
      businessDate,
      time,
      guest: data.guest,
      roomNo: data.roomNo,
      reservationId: data.reservationId ?? null,
      fromCurrency: data.fromCurrency,
      fromAmount: data.fromAmount,
      rate,
      tryAmount,
      user,
    },
  });

  await postManualCashEntryServer({
    register: data.register ?? 'Ana Kasa',
    type: 'doviz',
    amount: tryAmount,
    description: `${data.fromCurrency} bozdurma — ${data.guest} · Oda ${data.roomNo}`,
    user,
    currency: 'TRY',
  }, prop);

  await appendAuditLog({
    module: 'cash',
    action: 'fx_exchange',
    entityType: 'FxExchange',
    entityId: id,
    user,
    detail: `${data.fromAmount} ${data.fromCurrency} → ${tryAmount} TRY @ ${rate.toFixed(4)}`,
  }, prop);

  bustReadCaches(prop);
  return {
    id,
    time,
    guest: data.guest,
    roomNo: data.roomNo,
    fromCurrency: data.fromCurrency,
    fromAmount: data.fromAmount,
    rate,
    tryAmount,
    user,
  };
}
