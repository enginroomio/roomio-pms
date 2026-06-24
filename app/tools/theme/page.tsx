import { ThemeScreen } from '@/components/theme/ThemeScreen';

export const metadata = {
  title: 'Tema Ekranı — Roomio',
  description: 'Tüm modül ekranlarını tek viewport içinde önizleyin',
};

type Props = {
  searchParams: Promise<{ theme?: string; fixed?: string }>;
};

function parseTheme(value: string | undefined): 'light' | 'dark' | 'classic' | null {
  if (value === 'light' || value === 'dark' || value === 'classic') return value;
  return null;
}

export default async function ThemeToolsPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <ThemeScreen
      initialTheme={parseTheme(params.theme)}
      fixed={params.fixed === '1'}
    />
  );
}
