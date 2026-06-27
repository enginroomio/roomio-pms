export type BudgetLine = {
  id: string;
  department: string;
  month: string;
  budget: number;
  actual: number;
};

export type DeptRevenueRow = {
  date: string;
  rooms: number;
  fb: number;
  spa: number;
  other: number;
};

export type CreditControlRow = {
  code: string;
  name: string;
  limit: number;
  balance: number;
  overdueDays: number;
  status: 'ok' | 'warn' | 'block';
};

export const DEMO_BUDGET_LINES: BudgetLine[] = [
  { id: 'b1', department: 'Oda Geliri', month: '2026-06', budget: 1850000, actual: 1724500 },
  { id: 'b2', department: 'F&B', month: '2026-06', budget: 420000, actual: 398200 },
  { id: 'b3', department: 'Spa', month: '2026-06', budget: 95000, actual: 102400 },
  { id: 'b4', department: 'Banket', month: '2026-06', budget: 280000, actual: 315000 },
  { id: 'b5', department: 'Diğer', month: '2026-06', budget: 45000, actual: 38200 },
];

export const DEMO_HOTEL_BUDGET = {
  year: 2026,
  rooms: 12_400_000,
  fb: 3_200_000,
  spa: 980_000,
  banket: 1_850_000,
  other: 420_000,
};

export const DEMO_DEPT_REVENUE_OLD: DeptRevenueRow[] = [
  { date: '2026-05-31', rooms: 248500, fb: 62400, spa: 18200, other: 8400 },
  { date: '2026-05-30', rooms: 231200, fb: 58800, spa: 15600, other: 7200 },
  { date: '2026-05-29', rooms: 219800, fb: 55200, spa: 14100, other: 6800 },
  { date: '2026-05-28', rooms: 205400, fb: 49800, spa: 12800, other: 6100 },
  { date: '2026-05-27', rooms: 198600, fb: 47200, spa: 11900, other: 5900 },
];

export const DEMO_CREDIT_CONTROL: CreditControlRow[] = [
  { code: 'AGT-001', name: 'Anatolia Travel', limit: 150000, balance: 82400, overdueDays: 0, status: 'ok' },
  { code: 'AGT-014', name: 'Sunset Tours', limit: 80000, balance: 76200, overdueDays: 12, status: 'warn' },
  { code: 'CORP-22', name: 'Tekno Holding', limit: 200000, balance: 198500, overdueDays: 28, status: 'block' },
  { code: 'AGT-007', name: 'Mavi Deniz Turizm', limit: 60000, balance: 12400, overdueDays: 0, status: 'ok' },
];

export const DEMO_MARKET_DISTRIBUTION = [
  { segment: 'FIT', rooms: 142, revenue: 428500, pct: 34 },
  { segment: 'Kurumsal', rooms: 88, revenue: 312400, pct: 25 },
  { segment: 'Acenta', rooms: 96, revenue: 268200, pct: 21 },
  { segment: 'Grup', rooms: 44, revenue: 156800, pct: 12 },
  { segment: 'Online', rooms: 28, revenue: 98400, pct: 8 },
];
