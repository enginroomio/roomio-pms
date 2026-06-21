import { RolloutTrackerClient } from './RolloutTrackerClient';

type Props = {
  searchParams: Promise<{ phase?: string }>;
};

export default async function RolloutTrackerPage({ searchParams }: Props) {
  const params = await searchParams;
  return <RolloutTrackerClient phase={params.phase ?? null} />;
}
