'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { applyGuestArchiveEntry, type GuestArchiveListItem } from '@/lib/client/guest-archive-apply';
import { archiveToFormValues } from '@/lib/egm/guest-archive';
import {
  EGM_GENDER_LABELS,
  EGM_ID_TYPE_LABELS,
  EGM_STATUS_LABELS,
  computeEgmStatus,
  egmRequiredFields,
  splitGuestName,
  type EgmNotifyStatus,
} from '@/lib/egm/types';
import { EgmStatusBadge } from '@/components/egm/EgmStatusBadge';

type FormSlice = Record<string, string | number>;

type Props = {
  values: FormSlice;
  onChange: (patch: Record<string, string | number>) => void;
  refNo?: string;
  /** Yeni rezervasyon sihirbazı — tek ekrana sığan yoğun düzen */
  compact?: boolean;
  /**
   * Konsolide tek ekranda "Misafir" adımı (GuestArchiveLookup) zaten aynı
   * arşivi aynı alanlarla arıyor ve uyguluyor — burada AYNI sorguyu tekrar
   * atmak hem gereksiz ağ trafiği hem de KVKK kimlik-açma denetim kaydını
   * (audit log) iki kez yazdırma riski oluşturuyordu. true ise bu panel
   * kendi arşiv aramasını/otomatik-uygulamasını atlar (alanlar yine de
   * GuestArchiveLookup'tan dolan değerlerle gelir).
   */
  skipArchiveSearch?: boolean;
};

export function EgmIdentityFormPanel({ values, onChange, refNo, compact = false, skipArchiveSearch = false }: Props) {
  const [results, setResults] = useState<GuestArchiveListItem[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<GuestArchiveListItem | null>(null);
  const [searching, setSearching] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const guestName = String(values.guestName ?? '');
  const { firstName: autoFirst, lastName: autoLast } = splitGuestName(guestName);
  const firstName = String(values.firstName ?? autoFirst);
  const lastName = String(values.lastName ?? autoLast);

  const egmStatus: EgmNotifyStatus = computeEgmStatus({
    firstName,
    lastName,
    roomNo: String(values.fixRoomNo ?? values.roomNo ?? ''),
    nationality: String(values.nationality ?? ''),
    idNo: String(values.idNo ?? ''),
    idType: (values.idType as 'TCKN' | 'PASSPORT' | 'OTHER') ?? 'TCKN',
    birthDate: String(values.birthDate ?? ''),
    birthPlace: String(values.birthPlace ?? ''),
    gender: (values.gender as 'E' | 'K' | '') ?? '',
    fatherName: String(values.fatherName ?? ''),
    motherName: String(values.motherName ?? ''),
    checkIn: String(values.checkIn ?? ''),
  });

  const missing = egmRequiredFields({
    firstName,
    lastName,
    roomNo: String(values.fixRoomNo ?? ''),
    nationality: String(values.nationality ?? ''),
    idNo: String(values.idNo ?? ''),
    birthDate: String(values.birthDate ?? ''),
    birthPlace: String(values.birthPlace ?? ''),
    gender: (values.gender as 'E' | 'K' | '') ?? '',
    fatherName: String(values.fatherName ?? ''),
    motherName: String(values.motherName ?? ''),
    checkIn: String(values.checkIn ?? ''),
  });

  const searchArchive = useCallback(async () => {
    if (skipArchiveSearch) return;
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
    const res = await roomioFetch(`/api/guests/archive?${q.toString()}`);
    const j = (await res.json()) as { results?: GuestArchiveListItem[] };
    setResults(j.results ?? []);
    setSearching(false);
  }, [skipArchiveSearch, guestName, values.email, values.idNo, values.phone]);

  useEffect(() => {
    if (skipArchiveSearch) return;
    const t = setTimeout(() => { void searchArchive(); }, 400);
    return () => clearTimeout(t);
  }, [skipArchiveSearch, searchArchive]);

  const applyArchive = useCallback(
    async (archiveId: string) => {
      const entry = await applyGuestArchiveEntry(archiveId);
      if (!entry) return;
      onChange(archiveToFormValues(entry));
      setSelectedArchive(entry);
      setAppliedId(archiveId);
    },
    [onChange],
  );

  useEffect(() => {
    if (skipArchiveSearch) return;
    if (results.length === 1 && !appliedId && !values.birthDate) {
      void applyArchive(results[0]!.id);
    }
  }, [skipArchiveSearch, results, appliedId, values.birthDate, applyArchive]);

  function setField(key: string, val: string) {
    onChange({ [key]: val });
    if (key === 'guestName') {
      const { firstName: f, lastName: l } = splitGuestName(val);
      onChange({ guestName: val, firstName: f, lastName: l });
    }
  }

  return (
    <div className={`roomio-egm-panel${compact ? ' roomio-egm-panel--compact' : ''}`}>
      <div className="roomio-egm-panel__head">
        <div>
          <p className="roomio-egm-drawer__eyebrow">EGM / KBS Kimlik Bildirimi</p>
          {!compact ? (
            <p className="roomio-page-desc" style={{ margin: '4px 0 0' }}>
              Rezervasyon kaydı sırasında kimlik bilgisi girilir veya arşivden otomatik gelir.
              {refNo ? ` · ${refNo}` : ''}
            </p>
          ) : (
            <p className="roomio-egm-panel__ref">{refNo ? `Rez. ${refNo}` : 'Kimlik bildirimi'}</p>
          )}
        </div>
        <EgmStatusBadge status={egmStatus} compact />
      </div>

      {!skipArchiveSearch && selectedArchive ? (
        <div className="roomio-egm-archive-banner roomio-egm-archive-banner--applied">
          <strong>Arşiv:</strong> {selectedArchive.guestName}
          {!compact ? (
            <>
              {' · '}{selectedArchive.visits} konaklama · Son: {selectedArchive.lastStay}
              {' · '}{selectedArchive.source === 'egm' ? 'EGM kaydı' : 'Misafir arşivi'}
              {selectedArchive.invoiceCount ? ` · ${selectedArchive.invoiceCount} fatura` : ''}
            </>
          ) : null}
          <button type="button" className="roomio-link" style={{ marginLeft: 8 }} onClick={() => { setSelectedArchive(null); setAppliedId(null); }}>
            Temizle
          </button>
        </div>
      ) : null}

      {!skipArchiveSearch && results.length > 0 && !selectedArchive ? (
        <div className="roomio-egm-archive-list roomio-card">
          <p className="roomio-card-title roomio-egm-archive-list__title">
            Misafir arşivi {searching ? '(aranıyor…)' : `(${results.length})`}
          </p>
          <ul className="roomio-egm-archive-items">
            {results.map((entry) => (
              <li key={entry.id}>
                <button type="button" className="roomio-egm-archive-item" onClick={() => void applyArchive(entry.id)}>
                  <strong>{entry.guestName}</strong>
                  <span>{entry.nationality} · {entry.idNoMasked ?? entry.idNo} · {entry.visits} konaklama</span>
                  {!compact ? (
                    <span className="roomio-text-muted">
                      Son: {entry.lastStay}
                      {entry.invoiceCount ? ` · ${entry.invoiceCount} fatura` : ''}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {missing.length > 0 ? (
        <p className={`roomio-egm-panel__status roomio-egm-panel__status--warn${compact ? ' roomio-egm-panel__status--compact' : ''}`}>
          Eksik: {missing.join(', ')}
        </p>
      ) : (
        <p className={`roomio-egm-panel__status roomio-egm-panel__status--ok${compact ? ' roomio-egm-panel__status--compact' : ''}`}>
          {EGM_STATUS_LABELS.ready} — kayıt sonrası gönderilebilir.
        </p>
      )}

      <section className="roomio-egm-section">
        {!compact ? <h3>Temel bilgiler</h3> : null}
        <div className={`roomio-form-grid ${compact ? 'roomio-form-grid--3 roomio-rez-new-wizard__fields' : 'roomio-form-grid--2'}`}>
          <label className="roomio-field"><span>Ad *</span><input className="roomio-input" value={firstName} onChange={(e) => setField('firstName', e.target.value)} /></label>
          <label className="roomio-field"><span>Soyad *</span><input className="roomio-input" value={lastName} onChange={(e) => setField('lastName', e.target.value)} /></label>
          <label className="roomio-field"><span>Uyruk *</span><input className="roomio-input" value={String(values.nationality ?? 'TR')} onChange={(e) => setField('nationality', e.target.value)} /></label>
          <label className="roomio-field"><span>Oda no</span><input className="roomio-input" value={String(values.fixRoomNo ?? '')} onChange={(e) => setField('fixRoomNo', e.target.value)} placeholder={compact ? 'Opsiyonel' : 'Check-in öncesi boş kalabilir'} /></label>
          <label className="roomio-field">
            <span>Belge tipi</span>
            <select className="roomio-select" value={String(values.idType ?? 'TCKN')} onChange={(e) => setField('idType', e.target.value)}>
              {Object.entries(EGM_ID_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="roomio-field"><span>Kimlik no *</span><input className="roomio-input" value={String(values.idNo ?? '')} onChange={(e) => setField('idNo', e.target.value)} /></label>
          <label className="roomio-field"><span>Doğum tarihi *</span><input className="roomio-input" type="date" value={String(values.birthDate ?? '')} onChange={(e) => setField('birthDate', e.target.value)} /></label>
          <label className="roomio-field"><span>Doğum yeri *</span><input className="roomio-input" value={String(values.birthPlace ?? '')} onChange={(e) => setField('birthPlace', e.target.value)} /></label>
          <label className="roomio-field">
            <span>Cinsiyet *</span>
            <select className="roomio-select" value={String(values.gender ?? '')} onChange={(e) => setField('gender', e.target.value)}>
              <option value="">—</option>
              {Object.entries(EGM_GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="roomio-field"><span>Baba adı *</span><input className="roomio-input" value={String(values.fatherName ?? '')} onChange={(e) => setField('fatherName', e.target.value)} /></label>
          <label className="roomio-field"><span>Anne adı *</span><input className="roomio-input" value={String(values.motherName ?? '')} onChange={(e) => setField('motherName', e.target.value)} /></label>
        </div>
      </section>

      {!compact && !skipArchiveSearch ? (
        <div className="roomio-form-actions" style={{ marginTop: 8 }}>
          <Button variant="secondary" onClick={() => void searchArchive()} disabled={searching}>
            {searching ? 'Aranıyor…' : 'Arşivi yeniden ara'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
