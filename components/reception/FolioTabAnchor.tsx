'use client';

import { useEffect } from 'react';

type Props = { tab: string | undefined };

/** ?tab=folio ile gelindiğinde folyo bölümüne kaydır */
export function FolioTabAnchor({ tab }: Props) {
  useEffect(() => {
    if (tab !== 'folio') return;
    const el = document.getElementById('folio-section');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [tab]);

  return null;
}
