'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { roomioFetch } from '@/lib/client/api';
import { RoomRackGrid } from '@/components/RoomRackGrid';
import { useRoomRackContextMenu } from '@/components/reception/useRoomRackContextMenu';
import { Button } from '@/components/ui';
import { useLiveHkMap } from '@/lib/client/use-live-hk-map';
import { useDashboardSnapshot } from '@/lib/client/use-dashboard-snapshot';
import { useProperty } from '@/components/property/PropertyProvider';
import { PROPERTY } from '@/lib/navigation';
import { useInventoryVersion } from '@/lib/client/use-inventory-version';
import { getAllRooms } from '@/lib/rooms/inventory';
import {
  addRoomBlock,
  getRoomBlocks,
  releaseRoomBlock,
  type RoomBlock,
} from '@/lib/data/room-blocks';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { Reservation } from '@/lib/types/reservation';

type Tab = 'rack' | 'blocking';

export function RoomsPageClient({ initial }: { initial: import('@/lib/server/dashboard-data').DashboardSnapshot }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { propertyId } = useProperty();
  const { snapshot, loading: snapshotLoading } = useDashboardSnapshot(initial);
  const reservations = snapshot.reservations;
  const businessDate = snapshot.businessDate;
  const { hkMap, pullFromServer } = useLiveHkMap(snapshot.hkMap);
  const inventoryVersion = useInventoryVersion();
  const tab: Tab = searchParams.get('tab') === 'blocking' ? 'blocking' : 'rack';
  const [refreshKey, setRefreshKey] = useState(0);
  const [blocks, setBlocks] = useState<RoomBlock[]>(() => getRoomBlocks());
  const [roomNo, setRoomNo] = useState('');
  const [from, setFrom] = useState(businessDate);
  const [to, setTo] = useState(businessDate);
  const [reason, setReason] = useState('');
  const [focusRoom, setFocusRoom] = useState<string | null>(null);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus) setFocusRoom(focus);
  }, [searchParams]);

  const refreshRack = () => {
    setRefreshKey((k) => k + 1);
    void pullFromServer();
    router.refresh();
  };

  const { openMenu: openPmsMenu, menuNode: pmsMenuNode } = useRoomRackContextMenu({
    reservations,
    businessDate,
    onRefresh: refreshRack,
    onSelectCell: (cell) => setFocusRoom(cell.room.roomNo),
  });

  useEffect(() => {
    void roomioFetch('/api/room-blocks')
      .then((r) => r.json())
      .then((j: { blocks?: RoomBlock[] }) => {
        if (j.blocks?.length) setBlocks(j.blocks);
      });
  }, []);

  const activeBlocks = useMemo(() => blocks.filter((b) => b.status === 'active'), [blocks]);

  const allRooms = useMemo(() => getAllRooms(hkMap), [hkMap, inventoryVersion]);

  function refreshBlocks() {
    void roomioFetch('/api/room-blocks')
      .then((r) => r.json())
      .then((j: { blocks?: RoomBlock[] }) => {
        if (j.blocks) setBlocks(j.blocks);
        else setBlocks(getRoomBlocks());
      });
  }

  function onBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!roomNo.trim() || !reason.trim()) return;
    const entry = {
      roomNo: roomNo.trim(),
      from,
      to,
      reason: reason.trim(),
      blockedBy: 'Arda Y.',
      status: 'active' as const,
    };
    void roomioFetch('/api/room-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).then(() => refreshBlocks());
    addRoomBlock(entry);
    setRoomNo('');
    setReason('');
    refreshBlocks();
  }

  const tabs = [
    { id: 'rack' as const, label: 'Room Rack (F12)', href: '/rooms' },
    { id: 'blocking' as const, label: 'Hızlı Blokaj', href: '/rooms?tab=blocking' },
  ];

  return (
    <PageHeader
      breadcrumb="Kat Hizmetleri › Room Rack"
      title={tab === 'blocking' ? 'Hızlı Blokaj' : 'Room Rack (F12)'}
      description={
        tab === 'blocking'
          ? 'Odaları geçici olarak bloke edin — bakım, hold veya OOO.'
          : `${PROPERTY.name} · screen-104-kat-room-rack mockup · Prisma canlı veri`
      }
      actions={
        <Link href="/" className="roomio-btn roomio-btn--secondary">
          Ana Sayfa
        </Link>
      }
    >
      <nav className="roomio-tabs" aria-label="Oda modülü">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`roomio-tab${tab === t.id ? ' is-active' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'rack' ? (
        <div className={`roomio-rack-page${snapshotLoading ? ' roomio-dashboard--loading' : ''}`}>
          <RoomRackGrid
            key={`${propertyId}-${refreshKey}-${inventoryVersion}`}
            elektra
            reservations={reservations}
            businessDate={businessDate}
            hkMap={hkMap}
            focusRoomNo={focusRoom}
            onRoomPmsContextMenu={openPmsMenu}
            onRefresh={refreshRack}
          />
          {pmsMenuNode}
        </div>
      ) : (
        <div className="roomio-detail-grid">
          <div className="roomio-card">
            <h2 className="roomio-card-title">Yeni blokaj</h2>
            <form className="roomio-form" onSubmit={onBlock}>
              <div className="roomio-form-grid">
                <label className="roomio-field">
                  <span>Oda no</span>
                  <select className="roomio-select" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} required>
                    <option value="">Seçin…</option>
                    {allRooms.map((r) => (
                      <option key={r.roomNo} value={r.roomNo}>{r.roomNo} — {r.typeShort}</option>
                    ))}
                  </select>
                </label>
                <label className="roomio-field">
                  <span>Başlangıç</span>
                  <input className="roomio-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
                </label>
                <label className="roomio-field">
                  <span>Bitiş</span>
                  <input className="roomio-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
                </label>
                <label className="roomio-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Sebep</span>
                  <input className="roomio-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Bakım, hold, OOO…" required />
                </label>
              </div>
              <div className="roomio-form-actions">
                <Button type="submit">Bloke et</Button>
              </div>
            </form>
          </div>

          <div className="roomio-card">
            <h2 className="roomio-card-title">Aktif blokajlar ({activeBlocks.length})</h2>
            <div className="roomio-rack-preview" style={{ marginBottom: 16 }}>
              {activeBlocks.map((b) => (
                <div key={b.id} className="roomio-room ooo" title={`${b.from} → ${b.to}: ${b.reason}`}>
                  {b.roomNo}
                </div>
              ))}
            </div>
            <div className="roomio-table-wrap">
              <table className="roomio-table">
                <thead>
                  <tr>
                    <th>Oda</th>
                    <th>Tarih aralığı</th>
                    <th>Sebep</th>
                    <th>Kullanıcı</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((b) => (
                    <tr key={b.id} className={b.status === 'released' ? 'roomio-row-done' : ''}>
                      <td><strong>{b.roomNo}</strong></td>
                      <td>{b.from} → {b.to}</td>
                      <td>{b.reason}</td>
                      <td>{b.blockedBy}</td>
                      <td>
                        {b.status === 'active' ? (
                          <Button variant="secondary" onClick={() => { releaseRoomBlock(b.id); refreshBlocks(); }}>
                            Kaldır
                          </Button>
                        ) : (
                          <span className="roomio-badge">Kaldırıldı</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageHeader>
  );
}
