import Link from 'next/link';
import {
  formatGraphicDate,
  formatShortMoney,
  GRAPHIC_ROOM_TYPES,
  occupancyAccentColor,
  occupancyBarFill,
  type GraphicCalendarDay,
} from '@/lib/reservations/graphic-calendar';
import { ROOM_TYPES } from '@/lib/rooms/room-types';

type Props = {
  matrix: GraphicCalendarDay[];
};

export function GraphicRoomMatrix({ matrix }: Props) {
  return (
    <section className="roomio-rez-graphic-pro__matrix-wrap" aria-label="Oda tipi müsaitlik matrisi">
      <header className="roomio-rez-graphic-pro__matrix-head">
        <div>
          <h3>Oda Tipi × Tarih Matrisi</h3>
          <p>Hücreye tıklayarak hızlı rezervasyon başlatın · doluluk çubuğu ve fiyat referansı</p>
        </div>
        <div className="roomio-rez-graphic-pro__matrix-legend">
          <span><i className="roomio-rez-graphic-pro__legend-chip" style={{ background: '#14b8a6' }} /> Düşük</span>
          <span><i className="roomio-rez-graphic-pro__legend-chip" style={{ background: '#22c55e' }} /> Orta</span>
          <span><i className="roomio-rez-graphic-pro__legend-chip" style={{ background: '#eab308' }} /> Yüksek</span>
          <span><i className="roomio-rez-graphic-pro__legend-chip" style={{ background: '#ef4444' }} /> Kritik</span>
        </div>
      </header>

      <div className="roomio-rez-graphic-pro__matrix-scroll">
        <div
          className="roomio-rez-graphic-pro__matrix-grid"
          style={{ gridTemplateColumns: `132px repeat(${matrix.length}, minmax(64px, 1fr))` }}
        >
          <div className="roomio-rez-graphic-pro__matrix-corner">Oda tipi</div>
          {matrix.map((day) => (
            <div key={day.date} className="roomio-rez-graphic-pro__matrix-colhead">
              <strong>{formatGraphicDate(day.date)}</strong>
              <span className={`roomio-rez-graphic-pro__occ-badge${day.occupancyPct >= 80 ? ' is-hot' : ''}`}>
                %{day.occupancyPct}
              </span>
            </div>
          ))}

          {GRAPHIC_ROOM_TYPES.map((type) => {
            const apiType = type === 'TPL' ? 'TRP' : type;
            const label = ROOM_TYPES[type].short;
            const rate = formatShortMoney(ROOM_TYPES[type].baseRate);
            return (
              <div key={type} className="roomio-rez-graphic-pro__matrix-row">
                <div className="roomio-rez-graphic-pro__matrix-rowlabel">
                  <strong>{label}</strong>
                  <small>{rate} / gece</small>
                </div>
                {matrix.map((day) => {
                  const cell = day.cells.find((c) => c.type === apiType);
                  const pct = cell?.occupancyPct ?? 0;
                  const booked = cell?.booked ?? 0;
                  const total = cell?.total ?? 0;
                  const accent = occupancyAccentColor(pct);
                  return (
                    <Link
                      key={`${type}-${day.date}`}
                      href={`/reservations/new?checkIn=${day.date}&roomType=${type}`}
                      className="roomio-rez-graphic__cell roomio-rez-graphic-pro__matrix-cell"
                      title={`${label} · ${day.date} · ${booked}/${total} dolu (%${pct})`}
                    >
                      <span className="roomio-rez-graphic-pro__matrix-accent" style={{ background: accent }} />
                      <span className="roomio-rez-graphic-pro__matrix-main">
                        <strong>{booked}/{total}</strong>
                        <em>%{pct}</em>
                      </span>
                      <span
                        className="roomio-rez-graphic-pro__matrix-bar"
                        style={{ width: `${Math.max(8, pct)}%`, background: occupancyBarFill(pct) }}
                      />
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
