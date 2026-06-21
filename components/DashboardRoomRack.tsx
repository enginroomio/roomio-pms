'use client';

import { useEffect, useState } from 'react';
import { Card, FloorTabs } from '@/components/kit';
import { RoomRackGrid } from '@/components/RoomRackGrid';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { Reservation } from '@/lib/types/reservation';

type Props = {
  reservations?: Reservation[];
  businessDate?: string;
  hkMap?: Record<string, HkRoomRecord>;
};

export function DashboardRoomRack({ reservations, businessDate, hkMap }: Props) {
  const [floor, setFloor] = useState<number | 'all'>('all');

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [floor]);

  return (
    <Card variant="rack">
      <div className="roomio-dashboard-rack__head">
        <h2>Oda Rack</h2>
        <FloorTabs value={floor} onChange={setFloor} />
      </div>
      <RoomRackGrid
        preview
        activeFloor={floor}
        onFloorChange={setFloor}
        reservations={reservations}
        businessDate={businessDate}
        hkMap={hkMap}
      />
    </Card>
  );
}
