import { ReservationEditClient } from './ReservationEditClient';

type Props = { params: Promise<{ id: string }> };

export default async function ReservationEditPage({ params }: Props) {
  const { id } = await params;
  return <ReservationEditClient id={id} />;
}
