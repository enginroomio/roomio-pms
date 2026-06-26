'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import { applyGuestArchiveEntry, type GuestArchiveListItem } from '@/lib/client/guest-archive-apply';
import { archiveToFormValues } from '@/lib/egm/guest-archive';

type FormSlice = Record<string, string | number>;

type Props = {
  values: FormSlice;
  onChange: (patch: Record<string, string | number>) => void;
  autoApplySingle?: boolean;
};

/** Rezervasyon sihirbazı — Misafir adımı arşiv araması (KVKK maskeli liste, apply ile tam veri) */
export function GuestArchiveLookup({ values, onChange, autoApplySingle = true }: Props) {
  const [results, setResults] = useState<GuestArchiveListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [retentionNote, setRetentionNote] = useState<string | null>(null);

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
      const j = (await res.json()) as { results?: GuestArchiveListItem[]; retentionNote?: string };
      setResults(j.results ?? []);
      setRetentionNote(j.retentionNote ?? null);
    } finally {
      setSearching(false);
    }
  }, [guestName, values.email, values.idNo, values.phone]);

  useEffect(() => {
    const t = setTimeout(() => { void searchArchive(); }, 450);
    return () => clearTimeout(t);
  }, [searchArchive]);

  const apply = useCallback(
    async (archiveId: string) => {
      setApplyError(null);
      try {
        const entry = await applyGuestArchiveEntry(archiveId);
        if (!entry) return;
        onChange(archiveToFormValues(entry));
        setAppliedId(archiveId);
      } catch (err) {
        setApplyError(err instanceof Error ? err.message : 'Arşiv kaydı uygulanamadı');
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (!autoApplySingle || appliedId || results.length !== 1) return;
    const only = results[0];
    if (!only?.id) return;
    if (values.idNo && only.idNoMasked) return;
    void apply(only.id);
  }, [autoApplySingle, appliedId, results, apply, values.idNo]);

  if (!guestName.trim() && !values.email && !values.phone) {
    return (
      <p className="roomio-page-desc roomio-guest-archive-hint">
        Misafir adı, e-posta veya telefon yazın — KVKK arşivinden önceki konaklamalar aranır; kimlik detayları tek tıkla doldurulur.
      </p>
    );
  }

  return (
    <div className="roomio-card roomio-guest-archive-lookup">
      <p className="roomio-card-title roomio-guest-archive-lookup__title">
        Misafir kimlik arşivi {searching ? '(aranıyor…)' : results.length ? `(${results.length})` : ''}
      </p>
      {retentionNote ? <p className="roomio-guest-archive-lookup__kvkk">{retentionNote}</p> : null}
      {appliedId ? (
        <p className="roomio-page-desc roomio-guest-archive-lookup__applied">
          Arşiv kaydı uygulandı — kimlik alanları dolduruldu.
          <button type="button" className="roomio-link" onClick={() => setAppliedId(null)}>
            Sıfırla
          </button>
        </p>
      ) : null}
      {applyError ? <p className="roomio-text-warn">{applyError}</p> : null}
      {results.length === 0 && !searching ? (
        <p className="roomio-page-desc">Eşleşme yok — yeni misafir olarak devam edin.</p>
      ) : (
        <ul className="roomio-egm-archive-items">
          {results.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="roomio-egm-archive-item" onClick={() => void apply(entry.id)}>
                <strong>{entry.guestName}</strong>
                <span>
                  {entry.visits} konaklama · Son: {entry.lastStay}
                  {entry.email ? ` · ${entry.email}` : ''}
                </span>
                <span className="roomio-text-muted">
                  {entry.source === 'egm' ? 'EGM' : 'KVKK arşiv'}
                  {entry.idNoMasked || entry.idNo ? ` · ${entry.idNoMasked ?? entry.idNo}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
