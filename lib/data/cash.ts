import { formatMoney } from '@/lib/data/reservations';

export type CashEntry = {
  id: string;
  time: string;
  register: string;
  type: 'tahsilat' | 'odeme' | 'doviz' | 'depozit' | 'avans';
  description: string;
  amount: number;
  currency: 'TRY' | 'EUR' | 'USD';
  user: string;
};

export type KasaCloseRow = {
  id: string;
  register: string;
  openedAt: string;
  closedAt: string | null;
  openingBalance: number;
  closingBalance: number | null;
  variance: number;
  status: 'open' | 'closed';
};

export type FxExchange = {
  id: string;
  time: string;
  guest: string;
  roomNo: string;
  fromCurrency: 'EUR' | 'USD' | 'GBP';
  fromAmount: number;
  rate: number;
  tryAmount: number;
  user: string;
};

export type DepositRow = {
  id: string;
  guest: string;
  roomNo: string;
  amount: number;
  method: 'nakit' | 'kart' | 'havale';
  takenAt: string;
  status: 'held' | 'refunded' | 'applied';
};

export const CASH_REGISTERS = ['Ana Kasa', 'Resepsiyon 1', 'Resepsiyon 2'] as const;

export const DEMO_CASH_ENTRIES: CashEntry[] = [
  { id: 'ce-1', time: '09:12', register: 'Ana Kasa', type: 'tahsilat', description: 'Oda 312 — konaklama tahsilatı', amount: 5200, currency: 'TRY', user: 'Arda Y.' },
  { id: 'ce-2', time: '10:45', register: 'Resepsiyon 1', type: 'tahsilat', description: 'Oda 204 — ekstra yatak', amount: 850, currency: 'TRY', user: 'Arda Y.' },
  { id: 'ce-3', time: '11:30', register: 'Ana Kasa', type: 'doviz', description: 'EUR bozdurma — Miller', amount: 18420, currency: 'TRY', user: 'Selin K.' },
  { id: 'ce-4', time: '14:05', register: 'Resepsiyon 2', type: 'depozit', description: 'Oda 118 — depozit alındı', amount: 2000, currency: 'TRY', user: 'Arda Y.' },
  { id: 'ce-5', time: '15:22', register: 'Ana Kasa', type: 'avans', description: 'Gece vardiyası devir', amount: 15000, currency: 'TRY', user: 'Murat S.' },
];

export const DEMO_KASA_CLOSE: KasaCloseRow[] = [
  { id: 'kc-1', register: 'Ana Kasa', openedAt: '2026-06-18 07:00', closedAt: null, openingBalance: 12500, closingBalance: null, variance: 0, status: 'open' },
  { id: 'kc-2', register: 'Resepsiyon 1', openedAt: '2026-06-18 07:00', closedAt: '2026-06-17 23:45', openingBalance: 3200, closingBalance: 8750, variance: 0, status: 'closed' },
  { id: 'kc-3', register: 'Resepsiyon 2', openedAt: '2026-06-18 07:00', closedAt: '2026-06-17 23:50', openingBalance: 2800, closingBalance: 4100, variance: -50, status: 'closed' },
];

export const DEMO_FX_EXCHANGES: FxExchange[] = [
  { id: 'fx-1', time: '11:30', guest: 'James Miller', roomNo: '205', fromCurrency: 'EUR', fromAmount: 400, rate: 46.05, tryAmount: 18420, user: 'Selin K.' },
  { id: 'fx-2', time: '13:15', guest: 'Marco Rossi', roomNo: '118', fromCurrency: 'USD', fromAmount: 250, rate: 42.8, tryAmount: 10700, user: 'Arda Y.' },
];

export const DEMO_DEPOSITS: DepositRow[] = [
  { id: 'dp-1', guest: 'Marco Rossi', roomNo: '118', amount: 2000, method: 'kart', takenAt: '2026-06-18 14:05', status: 'held' },
  { id: 'dp-2', guest: 'Zeynep Ak', roomNo: '215', amount: 1500, method: 'nakit', takenAt: '2026-06-17 16:20', status: 'applied' },
  { id: 'dp-3', guest: 'John Miller', roomNo: '205', amount: 1000, method: 'kart', takenAt: '2026-06-16 11:00', status: 'refunded' },
];

export function cashSummary() {
  const tahsilat = DEMO_CASH_ENTRIES.filter((e) => e.type === 'tahsilat').reduce((s, e) => s + e.amount, 0);
  const openRegisters = DEMO_KASA_CLOSE.filter((k) => k.status === 'open').length;
  return { tahsilat, openRegisters, entries: DEMO_CASH_ENTRIES.length };
}

export { formatMoney };
