'use client';

import { useMemo } from 'react';
import { CheckCircle2, ClipboardCheck, Sparkles, Wrench } from 'lucide-react';
import { StatTile } from '@/components/kit';
import { useI18n } from '@/components/i18n/I18nProvider';
import { getHousekeepingBoard } from '@/lib/rooms/inventory';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { Reservation } from '@/lib/types/reservation';

type Props = {
  reservations: Reservation[];
  hkMap: Record<string, HkRoomRecord>;
};

export function HkMobileKpiStrip({ reservations, hkMap }: Props) {
  const { t } = useI18n();
  const counts = useMemo(() => {
    const board = getHousekeepingBoard(reservations, hkMap);
    return {
      total: board.length,
      clean: board.filter((r) => r.status === 'CLEAN').length,
      dirty: board.filter((r) => r.status === 'DIRTY').length,
      inspect: board.filter((r) => r.status === 'INSPECT').length,
      maint: board.filter((r) => r.status === 'OOO' || r.status === 'DND').length,
    };
  }, [reservations, hkMap]);

  return (
    <div className="roomio-hk-mobile__kpi">
      <span className="roomio-hk-mobile__kpi-total">{t('hk.mobile.rooms', { count: counts.total })}</span>
      <div className="roomio-kpi-strip roomio-hk-mobile__kpi-tiles">
        <StatTile label={t('hk.mobile.kpi.clean')} value={String(counts.clean)} icon={Sparkles} className="roomio-hk-kpi--clean" />
        <StatTile label={t('hk.mobile.kpi.dirty')} value={String(counts.dirty)} icon={ClipboardCheck} className="roomio-hk-kpi--dirty" />
        <StatTile label={t('hk.mobile.kpi.inspect')} value={String(counts.inspect)} icon={CheckCircle2} className="roomio-hk-kpi--inspect" />
        <StatTile label={t('hk.mobile.kpi.maint')} value={String(counts.maint)} icon={Wrench} className="roomio-hk-kpi--maint" />
      </div>
    </div>
  );
}
