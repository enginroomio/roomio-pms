'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { formatDate } from '@/lib/data/reservations';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { GroupPickupReportPanel } from '@/components/reservations/GroupPickupReportPanel';
import type { Reservation } from '@/lib/types/reservation';

type Group = {
  id: string;
  refNo: string;
  name: string;
  contactName?: string;
  checkIn: string;
  checkOut: string;
  roomCount: number;
  status: string;
  memberCount?: number;
};

type AllotmentStatus = {
  allotment: Record<string, number>;
  pickedUp: Record<string, number>;
  remaining: Record<string, number>;
  totalAllotted: number;
  totalPickedUp: number;
  releaseDays?: number;
  releaseDate?: string;
};

export function GroupReservationsPanel({ onChanged }: { onChanged?: () => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Reservation[]>([]);
  const [allotment, setAllotment] = useState<AllotmentStatus | null>(null);
  const [allotmentEdit, setAllotmentEdit] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    contactName: '',
    checkIn: '2026-06-20',
    checkOut: '2026-06-22',
    roomCount: 5,
    releaseDays: 7,
    notes: '',
  });

  const [memberForm, setMemberForm] = useState({
    guestName: '',
    roomType: 'DBL',
    rate: 4800,
  });

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await roomioFetch('/api/reservations/groups');
      if (!res.ok) throw new Error(await parseApiError(res, 'Gruplar yüklenemedi'));
      const json = (await res.json()) as { groups?: Group[] };
      setGroups(json.groups ?? []);
    } catch (err) {
      setGroups([]);
      setLoadError(err instanceof Error ? err.message : 'Gruplar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async (groupId: string) => {
    const res = await roomioFetch(`/api/reservations/groups?groupId=${encodeURIComponent(groupId)}`);
    if (!res.ok) throw new Error(await parseApiError(res, 'Üyeler yüklenemedi'));
    const json = (await res.json()) as { members?: Reservation[] };
    setMembers(json.members ?? []);
  }, []);

  const loadAllotment = useCallback(async (groupId: string) => {
    const res = await roomioFetch(`/api/reservations/groups?groupId=${encodeURIComponent(groupId)}&view=allotment`);
    if (!res.ok) throw new Error(await parseApiError(res, 'Allotment yüklenemedi'));
    const json = (await res.json()) as { status?: AllotmentStatus };
    if (json.status) {
      setAllotment(json.status);
      setAllotmentEdit(json.status.allotment);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (!selectedId) {
      setMembers([]);
      setAllotment(null);
      return;
    }
    void loadMembers(selectedId).catch((err) => {
      setMsg(err instanceof Error ? err.message : 'Üyeler yüklenemedi');
    });
    void loadAllotment(selectedId).catch((err) => {
      setMsg(err instanceof Error ? err.message : 'Allotment yüklenemedi');
    });
  }, [selectedId, loadMembers, loadAllotment]);

  async function createGroup() {
    if (!form.name.trim()) {
      setMsg('Grup adı gerekli');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/reservations/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Grup oluşturulamadı'));
      const json = (await res.json()) as { ok?: boolean; group?: Group; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Grup oluşturulamadı');
      setMsg(`Grup oluşturuldu: ${json.group?.refNo}`);
      setForm((f) => ({ ...f, name: '', contactName: '', notes: '' }));
      await loadGroups();
      if (json.group) setSelectedId(json.group.id);
      onChanged?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function addMember() {
    if (!selectedId || !memberForm.guestName.trim()) {
      setMsg('Grup ve misafir adı gerekli');
      return;
    }
    const group = groups.find((g) => g.id === selectedId);
    if (!group) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/reservations/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_member',
          groupId: selectedId,
          member: {
            guestName: memberForm.guestName,
            checkIn: group.checkIn,
            checkOut: group.checkOut,
            roomType: memberForm.roomType,
            rate: memberForm.rate,
            market: 'GRP',
            agency: 'Group',
          },
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Üye eklenemedi'));
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Üye eklenemedi');
      setMsg(`${memberForm.guestName} gruba eklendi`);
      setMemberForm((m) => ({ ...m, guestName: '' }));
      await Promise.all([loadGroups(), loadMembers(selectedId), loadAllotment(selectedId)]);
      onChanged?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function releaseBlock() {
    if (!selectedId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/reservations/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release', groupId: selectedId }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Blok release edilemedi'));
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Blok release edilemedi');
      setMsg('Satılmayan odalar envantere iade edildi');
      await Promise.all([loadGroups(), loadAllotment(selectedId)]);
      onChanged?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function saveAllotment() {
    if (!selectedId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/reservations/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedId,
          allotment: allotmentEdit,
          releaseDays: allotment?.releaseDays,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Allotment güncellenemedi'));
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Allotment güncellenemedi');
      setMsg('Allotment kaydedildi');
      await loadAllotment(selectedId);
      onChanged?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  const selected = groups.find((g) => g.id === selectedId);
  const roomTypes = ['DBL', 'SUI', 'TRP'];

  return (
    <div className="roomio-form-grid roomio-form-grid--2" style={{ gap: 16 }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <GroupPickupReportPanel />
      </div>
      <section className="roomio-card">
        <h2 className="roomio-card-title">Yeni grup rezervasyon</h2>
        <div className="roomio-form-grid roomio-form-grid--2">
          <label className="roomio-field">
            <span>Grup adı *</span>
            <input className="roomio-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="roomio-field">
            <span>İletişim</span>
            <input className="roomio-input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </label>
          <label className="roomio-field">
            <span>Giriş</span>
            <input type="date" className="roomio-input" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
          </label>
          <label className="roomio-field">
            <span>Çıkış</span>
            <input type="date" className="roomio-input" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
          </label>
          <label className="roomio-field">
            <span>Oda sayısı</span>
            <input type="number" min={1} className="roomio-input" value={form.roomCount} onChange={(e) => setForm({ ...form, roomCount: Number(e.target.value) })} />
          </label>
          <label className="roomio-field">
            <span>Release (gün önce)</span>
            <input type="number" min={0} max={90} className="roomio-input" value={form.releaseDays} onChange={(e) => setForm({ ...form, releaseDays: Number(e.target.value) })} />
          </label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button disabled={busy} onClick={() => void createGroup()}>Grup oluştur</Button>
        </div>
      </section>

      <section className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Gruplar</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void loadGroups()}>
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </Button>
        </div>
        {loadError ? (
          <p className="roomio-page-desc roomio-text-warn" role="alert">{loadError}</p>
        ) : null}
        {loading ? (
          <p className="roomio-page-desc">Yükleniyor…</p>
        ) : (
          <div className="roomio-table-wrap">
            <table className="roomio-table">
              <thead>
                <tr><th>Ref</th><th>Grup</th><th>Tarih</th><th>Oda</th><th>Üye</th><th /></tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className={selectedId === g.id ? 'is-selected' : undefined}>
                    <td><strong>{g.refNo}</strong></td>
                    <td>{g.name}</td>
                    <td>{formatDate(g.checkIn)} – {formatDate(g.checkOut)}</td>
                    <td>{g.roomCount}</td>
                    <td>{g.memberCount ?? 0}</td>
                    <td>
                      <Button variant="secondary" onClick={() => setSelectedId(g.id)}>Seç</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? (
        <section className="roomio-card roomio-field--full" style={{ gridColumn: '1 / -1' }}>
          <h2 className="roomio-card-title">{selected.name} — allotment (Fidelio)</h2>
          {allotment ? (
            <>
              <p className="roomio-page-desc">
                Toplam {allotment.totalPickedUp}/{allotment.totalAllotted} oda alındı
                {allotment.releaseDate ? ` · Release: ${formatDate(allotment.releaseDate)} (${allotment.releaseDays ?? 7} gün önce)` : null}
              </p>
              <div className="roomio-table-wrap" style={{ marginBottom: 16 }}>
                <table className="roomio-table">
                  <thead>
                    <tr><th>Oda tipi</th><th>Allotment</th><th>Alınan</th><th>Kalan</th><th>Yeni allotment</th></tr>
                  </thead>
                  <tbody>
                    {roomTypes.map((rt) => (
                      <tr key={rt}>
                        <td><strong>{rt}</strong></td>
                        <td>{allotment.allotment[rt] ?? 0}</td>
                        <td>{allotment.pickedUp[rt] ?? 0}</td>
                        <td>{allotment.remaining[rt] ?? 0}</td>
                        <td>
                          <input
                            className="roomio-input"
                            type="number"
                            min={allotment.pickedUp[rt] ?? 0}
                            style={{ width: 72 }}
                            value={allotmentEdit[rt] ?? 0}
                            onChange={(e) => setAllotmentEdit((prev) => ({ ...prev, [rt]: Number(e.target.value) }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="roomio-form-actions" style={{ marginTop: 12 }}>
                <Button variant="secondary" disabled={busy} onClick={() => void saveAllotment()}>
                  Allotment kaydet
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy || selected.status === 'released'}
                  onClick={() => void releaseBlock()}
                >
                  Blok release (envantere iade)
                </Button>
              </div>
            </>
          ) : null}

          <h2 className="roomio-card-title" style={{ marginTop: 24 }}>Üye ekle</h2>
          <div className="roomio-form-grid roomio-form-grid--3">
            <label className="roomio-field">
              <span>Misafir adı</span>
              <input className="roomio-input" value={memberForm.guestName} onChange={(e) => setMemberForm({ ...memberForm, guestName: e.target.value })} />
            </label>
            <label className="roomio-field">
              <span>Oda tipi</span>
              <select className="roomio-select" value={memberForm.roomType} onChange={(e) => setMemberForm({ ...memberForm, roomType: e.target.value })}>
                <option value="DBL">DBL</option>
                <option value="SUI">SUI</option>
                <option value="TRP">TRP</option>
              </select>
            </label>
            <label className="roomio-field">
              <span>Fiyat/gece</span>
              <input type="number" className="roomio-input" value={memberForm.rate} onChange={(e) => setMemberForm({ ...memberForm, rate: Number(e.target.value) })} />
            </label>
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 12 }}>
            <Button disabled={busy} onClick={() => void addMember()}>Üye rezervasyon ekle</Button>
          </div>
          {members.length > 0 ? (
            <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
              <table className="roomio-table">
                <thead><tr><th>Ref</th><th>Misafir</th><th>Oda tipi</th><th>Durum</th></tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>{m.refNo}</td>
                      <td>{m.guestName}</td>
                      <td>{m.roomType}</td>
                      <td>{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {msg ? (
        <p
          className={`roomio-page-desc${/başarısız|yüklenemedi|yetkiniz|Oturum|eklenemedi|oluşturulamadı|güncellenemedi/i.test(msg) ? ' roomio-text-warn' : ''}`}
          style={{ gridColumn: '1 / -1' }}
          role="status"
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
