/** Vergi kuralları — oranlar değişebilir, ek vergi eklenebilir */

export type TaxBase = 'subtotal' | 'running';
export type TaxAppliesTo = 'accommodation' | 'extras' | 'all';

export type TaxRule = {
  id: string;
  code: string;
  name: string;
  rate: number;
  base: TaxBase;
  appliesTo: TaxAppliesTo;
  active: boolean;
  sortOrder: number;
};

export type TaxLine = {
  code: string;
  name: string;
  rate: number;
  amount: number;
};

export type TaxBreakdown = {
  subtotal: number;
  lines: TaxLine[];
  total: number;
};

export const DEFAULT_TAX_RULES: Omit<TaxRule, 'id'>[] = [
  { code: 'kdv', name: 'KDV', rate: 10, base: 'subtotal', appliesTo: 'accommodation', active: true, sortOrder: 1 },
  { code: 'konaklama', name: 'Konaklama Vergisi', rate: 2, base: 'subtotal', appliesTo: 'accommodation', active: true, sortOrder: 2 },
];
