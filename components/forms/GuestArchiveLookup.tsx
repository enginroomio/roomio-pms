'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import { archiveToFormValues, type GuestArchiveEntry } from '@/lib/egm/guest-archive';

type FormSlice = Record<string, string | number>;

type Props = {
  values: FormSlice;
  onChange: (patch: Record<string, string | number>) => void;
};

/** Rezervasyon sihirbazı — Misafir adımı arşiv araması */
export function GuestArchiveLookup({ values, onChange }: Props) {
  const [results, setResults] = useState<GuestArchiveEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const guestName = String(values.guestName ?? '');

  const searchArchive = useCallback(async () => {
    const q = new URLSearchParams();
    if (guestName.trim()) q.set('guestName', guestName.trim());
    if (values.idNo) q.set('idNo', String(values.idNo));
    if (values.phone) q.set('phone', String(values.phone));
    if (values.email) q.set('email', String(values.email));
    if ([...q.keys()].length === 0) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await roomioFetch(`/api/guests/archive?${q.toString()}`);
      const j = (await res.json()) as { results?: GuestArchiveEntry[] };
      setResults(j.results ?? []);
    } finally {
      setSearching(false);
    }
  }, [guestName, values.email, values.idNo, values.phone]);

  useEffect(() => {
    const t = setTimeout(() => { void searchArchive(); }, 450);
    return () => clearTimeout(t);
  }, [searchArchive]);

  function apply(entry: GuestArchiveEntry) {
    onChange(archiveToFormValues(entry));
    setAppliedId(entry.id);
  }

  if (!guestName.trim() && !values.email && !values.phone) {
    return (
      <p className="roomio-page-desc" style={{ marginBottom: 12 }}>
        Misafir adı, e-posta veya telefon yazın — arşiv ve önceki konaklamalar otomatik aranır.
      </p>
    );
  }

  return (
    <div className="roomio-card" style={{ marginBottom: 16, padding: 12 }}>
      <p className="roomio-card-title" style={{ fontSize: '0.9rem', margin: '0 0 8px' }}>
        Misafir arşivi {searching ? '(aranıyor…)' : results.length ? `(${results.length})` : ''}
      </p>
      {appliedId ? (
        <p className="roomio-page-desc" style={{ margin: '0 0 8px' }}>
          Arşiv kaydı uygulandı.
          <button type="button" className="roomio-link" style={{ marginLeft: 8 }} onClick={() => setAppliedId(null)}>
            Sıfırla
          </button>
        </p>
      ) : null}
      {results.length === 0 && !searching ? (
        <p className="roomio-page-desc" style={{ margin: 0 }}>Eşleşme yok — yeni misafir olarak devam edin.</p>
      ) : (
        <ul className="roomio-egm-archive-items">
          {results.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="roomio-egm-archive-item" onClick={() => apply(entry)}>
                <strong>{entry.guestName}</strong>
                <span>
                  {entry.visits} konaklama · Son: {entry.lastStay}
                  {entry.email ? ` · ${entry.email}` : ''}
                </span>
                <span className="roomio-text-muted">
                  {entry.source === 'egm' ? 'EGM' : 'Arşiv'}
                  {entry.idNo ? ` · ${entry.idNo.slice(0, 4)}***` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
