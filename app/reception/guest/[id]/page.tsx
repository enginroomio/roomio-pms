import { GuestFolioPageClient } from './GuestFolioPageClient';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function GuestFolioPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <GuestFolioPageClient id={id} tab={tab} />;
}
