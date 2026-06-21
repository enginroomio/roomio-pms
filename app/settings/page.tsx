import { SettingsPageClient } from './SettingsPageClient';

type Props = {
  searchParams: Promise<{ section?: string; tab?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <SettingsPageClient
      section={params.section ?? null}
      tab={params.tab ?? null}
    />
  );
}
