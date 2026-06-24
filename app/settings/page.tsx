import { SettingsPageClient } from './SettingsPageClient';

type Props = {
  searchParams: Promise<{ section?: string; tab?: string; theme?: string; fixed?: string }>;
};

function parseTheme(value: string | undefined): 'light' | 'dark' | 'classic' | null {
  if (value === 'light' || value === 'dark' || value === 'classic') return value;
  return null;
}

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <SettingsPageClient
      section={params.section ?? null}
      tab={params.tab ?? null}
      theme={parseTheme(params.theme)}
      themeFixed={params.fixed === '1'}
    />
  );
}
