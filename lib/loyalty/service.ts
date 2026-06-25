import {
  calculateLoyaltyPoints,
  loadLoyaltyConfig,
} from '@/lib/integrations/loyalty/client';
import type { LoyaltyConfig, LoyaltyTier } from '@/lib/integrations/loyalty/types';
import { appendAuditLog } from '@/lib/server/audit-log';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';

import type {
  LoyaltyAccountRecord,
  LoyaltySummary,
  LoyaltyTransactionRecord,
} from '@/lib/loyalty/types';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

function toAccount(row: {
  id: string;
  propertyId: string;
  guestName: string;
  email: string;
  phone: string | null;
  tierId: string;
  tierName: string;
  points: number;
  lifetimeNights: number;
  lifetimeSpend: number;
  createdAt: string;
  updatedAt: string;
}): LoyaltyAccountRecord {
  return {
    id: row.id,
    propertyId: row.propertyId,
    guestName: row.guestName,
    email: row.email,
    phone: row.phone ?? undefined,
    tierId: row.tierId,
    tierName: row.tierName,
    points: row.points,
    lifetimeNights: row.lifetimeNights,
    lifetimeSpend: row.lifetimeSpend,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toTransaction(row: {
  id: string;
  propertyId: string;
  accountId: string;
  type: string;
  points: number;
  balanceAfter: number;
  reservationId: string | null;
  refNo: string | null;
  description: string;
  createdAt: string;
}): LoyaltyTransactionRecord {
  return {
    id: row.id,
    propertyId: row.propertyId,
    accountId: row.accountId,
    type: row.type as LoyaltyTransactionRecord['type'],
    points: row.points,
    balanceAfter: row.balanceAfter,
    reservationId: row.reservationId ?? undefined,
    refNo: row.refNo ?? undefined,
    description: row.description,
    createdAt: row.createdAt,
  };
}

export function resolveTier(
  config: LoyaltyConfig,
  account: { lifetimeNights: number; lifetimeSpend: number },
): LoyaltyTier {
  const sorted = [...config.tiers].sort((a, b) => a.minNights - b.minNights || a.minSpend - b.minSpend);
  let matched = sorted[0];
  for (const tier of sorted) {
    if (account.lifetimeNights >= tier.minNights && account.lifetimeSpend >= tier.minSpend) {
      matched = tier;
    }
  }
  return matched ?? config.tiers[0];
}

export function applyTierDiscount(
  config: LoyaltyConfig,
  account: { lifetimeNights: number; lifetimeSpend: number },
  amountTry: number,
): { discounted: number; discountPercent: number; tierName: string } {
  const tier = resolveTier(config, account);
  const discountPercent = tier.discountPercent;
  const discounted = Math.round(amountTry * (1 - discountPercent / 100));
  return { discounted, discountPercent, tierName: tier.name };
}

export async function ensureLoyaltyAccount(input: {
  guestName: string;
  email: string;
  phone?: string;
  propertyId?: string;
}): Promise<LoyaltyAccountRecord> {
  const prop = pid(input.propertyId);
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.loyaltyAccount.findUnique({
    where: { propertyId_email: { propertyId: prop, email } },
  });
  if (existing) return toAccount(existing);

  const config = await loadLoyaltyConfig();
  const tier = resolveTier(config, { lifetimeNights: 0, lifetimeSpend: 0 });
  const now = new Date().toISOString();
  const row = await prisma.loyaltyAccount.create({
    data: {
      id: `loy-${prop}-${Date.now()}`,
      propertyId: prop,
      guestName: input.guestName.trim(),
      email,
      phone: input.phone?.trim() ?? null,
      tierId: tier.id,
      tierName: tier.name,
      points: 0,
      lifetimeNights: 0,
      lifetimeSpend: 0,
      createdAt: now,
      updatedAt: now,
    },
  });
  bustReadCaches(prop);
  return toAccount(row);
}

export async function listLoyaltyAccounts(
  propertyId?: string,
  opts?: { query?: string; limit?: number },
): Promise<LoyaltyAccountRecord[]> {
  const prop = pid(propertyId);
  const q = opts?.query?.trim().toLowerCase();
  const rows = await prisma.loyaltyAccount.findMany({
    where: q
      ? {
          propertyId: prop,
          OR: [
            { guestName: { contains: q } },
            { email: { contains: q } },
            { tierName: { contains: q } },
          ],
        }
      : { propertyId: prop },
    orderBy: [{ points: 'desc' }, { updatedAt: 'desc' }],
    take: opts?.limit ?? 100,
  });
  return rows.map(toAccount);
}

export async function getLoyaltyAccountByEmail(
  email: string,
  propertyId?: string,
): Promise<LoyaltyAccountRecord | null> {
  const row = await prisma.loyaltyAccount.findUnique({
    where: { propertyId_email: { propertyId: pid(propertyId), email: email.trim().toLowerCase() } },
  });
  return row ? toAccount(row) : null;
}

export async function getAccountTransactions(
  accountId: string,
  limit = 50,
): Promise<LoyaltyTransactionRecord[]> {
  const rows = await prisma.loyaltyTransaction.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toTransaction);
}

export async function earnLoyaltyPoints(input: {
  accountId?: string;
  guestName?: string;
  email?: string;
  phone?: string;
  nights: number;
  spendTry: number;
  agencyCode?: string;
  reservationId?: string;
  refNo?: string;
  description?: string;
  propertyId?: string;
}): Promise<{ account: LoyaltyAccountRecord; transaction: LoyaltyTransactionRecord; earned: number } | null> {
  const config = await loadLoyaltyConfig();
  if (!config.enabled) return null;

  const prop = pid(input.propertyId);
  if (input.reservationId) {
    const dup = await prisma.loyaltyTransaction.findFirst({
      where: { propertyId: prop, reservationId: input.reservationId, type: 'earn' },
    });
    if (dup) return null;
  }

  let account: LoyaltyAccountRecord;
  if (input.accountId) {
    account = toAccount(await prisma.loyaltyAccount.findUniqueOrThrow({ where: { id: input.accountId } }));
  } else if (input.email) {
    account = await ensureLoyaltyAccount({
      guestName: input.guestName ?? input.email,
      email: input.email,
      phone: input.phone,
      propertyId: prop,
    });
  } else {
    return null;
  }

  const calc = calculateLoyaltyPoints(config, {
    nights: input.nights,
    spendTry: input.spendTry,
    agencyCode: input.agencyCode,
  });
  if (calc.points <= 0) return null;

  const now = new Date().toISOString();
  const newPoints = account.points + calc.points;
  const newNights = account.lifetimeNights + input.nights;
  const newSpend = account.lifetimeSpend + input.spendTry;

  const updated = await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: {
      points: newPoints,
      lifetimeNights: newNights,
      lifetimeSpend: newSpend,
      guestName: input.guestName?.trim() || account.guestName,
      phone: input.phone?.trim() ?? account.phone ?? null,
      updatedAt: now,
    },
  });

  const tier = resolveTier(config, updated);
  const tiered = await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: { tierId: tier.id, tierName: tier.name },
  });

  const tx = await prisma.loyaltyTransaction.create({
    data: {
      id: `loyt-${prop}-${Date.now()}`,
      propertyId: prop,
      accountId: account.id,
      type: 'earn',
      points: calc.points,
      balanceAfter: newPoints,
      reservationId: input.reservationId ?? null,
      refNo: input.refNo ?? null,
      description:
        input.description ??
        `Konaklama puanı · ${input.nights} gece · ${Math.round(input.spendTry)}₺${calc.tier ? ` · ${calc.tier}` : ''}`,
      createdAt: now,
    },
  });

  await appendAuditLog({
    module: 'loyalty',
    action: 'earn',
    entityType: 'LoyaltyAccount',
    entityId: account.id,
    user: 'Sistem',
    detail: `+${calc.points} puan · ${tiered.guestName}`,
  }, prop);

  bustReadCaches(prop);
  return {
    account: toAccount(tiered),
    transaction: toTransaction(tx),
    earned: calc.points,
  };
}

export async function redeemLoyaltyPoints(input: {
  accountId: string;
  points: number;
  description?: string;
  propertyId?: string;
}): Promise<{ account: LoyaltyAccountRecord; transaction: LoyaltyTransactionRecord } | { error: string }> {
  const config = await loadLoyaltyConfig();
  if (!config.enabled) return { error: 'Sadakat programı kapalı' };
  if (input.points < config.minRedeemPoints) {
    return { error: `Minimum ${config.minRedeemPoints} puan gerekli` };
  }

  const account = toAccount(
    await prisma.loyaltyAccount.findUniqueOrThrow({ where: { id: input.accountId } }),
  );
  if (account.points < input.points) return { error: 'Yetersiz puan bakiyesi' };

  const prop = pid(input.propertyId);
  const now = new Date().toISOString();
  const newPoints = account.points - input.points;
  const updated = await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: { points: newPoints, updatedAt: now },
  });

  const creditTry = Math.round(input.points * config.redeemValuePerPoint);
  const tx = await prisma.loyaltyTransaction.create({
    data: {
      id: `loyt-${prop}-${Date.now()}-r`,
      propertyId: prop,
      accountId: account.id,
      type: 'redeem',
      points: -input.points,
      balanceAfter: newPoints,
      description: input.description ?? `Puan harcama · ~${creditTry}₺ kredi`,
      createdAt: now,
    },
  });

  await appendAuditLog({
    module: 'loyalty',
    action: 'redeem',
    entityType: 'LoyaltyAccount',
    entityId: account.id,
    user: 'Resepsiyon',
    detail: `-${input.points} puan · ${account.guestName}`,
  }, prop);

  bustReadCaches(prop);
  return { account: toAccount(updated), transaction: toTransaction(tx) };
}

export async function getLoyaltySummary(propertyId?: string): Promise<LoyaltySummary> {
  const prop = pid(propertyId);
  const config = await loadLoyaltyConfig();
  const accounts = await prisma.loyaltyAccount.findMany({ where: { propertyId: prop } });
  const tierMap = new Map<string, { tierId: string; tierName: string; count: number }>();
  let totalPoints = 0;
  for (const a of accounts) {
    totalPoints += a.points;
    const key = a.tierId;
    const existing = tierMap.get(key);
    if (existing) existing.count += 1;
    else tierMap.set(key, { tierId: a.tierId, tierName: a.tierName, count: 1 });
  }

  const recentRows = await prisma.loyaltyTransaction.findMany({
    where: { propertyId: prop },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    enabled: config.enabled,
    accountCount: accounts.length,
    totalPoints,
    tierBreakdown: [...tierMap.values()].sort((a, b) => b.count - a.count),
    recentTransactions: recentRows.map(toTransaction),
  };
}

export async function earnOnCheckoutReservation(
  reservation: {
    id: string;
    refNo: string;
    guestName: string;
    email?: string;
    phone?: string;
    checkIn: string;
    checkOut: string;
    rate: number;
    agency: string;
    propertyId?: string;
  },
): Promise<number> {
  if (!reservation.email?.trim()) return 0;
  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
  const spendTry = reservation.rate * nights;
  const result = await earnLoyaltyPoints({
    guestName: reservation.guestName,
    email: reservation.email,
    phone: reservation.phone,
    nights,
    spendTry,
    agencyCode: reservation.agency,
    reservationId: reservation.id,
    refNo: reservation.refNo,
    propertyId: reservation.propertyId,
  });
  return result?.earned ?? 0;
}

export async function ensureDemoLoyaltySeeded(propertyId?: string): Promise<void> {
  const prop = pid(propertyId);
  const count = await prisma.loyaltyAccount.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const now = new Date().toISOString();
  const seeds = [
    {
      guestName: 'Mehmet Kaya',
      email: 'mehmet.kaya@example.com',
      tierId: 'gold',
      tierName: 'Altın',
      points: 2450,
      lifetimeNights: 12,
      lifetimeSpend: 28000,
    },
    {
      guestName: 'Ayşe Yılmaz',
      email: 'ayse.yilmaz@example.com',
      tierId: 'silver',
      tierName: 'Gümüş',
      points: 680,
      lifetimeNights: 5,
      lifetimeSpend: 9500,
    },
    {
      guestName: 'John Smith',
      email: 'john.smith@example.com',
      tierId: 'bronze',
      tierName: 'Bronz',
      points: 120,
      lifetimeNights: 1,
      lifetimeSpend: 1800,
    },
  ];

  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i];
    const accountId = `loy-seed-${prop}-${i + 1}`;
    await prisma.loyaltyAccount.create({
      data: {
        id: accountId,
        propertyId: prop,
        guestName: s.guestName,
        email: s.email,
        tierId: s.tierId,
        tierName: s.tierName,
        points: s.points,
        lifetimeNights: s.lifetimeNights,
        lifetimeSpend: s.lifetimeSpend,
        createdAt: now,
        updatedAt: now,
      },
    });
    await prisma.loyaltyTransaction.create({
      data: {
        id: `loyt-seed-${prop}-${i + 1}`,
        propertyId: prop,
        accountId,
        type: 'earn',
        points: s.points,
        balanceAfter: s.points,
        description: 'Demo başlangıç puanı',
        createdAt: now,
      },
    });
  }
}
