import { roomioFetch } from '@/lib/client/api';
import { hydratePropertyInventory } from '@/lib/rooms/inventory-hydrate';

type InventoryPayload = {
  floors?: Array<{ floor: number; start: number; end: number }>;
  types?: Array<{
    code: string;
    short: string;
    name: string;
    description?: string;
    location?: string;
    bedType: string;
    maxPersons: number;
    maxAdults: number;
    maxChildren: number;
    baseRate: number;
    specialInfo?: string;
  }>;
  rooms?: Array<{
    roomNo: string;
    floor: number;
    typeCode: string;
    location?: string;
    building: string;
    isActive: boolean;
  }>;
};

export async function reloadPropertyInventory(): Promise<void> {
  const res = await roomioFetch('/api/property-inventory');
  const j = (await res.json()) as InventoryPayload;
  if (!j.floors?.length) return;
  hydratePropertyInventory({
    floors: j.floors,
    types: j.types ?? [],
    rooms: (j.rooms ?? []).map((r) => ({
      roomNo: r.roomNo,
      floor: r.floor,
      typeCode: r.typeCode,
      location: r.location,
      building: r.building,
      isActive: r.isActive,
    })),
  });
}
