'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { IcalChannel, IcalFeedConfig } from '@/lib/integrations/ical-import/types';

type Mode = 'file' | 'text' | 'email' | 'ical';

type DraftRow = {
  key: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  mealPlan: string;
  adults: number;
  children: number;
  rate: number;
  currency: string;
  agency: string;
  market: string;
  transferIn: string;
  transferOut: string;
  flightNo: string;
};

const CHANNEL_LABELS: Record<IcalChannel, string> = {
  booking: 'Booking.com',
  expedia: 'Expedia.com',
  other: 'Diğer',
};

function parseLines(raw: string): { rows: DraftRow[]; error?: string } {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], error: 'En az bir başlık ve bir veri satırı girin.' };
  }
  const headers = lines[0]!.split(/[;\t,]/).map((h) => h.trim().toLowerCase());
  const rows: DraftRow[] = [];
  lines.slice(1).forEach((line, i) => {
    const cols = line.split(/[;\t,]/).map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => { row[h] = cols[j] ?? ''; });
    const guestName = row.guestname || row.misafir || row.guest || cols[0] || '';
    const checkIn = row.checkin || row.giris || row['check-in'] || '';
    const checkOut = row.checkout || row.cikis || row['check-out'] || '';
    if (!guestName || !checkIn || !checkOut) return;
    rows.push({
      key: `row-${Date.now()}-${i}`,
      guestName,
      checkIn,
      checkOut,
      roomType: row.roomtype || row['oda tipi'] || 'DBL',
      mealPlan: row.mealplan || row.pansiyon || 'BB',
      adults: Number(row.adults || row.yetiskin || 2) || 2,
      children: Number(row.children || row.cocuk || 0) || 0,
      rate: Number(row.rate || row.fiyat || 0) || 0,
      currency: row.currency || row.doviz || 'TRY',
      agency: row.agency || row.acenta || 'Direct',
      market: row.market || 'BAR',
      transferIn: row.transferin || row['gelis transfer'] || '',
      transferOut: row.transferout || row['gidis transfer'] || '',
      flightNo: row.flightno || row.ucus || '',
    });
  });
  return {
    rows,
    error: rows.length ? undefined : 'Geçerli satır bulunamadı — başlık: guestName, checkIn, checkOut',
  };
}

async function commitRows(rows: DraftRow[]): Promise<{ ok: number; msg: string }> {
  let ok = 0;
  for (const row of rows) {
    const res = await roomioFetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `import-${Date.now()}-${ok}`,
        refNo: `${String(Date.now()).slice(-6)}${ok}`,
        guestName: row.guestName,
        checkIn: row.checkIn,
        checkOut: row.checkOut,
        roomType: row.roomType,
        mealPlan: row.mealPlan,
        adults: row.adults,
        children: row.children,
        rate: row.rate,
        currency: row.currency,
        agency: row.agency,
        market: row.market,
        status: 'CONFIRMED',
        extraData: {
          transferIn: row.transferIn,
          transferOut: row.transferOut,
          flightNo: row.flightNo,
        },
      }),
    });
    if (res.ok) ok += 1;
  }
  return {
    ok,
    msg: ok > 0 ? `${ok} rezervasyon aktarıldı.` : 'Aktarım başarısız — satırları kontrol edin.',
  };
}

export function ReservationImportPanel({ mode, onImported }: { mode: Mode; onImported?: () => void }) {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<DraftRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [feeds, setFeeds] = useState<IcalFeedConfig[]>([]);
  const [feedsLoaded, setFeedsLoaded] = useState(false);
  const [newFeed, setNewFeed] = useState<{ label: string; channel: IcalChannel; roomType: string; url: string }>({
    label: '',
    channel: 'booking',
    roomType: '',
    url: '',
  });
  const [pullingId, setPullingId] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'ical') return;
    void loadFeeds();
  }, [mode]);

  async function loadFeeds() {
    const res = await roomioFetch('/api/integrations/ical-import/feeds');
    if (res.ok) {
      const data = (await res.json()) as { feeds?: IcalFeedConfig[] };
      setFeeds(data.feeds ?? []);
    }
    setFeedsLoaded(true);
  }

  async function addFeed() {
    if (!newFeed.label.trim() || !newFeed.url.trim()) {
      setMsg('Etiket ve iCal linki gerekli.');
      return;
    }
    const res = await roomioFetch('/api/integrations/ical-import/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFeed),
    });
    if (res.ok) {
      setNewFeed({ label: '', channel: 'booking', roomType: '', url: '' });
      await loadFeeds();
      setMsg('Takvim linki kaydedildi.');
    } else {
      setMsg('Kaydedilemedi.');
    }
  }

  async function removeFeed(id: string) {
    const res = await roomioFetch('/api/integrations/ical-import/feeds', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await loadFeeds();
  }

  async function pullFeed(feedId: string) {
    setPullingId(feedId);
    try {
      const res = await roomioFetch('/api/integrations/ical-import/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedId }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; rows?: DraftRow[]; skippedBlocks?: number };
      if (!res.ok || !data.ok) {
        setMsg(data.message ?? 'Çekilemedi.');
        return;
      }
      const incoming = data.rows ?? [];
      setDraft((prev) => {
        const existingKeys = new Set(prev.map((r) => r.key));
        const added = incoming.filter((r) => !existingKeys.has(r.key));
        const blockNote = data.skippedBlocks ? `, ${data.skippedBlocks} blok atlandı` : '';
        setMsg(`${added.length} yeni satır eklendi${blockNote}.`);
        return [...prev, ...added];
      });
      await loadFeeds();
    } finally {
      setPullingId(null);
    }
  }

  function preview(content?: string) {
    const raw = content ?? text;
    const { rows, error } = parseLines(raw);
    setDraft(rows);
    setMsg(error ?? `${rows.length} satır bulundu — sisteme aktarmadan önce kontrol edin / düzeltin.`);
  }

  async function onFileChange(file: File | null) {
    if (!file) return;
    const content = await file.text();
    setText(content);
    preview(content);
  }

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setDraft((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setDraft((prev) => prev.filter((r) => r.key !== key));
  }

  async function transfer() {
    if (!draft.length) return;
    setBusy(true);
    try {
      const result = await commitRows(draft);
      setMsg(result.msg);
      if (result.ok > 0) {
        setDraft([]);
        setText('');
        if (fileRef.current) fileRef.current.value = '';
        onImported?.();
      }
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'email'
    ? 'E-posta ile Rezervasyon Aktarım'
    : mode === 'text'
      ? 'Metin ile Acenta Aktarım'
      : mode === 'ical'
        ? 'Booking / Expedia Takvim (iCal) Aktarım'
        : 'Acenta Rezervasyon Aktarım (CSV)';

  return (
    <div className="roomio-card" style={{ padding: 20 }}>
      <h2 className="roomio-card-title">{title}</h2>
      <p className="roomio-page-desc" style={{ marginTop: 8 }}>
        {mode === 'email'
          ? 'Booking, Expedia ve diğer acentalardan gelen e-postadaki tablo metnini yapıştırın — önce önizleyin, kontrol edin, sonra aktarın.'
          : mode === 'file'
            ? 'CSV dosyası yükleyin veya metni yapıştırın. Sütunlar: guestName, checkIn, checkOut, roomType, agency, rate, transferIn, transferOut.'
            : mode === 'ical'
              ? 'Booking.com / Expedia\'nın "Takvimi Dışa Aktar" (iCal) linkini her oda tipi için ekleyin, "Çek" ile rezervasyonları aşağıdaki önizleme tablosuna doldurun. Bu veride sadece tarih ve misafirin ön adı bulunur — fiyat, pansiyon ve diğer alanları aktarmadan önce siz tamamlayın.'
              : 'CSV veya tab ile ayrılmış metin — sütunlar: guestName, checkIn, checkOut, roomType, agency, rate.'}
      </p>

      {mode === 'ical' ? (
        <div style={{ marginTop: 12 }}>
          <div className="roomio-table-wrap">
            <table className="roomio-table">
              <thead>
                <tr>
                  <th>Etiket</th>
                  <th>Kanal</th>
                  <th>Oda Tipi</th>
                  <th>Son Çekim</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {feeds.map((feed) => (
                  <tr key={feed.id}>
                    <td>{feed.label}</td>
                    <td>{CHANNEL_LABELS[feed.channel]}</td>
                    <td>{feed.roomType}</td>
                    <td>{feed.lastPulledAt ? new Date(feed.lastPulledAt).toLocaleString('tr-TR') : '—'}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" disabled={pullingId === feed.id} onClick={() => void pullFeed(feed.id)}>
                        {pullingId === feed.id ? 'Çekiliyor…' : 'Çek'}
                      </Button>
                      <Button variant="secondary" onClick={() => void removeFeed(feed.id)}>Sil</Button>
                    </td>
                  </tr>
                ))}
                {feedsLoaded && !feeds.length ? (
                  <tr><td colSpan={5} className="roomio-page-desc">Henüz takvim linki eklenmedi.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 12, flexWrap: 'wrap' }}>
            <input
              className="roomio-input"
              placeholder="Etiket (örn. Standart Oda)"
              value={newFeed.label}
              onChange={(e) => setNewFeed((f) => ({ ...f, label: e.target.value }))}
              style={{ maxWidth: 200 }}
            />
            <select
              className="roomio-input"
              value={newFeed.channel}
              onChange={(e) => setNewFeed((f) => ({ ...f, channel: e.target.value as IcalChannel }))}
              style={{ maxWidth: 140 }}
            >
              <option value="booking">Booking.com</option>
              <option value="expedia">Expedia.com</option>
              <option value="other">Diğer</option>
            </select>
            <input
              className="roomio-input"
              placeholder="Oda Tipi (örn. DBL)"
              value={newFeed.roomType}
              onChange={(e) => setNewFeed((f) => ({ ...f, roomType: e.target.value }))}
              style={{ maxWidth: 140 }}
            />
            <input
              className="roomio-input"
              placeholder="https://ical.booking.com/v1/export/..."
              value={newFeed.url}
              onChange={(e) => setNewFeed((f) => ({ ...f, url: e.target.value }))}
              style={{ minWidth: 280, flex: 1 }}
            />
            <Button onClick={() => void addFeed()}>Link Ekle</Button>
          </div>
        </div>
      ) : (
        <>
          {mode === 'file' ? (
            <div className="roomio-form-actions" style={{ marginTop: 12 }}>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt,text/csv"
                className="roomio-input"
                style={{ maxWidth: 360 }}
                onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : null}
          <textarea
            className="roomio-input"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'guestName,checkIn,checkOut,roomType,agency,rate,transferIn,transferOut\nAyşe Yılmaz,2026-07-01,2026-07-03,DBL,BKG,4800,14:30,10:00'}
            style={{ width: '100%', marginTop: 12, fontFamily: 'monospace', fontSize: '0.82rem' }}
          />
        </>
      )}

      <div className="roomio-form-actions" style={{ marginTop: 12 }}>
        {mode !== 'ical' ? (
          <Button variant="secondary" disabled={busy || !text.trim()} onClick={() => preview()}>
            Önizle
          </Button>
        ) : null}
        <Button disabled={busy || !draft.length} onClick={() => void transfer()}>
          {busy ? 'Aktarılıyor…' : `Aktar (${draft.length})`}
        </Button>
        <Button variant="secondary" href="/api/reports/export?format=csv">Örnek CSV</Button>
        <Button variant="secondary" href="/reservations">← Liste</Button>
      </div>
      {msg ? <p className="roomio-page-desc" style={{ marginTop: 12 }} role="status">{msg}</p> : null}

      {draft.length > 0 ? (
        <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Misafir</th>
                <th>Giriş</th>
                <th>Çıkış</th>
                <th>Oda Tipi</th>
                <th>Pansiyon</th>
                <th>Yetişkin</th>
                <th>Çocuk</th>
                <th>Fiyat</th>
                <th>Döviz</th>
                <th>Acenta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {draft.map((row) => (
                <tr key={row.key}>
                  <td><input className="roomio-input" value={row.guestName} onChange={(e) => updateRow(row.key, { guestName: e.target.value })} /></td>
                  <td><input className="roomio-input" type="date" value={row.checkIn} onChange={(e) => updateRow(row.key, { checkIn: e.target.value })} /></td>
                  <td><input className="roomio-input" type="date" value={row.checkOut} onChange={(e) => updateRow(row.key, { checkOut: e.target.value })} /></td>
                  <td><input className="roomio-input" value={row.roomType} onChange={(e) => updateRow(row.key, { roomType: e.target.value })} style={{ width: 70 }} /></td>
                  <td><input className="roomio-input" value={row.mealPlan} onChange={(e) => updateRow(row.key, { mealPlan: e.target.value })} style={{ width: 60 }} /></td>
                  <td><input className="roomio-input" type="number" value={row.adults} onChange={(e) => updateRow(row.key, { adults: Number(e.target.value) })} style={{ width: 56 }} /></td>
                  <td><input className="roomio-input" type="number" value={row.children} onChange={(e) => updateRow(row.key, { children: Number(e.target.value) })} style={{ width: 56 }} /></td>
                  <td><input className="roomio-input" type="number" value={row.rate} onChange={(e) => updateRow(row.key, { rate: Number(e.target.value) })} style={{ width: 80 }} /></td>
                  <td><input className="roomio-input" value={row.currency} onChange={(e) => updateRow(row.key, { currency: e.target.value })} style={{ width: 56 }} /></td>
                  <td><input className="roomio-input" value={row.agency} onChange={(e) => updateRow(row.key, { agency: e.target.value })} style={{ width: 80 }} /></td>
                  <td><Button variant="secondary" onClick={() => removeRow(row.key)}>Kaldır</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
