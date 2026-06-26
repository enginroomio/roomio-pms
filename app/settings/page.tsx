import { Suspense } from 'react';
import { SettingsPageClient } from './SettingsPageClient';

type Props = {
  searchParams: Promise<{ section?: string; tab?: string; theme?: string; fixed?: string; hub?: string }>;
};

function parseTheme(value: string | undefined): 'light' | 'dark' | 'classic' | null {
  if (value === 'light' || value === 'dark' || value === 'classic') return value;
  return null;
}

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <Suspense fallback={<div className="roomio-page-desc">Yükleniyor…</div>}>
      <SettingsPageClient
        section={params.section ?? null}
        tab={params.tab ?? null}
        theme={parseTheme(params.theme)}
        themeFixed={params.fixed === '1'}
      />
    </Suspense>
  );
}
