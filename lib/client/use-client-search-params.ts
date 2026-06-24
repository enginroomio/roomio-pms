'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * useSearchParams Suspense gerektirir — takılı "yükleniyor" ekranına yol açabilir.
 * Bu hook yalnızca istemcide URL okur; SSR'da boş döner, suspend etmez.
 */
export function useClientSearchParams() {
  const pathname = usePathname();
  const [search, setSearch] = useState('');

  const sync = useCallback(() => {
    if (typeof window === 'undefined') return;
    setSearch(window.location.search);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [pathname, sync]);

  const params = new URLSearchParams(search);
  const paramString = params.toString();

  const get = useCallback((key: string) => params.get(key), [paramString]);

  return {
    get,
    toString: () => paramString,
    /** router.replace sonrası senkron güncelle */
    sync,
  };
}
