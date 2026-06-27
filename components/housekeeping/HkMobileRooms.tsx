'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet, RefreshCw, Search } from 'lucide-react';
import { HkMobileFrame } from '@/components/housekeeping/HkMobileFrame';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import { downloadHkListCsv } from '@/lib/client/hk-list-export';
import { patchHkRoom } from '@/lib/client/hk-update';
import { maskGuestName } from '@/lib/kvkk';
import { HK_FLOOR_OPTIONS } from '@/lib/housekeeping/staff';
import { roomioFetch } from '@/lib/client/api';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function statusClass(status: HousekeepingBoardRow['status']) {
  return `roomio-hk-liste-card__badge roomio-hk-liste-card__badge--${status.toLowerCase()}`;
}

function miniCellClass(status: HousekeepingBoardRow['status'], selected: boolean) {
  return `roomio-hk-mini-cell roomio-hk-mini-cell--${status.toLowerCase()}${selected ? ' is-selected' : ''}`;
}

/** HK mobil — okunabilir oda listesi */
export function HkMobileRoomsClient() {
  const [rooms, setRooms] = useState<HousekeepingBoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floor, setFloor] = useState<number | 'ALL'>(1);
  const [status, setStatus] = useState<HousekeepingBoardRow['status'] | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [savingRoom, setSavingRoom] = useState<string | null>(null);
  const [selectedRoomNo, setSelectedRoomNo] = useState<string | null>(null);
  const prevFloorRef = useRef(floor);

  const singleFloorMode = floor !== 'ALL';

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomioFetch('/api/housekeeping/rooms');
      if (!res.ok) throw new Error('Oda durumları yüklenemedi');
      const data = (await res.json()) as { rooms: HousekeepingBoardRow[] };
      setRooms(data.rooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beklenmeyen hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (prevFloorRef.current !== floor) {
      setSelectedRoomNo(null);
      prevFloorRef.current = floor;
    }
  }, [floor]);

  const filtered = useMemo(() => {
    let list = rooms;
    if (floor !== 'ALL') list = list.filter((r) => r.floor === floor);
    if (status !== 'ALL') list = list.filter((r) => r.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.roomNo.includes(q) || r.guestName?.toLowerCase().includes(q));
    }
    return list;
  }, [rooms, floor, status, search]);

  const selectedRoom = useMemo(
    () => (selectedRoomNo ? filtered.find((r) => r.roomNo === selectedRoomNo) ?? null : null),
    [filtered, selectedRoomNo],
  );

  async function updateStatus(roomNo: string, next: HousekeepingBoardRow['status']) {
    setSavingRoom(roomNo);
    try {
      const result = await patchHkRoom(roomNo, next);
      if (!result.ok) throw new Error('Durum güncellenemedi');
      setRooms((prev) => prev.map((r) => (r.roomNo === roomNo ? { ...r, status: next } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme hatası');
    } finally {
      setSavingRoom(null);
    }
  }

  const headerActions = (
    <button
      type="button"
      className="roomio-btn roomio-btn--ghost roomio-btn--sm"
      title="Excel (CSV)"
      onClick={() => downloadHkListCsv(filtered, `hk-liste-${new Date().toISOString().slice(0, 10)}.csv`)}
    >
      <FileSpreadsheet size={16} />
      Excel
    </button>
  );

  const toolbar = (
    <>
      <div className="roomio-hk-liste-readable__toolbar">
        <div className="roomio-hk-liste-readable__search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            className="roomio-input"
            placeholder="Oda no veya misafir ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="roomio-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as HousekeepingBoardRow['status'] | 'ALL')}
          aria-label="HK durumu"
        >
          <option value="ALL">Tüm durumlar</option>
          {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
            <option key={s} value={s}>
              {HK_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="roomio-btn roomio-btn--ghost roomio-btn--sm"
          onClick={() => void loadRooms()}
          aria-label="Yenile"
        >
          <RefreshCw size={16} className={loading ? 'roomio-spin' : ''} />
        </button>
      </div>

      <div className="roomio-hk-liste-readable__chips" role="group" aria-label="Kat filtresi">
        <button
          type="button"
          className={`roomio-hk-liste-readable__chip${floor === 'ALL' ? ' is-active' : ''}`}
          onClick={() => setFloor('ALL')}
        >
          Tümü
        </button>
        {HK_FLOOR_OPTIONS.map((f) => (
          <button
            key={f}
            type="button"
            className={`roomio-hk-liste-readable__chip${floor === f ? ' is-active' : ''}`}
            onClick={() => setFloor(f)}
          >
            Kat {f}
          </button>
        ))}
      </div>

      <p className="roomio-hk-liste-readable__summary">
        {singleFloorMode ? (
          <>
            <strong>Kat {floor}</strong> · {filtered.length} oda
          </>
        ) : (
          <>
            <strong>{filtered.length}</strong> oda gösteriliyor · toplam {rooms.length}
          </>
        )}
      </p>

      {error ? <p className="roomio-hk-liste-readable__error">{error}</p> : null}
    </>
  );

  const floorGrid = (
    <>
      <div className="roomio-hk-liste-floor-fit">
        {loading ? (
          <p className="roomio-hk-liste-readable__empty">Yükleniyor…</p>
        ) : filtered.length === 0 ? (
          <p className="roomio-hk-liste-readable__empty">Filtreye uygun oda yok.</p>
        ) : (
          <>
            <div className="roomio-hk-liste-floor-fit__grid" role="list">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="listitem"
                  className={miniCellClass(r.status, selectedRoomNo === r.roomNo)}
                  onClick={() => setSelectedRoomNo((prev) => (prev === r.roomNo ? null : r.roomNo))}
                  title={`${r.roomNo} · ${HK_STATUS_LABELS[r.status]}${r.guestName ? ` · ${maskGuestName(r.guestName)}` : ''}`}
                >
                  <span className="roomio-hk-liste-floor-fit__no">{r.roomNo}</span>
                  {r.guestName ? (
                    <span className="roomio-hk-liste-floor-fit__guest">Dolu</span>
                  ) : (
                    <span className="roomio-hk-liste-floor-fit__guest roomio-hk-liste-floor-fit__guest--empty">
                      Boş
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="roomio-hk-legend roomio-hk-liste-floor-fit__legend">
              {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
                <span key={s} className={`roomio-hk-legend-item roomio-hk-mini-cell--${s.toLowerCase()}`}>
                  {HK_STATUS_LABELS[s]}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedRoom ? (
        <article className="roomio-hk-liste-floor-fit__detail">
          <div className="roomio-hk-liste-floor-fit__detail-head">
            <div>
              <strong className="roomio-hk-liste-floor-fit__detail-no">{selectedRoom.roomNo}</strong>
              <span className="roomio-hk-liste-floor-fit__detail-meta">
                {selectedRoom.floor}. kat · {selectedRoom.type}
              </span>
            </div>
            <span className={statusClass(selectedRoom.status)}>{HK_STATUS_LABELS[selectedRoom.status]}</span>
          </div>
          <div className="roomio-hk-liste-floor-fit__detail-grid">
            <div>
              <span className="roomio-hk-liste-card__label">Misafir</span>
              <span className="roomio-hk-liste-card__value">
                {selectedRoom.guestName ? maskGuestName(selectedRoom.guestName) : 'Boş'}
              </span>
            </div>
            <div>
              <span className="roomio-hk-liste-card__label">Giriş / Çıkış</span>
              <span className="roomio-hk-liste-card__value">
                {formatDate(selectedRoom.checkIn)} / {formatDate(selectedRoom.checkOut)}
              </span>
            </div>
            <div>
              <span className="roomio-hk-liste-card__label">Katçı</span>
              <span className="roomio-hk-liste-card__value">{selectedRoom.assignedTo ?? '—'}</span>
            </div>
          </div>
          <label className="roomio-hk-liste-floor-fit__status">
            <span>Durum güncelle</span>
            <select
              className="roomio-select"
              value={selectedRoom.status}
              disabled={savingRoom === selectedRoom.roomNo}
              onChange={(e) =>
                void updateStatus(selectedRoom.roomNo, e.target.value as HousekeepingBoardRow['status'])
              }
              aria-label={`Oda ${selectedRoom.roomNo} durumu`}
            >
              {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
                <option key={s} value={s}>
                  {HK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </article>
      ) : null}
    </>
  );

  const cardList = (
    <div className="roomio-hk-liste-readable__list" role="list">
      {loading ? (
        <p className="roomio-hk-liste-readable__empty">Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <p className="roomio-hk-liste-readable__empty">Filtreye uygun oda yok.</p>
      ) : (
        filtered.map((r) => (
          <article key={r.id} className="roomio-hk-liste-card" role="listitem">
            <div className="roomio-hk-liste-card__head">
              <div className="roomio-hk-liste-card__room">
                <span className="roomio-hk-liste-card__no">{r.roomNo}</span>
                <span className="roomio-hk-liste-card__meta">
                  {r.floor}. kat · {r.type}
                </span>
              </div>
              <span className={statusClass(r.status)}>{HK_STATUS_LABELS[r.status]}</span>
            </div>

            <div className="roomio-hk-liste-card__body">
              <div className="roomio-hk-liste-card__field">
                <span className="roomio-hk-liste-card__label">Misafir</span>
                <span className="roomio-hk-liste-card__value">
                  {r.guestName ? maskGuestName(r.guestName) : 'Boş'}
                </span>
              </div>
              <div className="roomio-hk-liste-card__field">
                <span className="roomio-hk-liste-card__label">Giriş / Çıkış</span>
                <span className="roomio-hk-liste-card__value">
                  {formatDate(r.checkIn)} / {formatDate(r.checkOut)}
                </span>
              </div>
              <div className="roomio-hk-liste-card__field">
                <span className="roomio-hk-liste-card__label">Katçı</span>
                <span className="roomio-hk-liste-card__value">{r.assignedTo ?? '—'}</span>
              </div>
            </div>

            <label className="roomio-hk-liste-card__status">
              <span>Durum güncelle</span>
              <select
                className="roomio-select"
                value={r.status}
                disabled={savingRoom === r.roomNo}
                onChange={(e) =>
                  void updateStatus(r.roomNo, e.target.value as HousekeepingBoardRow['status'])
                }
                aria-label={`Oda ${r.roomNo} durumu`}
              >
                {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
                  <option key={s} value={s}>
                    {HK_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          </article>
        ))
      )}
    </div>
  );

  return (
    <HkMobileFrame title="Oda Listesi" actions={headerActions}>
      <div
        className={`roomio-hk-liste-readable${singleFloorMode ? ' roomio-hk-liste-readable--floor-fit' : ''}`}
      >
        {toolbar}
        {singleFloorMode ? floorGrid : cardList}
      </div>
    </HkMobileFrame>
  );
}
