import type { GuestReview } from '@/lib/data/guest-relations';
import { DEMO_REVIEWS } from '@/lib/data/guest-relations';
import { appendAuditLog } from '@/lib/server/audit-log';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type GuestReviewRow = GuestReview;

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  date: string;
  guestName: string;
  roomNo: string;
  stayRange: string | null;
  source: string;
  rating: number;
  title: string;
  comment: string;
  response: string | null;
  status: string;
  lang: string;
  category: string | null;
}): GuestReviewRow {
  return {
    id: r.id,
    date: r.date,
    guestName: r.guestName,
    roomNo: r.roomNo,
    stayRange: r.stayRange ?? '',
    source: r.source,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    response: r.response ?? undefined,
    status: r.status as GuestReview['status'],
    lang: r.lang as GuestReview['lang'],
  };
}

export async function seedGuestReviewsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.guestReview.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.guestReview.createMany({
    data: DEMO_REVIEWS.map((r) => ({
      id: `grv-${r.id}`,
      propertyId: prop,
      date: r.date,
      guestName: r.guestName,
      roomNo: r.roomNo,
      stayRange: r.stayRange,
      source: r.source,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      response: r.response ?? null,
      status: r.status,
      lang: r.lang,
      category: null,
      reservationId: null,
    })),
  });
}

export type ReviewFilters = {
  source?: string;
  rating?: number;
  status?: 'answered' | 'pending';
  query?: string;
};

export async function getGuestReviewsServer(
  propertyId?: string,
  filters?: ReviewFilters,
): Promise<GuestReviewRow[]> {
  await init();
  await seedGuestReviewsIfEmpty(propertyId);
  const rows = await prisma.guestReview.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { date: 'desc' },
  });
  let list = rows.map(mapRow);
  if (filters?.source && filters.source !== 'Tümü') {
    list = list.filter((r) => r.source === filters.source);
  }
  if (filters?.rating) {
    list = list.filter((r) => r.rating === filters.rating);
  }
  if (filters?.status) {
    list = list.filter((r) => r.status === filters.status);
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    list = list.filter((r) => r.guestName.toLowerCase().includes(q) || r.roomNo.includes(q));
  }
  return list;
}

export async function saveGuestReviewServer(
  data: {
    guestName: string;
    roomNo: string;
    rating: number;
    title?: string;
    comment: string;
    source?: string;
    category?: string;
    lang?: 'TR' | 'EN';
    stayRange?: string;
    reservationId?: string;
  },
  propertyId?: string,
): Promise<GuestReviewRow> {
  await init();
  const prop = pid(propertyId);
  const id = `grv-${Date.now()}`;
  const date = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const row = await prisma.guestReview.create({
    data: {
      id,
      propertyId: prop,
      date,
      guestName: data.guestName,
      roomNo: data.roomNo,
      stayRange: data.stayRange ?? null,
      source: data.source ?? 'Otel Web',
      rating: data.rating,
      title: data.title ?? 'Misafir yorumu',
      comment: data.comment,
      response: null,
      status: 'pending',
      lang: data.lang ?? 'TR',
      category: data.category ?? null,
      reservationId: data.reservationId ?? null,
    },
  });

  await appendAuditLog({
    module: 'reception',
    action: 'review_create',
    entityType: 'GuestReview',
    entityId: id,
    user: 'Misafir İlişkileri',
    detail: `${data.guestName} · ${data.rating}★`,
  }, prop);

  bustReadCaches(prop);
  return mapRow(row);
}

export async function answerGuestReviewServer(
  id: string,
  response: string,
  propertyId?: string,
): Promise<GuestReviewRow | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.guestReview.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return null;
  const row = await prisma.guestReview.update({
    where: { id },
    data: { response, status: 'answered' },
  });
  bustReadCaches(prop);
  return mapRow(row);
}

export async function deleteGuestReviewServer(id: string, propertyId?: string): Promise<boolean> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.guestReview.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return false;
  await prisma.guestReview.delete({ where: { id } });
  bustReadCaches(prop);
  return true;
}
