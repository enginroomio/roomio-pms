'use client';

import { useCallback, useEffect, useState } from 'react';
import { Camera, Loader2, ScanLine, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { applyGuestArchiveEntry, type GuestArchiveListItem } from '@/lib/client/guest-archive-apply';
import { archiveToFormValues } from '@/lib/egm/guest-archive';

type Props = {
  onChange: (patch: Record<string, string | number>) => void;
  onScan: () => void;
  onScanImage: (file: File) => void;
  scanning: boolean;
  scanMessage: string | null;
  scanFileInputRef: React.RefObject<HTMLInputElement | null>;
};

export function QuickGuestFinder({ onChange, onScan, onScanImage, scanning, scanMessage, scanFileInputRef }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GuestArchiveListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<GuestArchiveListItem | null>(null);
  const [showNoMatch, setShowNoMatch] = useState(false);
  const [scanDoneName, setScanDoneName] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setShowNoMatch(false);
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({ guestName: trimmed });
      const res = await roomioFetch(`/api/guests/archive?${params}`);
      const j = (await res.json()) as { results?: GuestArchiveListItem[] };
      const list = j.results ?? [];
      setResults(list);
      setShowNoMatch(list.length === 0);
      setSelected(null);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void search(query); }, 400);
    return () => clearTimeout(t);
  }, [query, search]);

  async function applyGuest(entry: GuestArchiveListItem) {
    const full = await applyGuestArchiveEntry(entry.id);
    if (!full) return;
    onChange(archiveToFormValues(full));
    setSelected(entry);
    setShowNoMatch(false);
    setQuery(entry.guestName);
  }

  function newGuest() {
    setShowNoMatch(false);
    setSelected(null);
    onChange({
      guestName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idNo: '',
      birthDate: '',
      birthPlace: '',
      fatherName: '',
      motherName: '',
    });
    document.getElementById('rf-firstName')?.focus();
  }

  const initials = selected?.guestName
    ? selected.guestName.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="roomio-rez-quick__smart">
      <div className="roomio-rez-quick__smart-head">
        <Sparkles size={15} aria-hidden />
        <h2>Misafir bul</h2>
      </div>
      <input
        className="roomio-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ad, telefon veya e-posta yazın — KVKK arşivinden eşleşme aranır"
      />
      {searching ? <p className="roomio-page-desc">Aranıyor…</p> : null}

      {selected ? (
        <div className="roomio-rez-quick__match">
          <div className="roomio-rez-quick__match-av">{initials}</div>
          <div className="roomio-rez-quick__match-info">
            <div className="roomio-rez-quick__match-name">{selected.guestName}</div>
            <div className="roomio-rez-quick__match-meta">
              Son konaklama: {selected.lastStay} · {selected.visits} önceki rezervasyon
            </div>
          </div>
          <Button variant="primary" type="button" onClick={() => void applyGuest(selected)}>
            <Wand2 size={14} aria-hidden style={{ marginRight: 6 }} />
            Bilgileri getir
          </Button>
        </div>
      ) : null}

      {!selected && results.length > 0 ? (
        <div className="roomio-rez-quick__match">
          <div className="roomio-rez-quick__match-av">
            {results[0]!.guestName.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="roomio-rez-quick__match-info">
            <div className="roomio-rez-quick__match-name">{results[0]!.guestName}</div>
            <div className="roomio-rez-quick__match-meta">
              Son konaklama: {results[0]!.lastStay} · {results[0]!.visits} önceki rezervasyon
            </div>
          </div>
          <Button variant="primary" type="button" onClick={() => void applyGuest(results[0]!)}>
            <Wand2 size={14} aria-hidden style={{ marginRight: 6 }} />
            Bilgileri getir
          </Button>
        </div>
      ) : null}

      {showNoMatch && !selected ? (
        <div className="roomio-rez-quick__nomatch">
          <span>Eşleşme bulunamadı.</span>
          <Button variant="secondary" type="button" onClick={newGuest}>Yeni misafir olarak devam et</Button>
        </div>
      ) : null}

      <div className="roomio-rez-quick__ormid">veya</div>
      <p className="roomio-rez-quick__scan-hint">
        Kart okuyucu, MRZ / pasaport tarayıcı veya kamera bağlıysa kullanın — hangi cihaz takılıysa otomatik algılanır.
      </p>
      <div className="roomio-rez-quick__scan-actions">
        <Button variant="primary" type="button" onClick={onScan} disabled={scanning}>
          <ScanLine size={14} aria-hidden style={{ marginRight: 6 }} />
          Kimlik tara
        </Button>
        <Button variant="secondary" type="button" onClick={() => scanFileInputRef.current?.click()} disabled={scanning}>
          <Camera size={14} aria-hidden style={{ marginRight: 6 }} />
          Fotoğraftan
        </Button>
        <input
          ref={scanFileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) {
              setScanDoneName(null);
              onScanImage(file);
            }
          }}
        />
      </div>
      {scanning ? (
        <div className="roomio-rez-quick__scan-status">
          <Loader2 size={16} className="roomio-rez-quick__spin" aria-hidden />
          Taranıyor…
        </div>
      ) : null}
      {scanMessage && !scanning ? (
        <div className="roomio-rez-quick__scan-result">
          <span className="roomio-rez-quick__scan-ok">✓</span>
          <div>
            <div className="roomio-rez-quick__match-name">{scanDoneName ?? 'Belge okundu'}</div>
            <div className="roomio-rez-quick__match-meta">{scanMessage}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
