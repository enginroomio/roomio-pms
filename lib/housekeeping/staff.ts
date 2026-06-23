import { FLOORS } from '@/lib/rooms/room-config';

export type HkStaffMember = {
  id: string;
  name: string;
  floors: number[];
  active?: boolean;
};

/** Demo kat görevlileri — kat ataması ve rapor gruplaması için */
export const HK_STAFF: HkStaffMember[] = [
  { id: 'elif', name: 'Elif K.', floors: [1, 2], active: true },
  { id: 'murat', name: 'Murat S.', floors: [3, 4], active: true },
  { id: 'zeynep', name: 'Zeynep A.', floors: [5], active: true },
];

export function staffForFloor(floor: number): HkStaffMember | undefined {
  return HK_STAFF.find((s) => s.floors.includes(floor));
}

export function staffDisplayName(idOrName: string): string {
  const byId = HK_STAFF.find((s) => s.id === idOrName);
  if (byId) return byId.name;
  return idOrName;
}

export const HK_FLOOR_OPTIONS = FLOORS.map((f) => f.floor);
