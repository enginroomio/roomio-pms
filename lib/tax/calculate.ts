import type { TaxBreakdown, TaxLine, TaxRule } from '@/lib/tax/types';

export function calculateTaxes(subtotal: number, rules: TaxRule[]): TaxBreakdown {
  const active = rules.filter((r) => r.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const lines: TaxLine[] = [];
  let running = subtotal;

  for (const rule of active) {
    const baseAmount = rule.base === 'subtotal' ? subtotal : running;
    const amount = Math.round(baseAmount * rule.rate / 100);
    lines.push({ code: rule.code, name: rule.name, rate: rule.rate, amount });
    running += amount;
  }

  return { subtotal, lines, total: running };
}
