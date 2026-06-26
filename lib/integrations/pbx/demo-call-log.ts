export type PbxCallRecord = {
  id: string;
  at: string;
  direction: 'in' | 'out' | 'internal';
  extension: string;
  remote: string;
  guestName?: string;
  roomNo?: string;
  durationSec: number;
  status: 'answered' | 'missed' | 'voicemail';
};

export const DEMO_PBX_CALLS: PbxCallRecord[] = [
  { id: 'c1', at: '2026-06-25 08:14', direction: 'in', extension: '2101', remote: '+905321112233', guestName: 'Ayşe Yılmaz', roomNo: '101', durationSec: 42, status: 'answered' },
  { id: 'c2', at: '2026-06-25 09:02', direction: 'out', extension: '2105', remote: '+905551234567', guestName: 'John Smith', roomNo: '105', durationSec: 18, status: 'answered' },
  { id: 'c3', at: '2026-06-25 09:45', direction: 'in', extension: '0', remote: '+902121234567', durationSec: 0, status: 'missed' },
  { id: 'c4', at: '2026-06-25 10:30', direction: 'internal', extension: '2108', remote: '2200', guestName: 'Maria Garcia', roomNo: '108', durationSec: 65, status: 'answered' },
  { id: 'c5', at: '2026-06-25 11:05', direction: 'in', extension: '2112', remote: '+905339998877', guestName: 'Can Demir', roomNo: '112', durationSec: 0, status: 'voicemail' },
];

const STORAGE_KEY = 'roomio:pbx-call-log-v1';

export function loadPbxCallLog(): PbxCallRecord[] {
  if (typeof window === 'undefined') return DEMO_PBX_CALLS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEMO_PBX_CALLS;
    const parsed = JSON.parse(raw) as PbxCallRecord[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEMO_PBX_CALLS;
  } catch {
    return DEMO_PBX_CALLS;
  }
}

export function savePbxCallLog(rows: PbxCallRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 200)));
}
