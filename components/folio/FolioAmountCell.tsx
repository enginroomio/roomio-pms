'use client';

import type { FolioLine } from '@/lib/data/reception-queries';
import { formatMoney } from '@/lib/exchange/money';

export type FolioAmountPart = 'combined' | 'foreign' | 'try';

function isDualCurrencyLine(line: FolioLine): boolean {
  const currency = line.currency ?? 'TRY';
  const foreign = line.foreignAmount;
  return currency !== 'TRY' && foreign != null && foreign > 0;
}

/** Folyo tutarı — döviz + giriş günü TL karşılığı yan yana veya ayrı sütunlar */
export function FolioAmountCell({
  line,
  part = 'combined',
}: {
  line: FolioLine;
  part?: FolioAmountPart;
}) {
  const currency = line.currency ?? 'TRY';
  const foreign = line.foreignAmount;
  const isDual = isDualCurrencyLine(line);

  if (part === 'foreign') {
    if (!isDual) return <>—</>;
    return <>{formatMoney(foreign!, currency)}</>;
  }

  if (part === 'try') {
    return <>{formatMoney(line.amount, 'TRY')}</>;
  }

  if (!isDual) {
    return <>{formatMoney(line.amount, 'TRY')}</>;
  }

  return (
    <span className="roomio-dual-amount roomio-dual-amount--inline">
      <strong>{formatMoney(foreign!, currency)}</strong>
      <small>{formatMoney(line.amount, 'TRY')}</small>
    </span>
  );
}
