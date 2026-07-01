'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Eski BigQuery sayfası → birleşik bulut yedek ayarlarına yönlendirir. */
export default function GoogleBackupRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/settings/integrations/cloud-backup');
  }, [router]);
  return <p className="roomio-page-desc">Bulut yedekleme sayfasına yönlendiriliyor…</p>;
}
