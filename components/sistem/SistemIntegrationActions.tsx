'use client';

import { Button } from '@/components/ui';

/** Entegrasyon detay sayfalarında standart üst eylemler */
export function SistemIntegrationActions() {
  return (
    <>
      <Button variant="ghost" href="/settings/integrations">← Servis programları</Button>
      <Button variant="ghost" href="/settings?hub=sistem">Sistem merkezi</Button>
    </>
  );
}
