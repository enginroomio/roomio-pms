'use client';

import Link from 'next/link';
import { ModuleLayout } from '@/components/ModuleLayout';
import { KurulusScreen } from '@/components/kurulus/KurulusScreen';
import { KURULUS_NAV } from '@/lib/navigation/kurulus-nav';
import { Button } from '@/components/ui';

function findPageTitle(section: string | null, tab: string | null): string {
  const href = section ? `/settings?section=${section}` : tab ? `/settings?tab=${tab}` : '/settings';
  for (const entry of KURULUS_NAV) {
    if (entry.href === href) return entry.label;
    for (const child of entry.children ?? []) {
      if (child.href === href) return child.label;
    }
  }
  return 'Otel Bilgileri';
}

export function SettingsPageClient({
  section,
  tab,
}: {
  section: string | null;
  tab: string | null;
}) {
  const menuSearch = section ? `?section=${section}` : tab ? `?tab=${tab}` : '';
  const title = findPageTitle(section, tab);

  return (
    <ModuleLayout
      breadcrumb="Sistem › Kuruluş"
      title="Kuruluş"
      description="Otel, oda, kullanıcı ve kod tanımları — mockup SC-003 yapısı."
      sideTitle="Kuruluş"
      menuSearch={menuSearch}
    >
      <div className="roomio-kurulus-meta">
        <span className="roomio-badge">Kuruluş</span>
        <div className="roomio-quick-actions">
          <Button variant="ghost" href="/tools/rollout?phase=sistem">
            Rollout test
          </Button>
          <Button variant="ghost" href="/settings/integrations">
            Entegrasyonlar
          </Button>
          <Button variant="ghost" href="/settings/compliance/5651">
            5651 Hotspot
          </Button>
          <Button variant="ghost" href="/settings/integrations/pbx">
            Santral
          </Button>
          <Button variant="ghost" href="/settings/integrations/tesa">
            TESA
          </Button>
        </div>
      </div>
      <KurulusScreen section={section} tab={tab} />
      <p className="roomio-page-desc" style={{ marginTop: 16 }}>
        Aktif ekran: <strong>{title}</strong> — yan menüden diğer kuruluş tanımlarına geçebilirsiniz.
      </p>
    </ModuleLayout>
  );
}
