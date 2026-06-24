import { ReservationDetailClient } from './ReservationDetailClient';

type Props = { params: Promise<{ id: string }> };

export default async function ReservationDetailPage({ params }: Props) {
  const { id } = await params;
  return <ReservationDetailClient id={id} />;
}
