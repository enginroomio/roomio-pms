import { PROPERTY } from '@/lib/navigation';
import { getHousekeepingBoard } from '@/lib/rooms/inventory';

export type RoomStatus = 'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO' | 'DND';

export type RoomStatusRecord = {
  id: string;
  roomNo: string;
  floor: number;
  type: string;
  status: RoomStatus;
  assignedTo?: string;
  lastUpdated: string;
  guestName?: string;
  notes?: string;
};

export type HkTask = {
  id: string;
  roomNo: string;
  taskType: 'checkout' | 'stayover' | 'deep' | 'turndown';
  priority: 'normal' | 'urgent';
  assignee: string;
  status: 'pending' | 'in_progress' | 'done';
  notes?: string;
  dueBy: string;
};

export const DEMO_ROOM_STATUSES: RoomStatusRecord[] = getHousekeepingBoard();

export const DEMO_HK_TASKS: HkTask[] = [
  { id: 't-1', roomNo: '108', taskType: 'checkout', priority: 'urgent', assignee: 'Elif K.', status: 'in_progress', dueBy: '11:00', notes: 'Erken çıkış 10:30' },
  { id: 't-2', roomNo: '305', taskType: 'stayover', priority: 'normal', assignee: 'Elif K.', status: 'pending', dueBy: '14:00' },
  { id: 't-3', roomNo: '204', taskType: 'deep', priority: 'normal', assignee: 'Murat S.', status: 'pending', dueBy: '16:00' },
  { id: 't-4', roomNo: '401', taskType: 'turndown', priority: 'normal', assignee: 'Zeynep A.', status: 'done', dueBy: '18:00' },
  { id: 't-5', roomNo: '415', taskType: 'deep', priority: 'urgent', assignee: 'Murat S.', status: 'pending', dueBy: '12:00', notes: 'OOO — bakım sonrası' },
];

export const HK_STATUS_LABELS: Record<RoomStatus, string> = {
  CLEAN: 'Temiz',
  DIRTY: 'Kirli',
  INSPECT: 'Kontrol',
  OOO: 'Arızalı',
  DND: 'Rahatsız Etmeyin',
};

export const HK_TASK_LABELS: Record<HkTask['taskType'], string> = {
  checkout: 'Çıkış temizliği',
  stayover: 'Konaklama',
  deep: 'Detaylı temizlik',
  turndown: 'Akşam servisi',
};

export function countByStatus(rooms: Array<{ status: RoomStatus }>) {
  return {
    clean: rooms.filter((r) => r.status === 'CLEAN').length,
    dirty: rooms.filter((r) => r.status === 'DIRTY').length,
    inspect: rooms.filter((r) => r.status === 'INSPECT').length,
    ooo: rooms.filter((r) => r.status === 'OOO').length,
    dnd: rooms.filter((r) => r.status === 'DND').length,
  };
}

export function getPendingTasks(tasks: HkTask[]) {
  return tasks.filter((t) => t.status !== 'done');
}
