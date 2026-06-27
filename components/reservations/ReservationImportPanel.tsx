'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';

type Mode = 'file' | 'text' | 'email';

async function importLines(lines: string[], onImported?: () => void): Promise<{ ok: number; msg: string }> {
  if (lines.length < 2) {
    return { ok: 0, msg: 'En az bir başlık ve bir veri satırı girin.' };
  }
  const headers = lines[0]!.split(/[;\t,]/).map((h) => h.trim().toLowerCase());
  let ok = 0;
  for (const line of lines.slice(1)) {
    const cols = line.split(/[;\t,]/).map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    const guestName = row.guestname || row.misafir || row.guest || cols[0] || '';
    const checkIn = row.checkin || row.giris || row['check-in'] || '';
    const checkOut = row.checkout || row.cikis || row['check-out'] || '';
    if (!guestName || !checkIn || !checkOut) continue;
    const res = await roomioFetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `import-${Date.now()}-${ok}`,
        refNo: String(Date.now()).slice(-6),
        guestName,
        checkIn,
        checkOut,
        roomType: row.roomtype || row['oda tipi'] || 'DBL',
        mealPlan: row.mealplan || row.pansiyon || 'BB',
        adults: Number(row.adults || row.yetiskin || 2),
        children: Number(row.children || row.cocuk || 0),
        rate: Number(row.rate || row.fiyat || 0) || 5200,
        currency: row.currency || row.doviz || 'TRY',
        agency: row.agency || row.acenta || 'Direct',
        market: row.market || 'BAR',
        status: 'CONFIRMED',
        extraData: {
          transferIn: row.transferin || row['gelis transfer'] || '',
          transferOut: row.transferout || row['gidis transfer'] || '',
          flightNo: row.flightno || row.ucus || '',
        },
      }),
    });
    if (res.ok) ok += 1;
  }
  if (ok > 0) onImported?.();
  return {
    ok,
    msg: ok > 0 ? `${ok} rezervasyon aktarıldı.` : 'Geçerli satır bulunamadı — başlık: guestName, checkIn, checkOut',
  };
}

export function ReservationImportPanel({ mode, onImported }: { mode: Mode; onImported?: () => void }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runImport(content?: string) {
    setBusy(true);
    setMsg(null);
    try {
      const raw = content ?? text;
      const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const result = await importLines(lines, onImported);
      setMsg(result.msg);
    } finally {
      setBusy(false);
    }
  }

  async function onFileChange(file: File | null) {
    if (!file) return;
    const content = await file.text();
    setText(content);
    await runImport(content);
  }

  const title = mode === 'email'
    ? 'E-posta ile Rezervasyon Aktarım'
    : mode === 'text'
      ? 'Metin ile Acenta Aktarım'
      : 'Acenta Rezervasyon Aktarım (CSV)';

  return (
    <div className="roomio-card" style={{ padding: 20 }}>
      <h2 className="roomio-card-title">{title}</h2>
      <p className="roomio-page-desc" style={{ marginTop: 8 }}>
        {mode === 'email'
          ? 'Acenta e-postalarından kopyalanan tablo metnini yapıştırın.'
          : mode === 'file'
            ? 'CSV dosyası yükleyin veya metni yapıştırın. Sütunlar: guestName, checkIn, checkOut, roomType, agency, rate, transferIn, transferOut.'
            : 'CSV veya tab ile ayrılmış metin — sütunlar: guestName, checkIn, checkOut, roomType, agency, rate.'}
      </p>
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
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'guestName,checkIn,checkOut,roomType,agency,rate,transferIn,transferOut\nAyşe Yılmaz,2026-07-01,2026-07-03,DBL,BKG,4800,14:30,10:00'}
        style={{ width: '100%', marginTop: 12, fontFamily: 'monospace', fontSize: '0.82rem' }}
      />
      <div className="roomio-form-actions" style={{ marginTop: 12 }}>
        <Button disabled={busy} onClick={() => void runImport()}>
          {busy ? 'Aktarılıyor…' : 'Aktar'}
        </Button>
        <Button variant="secondary" href="/api/reports/export?format=csv">Örnek CSV</Button>
        <Button variant="secondary" href="/reservations">← Liste</Button>
      </div>
      {msg ? <p className="roomio-page-desc" style={{ marginTop: 12 }} role="status">{msg}</p> : null}
    </div>
  );
}
