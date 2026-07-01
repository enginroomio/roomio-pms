import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { getPublicMenu } from '@/lib/integrations/digital-menu/client';
import { verifyGuestPortalToken } from '@/lib/guest-portal/tokens';
import { getReservationByIdServer } from '@/lib/server/pms-store';
import {
  DEFAULT_ROOM_SERVICE_STORE,
  type RoomServiceConfig,
  type RoomServiceOrder,
  type RoomServiceOrderItem,
  type RoomServiceOrderStatus,
  type RoomServiceStore,
} from '@/lib/integrations/room-service/types';

const FILE = 'room-service-store.json';

async function loadStore(): Promise<RoomServiceStore> {
  return loadJsonConfig(FILE, DEFAULT_ROOM_SERVICE_STORE);
}

async function saveStore(store: RoomServiceStore): Promise<void> {
  await saveJsonConfig(FILE, store);
}

export async function loadRoomServiceConfig(): Promise<RoomServiceConfig> {
  return (await loadStore()).config;
}

export async function saveRoomServiceConfig(config: RoomServiceConfig): Promise<void> {
  const store = await loadStore();
  await saveStore({ ...store, config });
}

export async function listRoomServiceOrders(): Promise<RoomServiceOrder[]> {
  const store = await loadStore();
  return [...store.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type PlaceRoomServiceOrderInput = {
  token: string;
  items: Array<{ menuItemId: string; qty: number }>;
  notes?: string;
};

export type PlaceRoomServiceOrderResult = {
  ok: boolean;
  message: string;
  order?: RoomServiceOrder;
};

/**
 * Misafir kimliği guest-portal token'ı ile doğrulanır (lib/guest-portal/tokens.ts) —
 * oda no / isim girişine güvenilmez, sipariş her zaman token'ın bağlı olduğu
 * rezervasyona yazılır. Fiyat ve ürün bilgisi de istemciden değil, sunucudaki
 * dijital menü kataloğundan alınır (manipülasyona kapalı).
 */
export async function placeRoomServiceOrder(input: PlaceRoomServiceOrderInput): Promise<PlaceRoomServiceOrderResult> {
  const store = await loadStore();
  if (!store.config.enabled) {
    return { ok: false, message: 'Oda servisi şu an kullanılamıyor' };
  }

  const payload = await verifyGuestPortalToken(input.token);
  if (!payload) {
    return { ok: false, message: 'Geçersiz veya süresi dolmuş bağlantı' };
  }

  const reservation = await getReservationByIdServer(payload.reservationId, payload.propertyId);
  if (!reservation) {
    return { ok: false, message: 'Rezervasyon bulunamadı' };
  }
  if (reservation.status !== 'CHECKED_IN') {
    return { ok: false, message: 'Oda servisi sadece konaklama sırasında kullanılabilir' };
  }
  if (!reservation.roomNo) {
    return { ok: false, message: 'Oda ataması bulunamadı' };
  }
  if (!input.items?.length) {
    return { ok: false, message: 'Sepet boş' };
  }

  const menu = await getPublicMenu();
  if (!menu.ok) {
    return { ok: false, message: 'Menü şu an kullanılamıyor' };
  }
  const catalog = Object.values(menu.categories).flat();

  const lines: RoomServiceOrderItem[] = [];
  for (const requested of input.items) {
    const found = catalog.find((m) => m.id === requested.menuItemId);
    const qty = Math.floor(requested.qty);
    if (!found || !qty || qty < 1) continue;
    lines.push({
      menuItemId: found.id,
      name: found.name,
      price: found.price,
      currency: found.currency,
      qty: Math.min(qty, 20),
    });
  }
  if (!lines.length) {
    return { ok: false, message: 'Sepetteki ürünler geçerli değil' };
  }

  const totalAmount = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const now = new Date().toISOString();
  const order: RoomServiceOrder = {
    id: `rs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    roomNo: reservation.roomNo,
    guestName: reservation.guestName,
    reservationId: reservation.id,
    items: lines,
    totalAmount,
    currency: lines[0].currency,
    status: 'received',
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  store.orders.push(order);
  await saveStore(store);

  return { ok: true, message: 'Siparişiniz alındı. Teşekkür ederiz!', order };
}

export async function updateRoomServiceOrderStatus(
  id: string,
  status: RoomServiceOrderStatus,
): Promise<{ ok: boolean; message: string; order?: RoomServiceOrder }> {
  const store = await loadStore();
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) {
    return { ok: false, message: 'Sipariş bulunamadı' };
  }
  store.orders[idx] = { ...store.orders[idx], status, updatedAt: new Date().toISOString() };
  await saveStore(store);
  return { ok: true, message: 'Güncellendi', order: store.orders[idx] };
}
