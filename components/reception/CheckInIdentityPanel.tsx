'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ScanLine } from 'lucide-react';
import { EgmIdentityFormPanel } from '@/components/egm/EgmIdentityFormPanel';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import {
  computeEgmStatus,
  emptyEgmForm,
  type EgmIdentityForm,
} from '@/lib/egm/types';
import { buildEgmFormFromScan } from '@/lib/integrations/id-reader/map-to-egm';
import { validateEgmFormForCheckIn } from '@/lib/integrations/id-reader/validate';
import type { IdScanResult } from '@/lib/integrations/id-reader/types';
import { EgmStatusBadge } from '@/components/egm/EgmStatusBadge';

type ReaderPolicy = {
  enabled: boolean;
  autoFillOnCheckIn: boolean;
  requireManualApproval: boolean;
  blockCheckInUntilReady: boolean;
  autoSendEgmAfterCheckIn: boolean;
  deviceCount: number;
};

export type CheckInIdentityState = {
  form: EgmIdentityForm;
  approved: boolean;
  scanScore: number | null;
  canSubmit: boolean;
  blockReason: string | null;
};

type Props = {
  seed: Partial<EgmIdentityForm>;
  roomNo: string;
  onChange: (state: CheckInIdentityState) => void;
};

/**
 * Reads an image file and re-encodes it as a downsized JPEG data URL,
 * entirely in browser memory (FileReader + canvas — no upload, no storage).
 * Keeps the payload reasonable for the local OCR fallback and is discarded
 * the moment the caller's fetch call completes; nothing here is ever written
 * to localStorage/sessionStorage or any persistent store.
 */
function fileToDownsizedDataUrl(file: File, maxDim = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel açılamadı'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas desteklenmiyor'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function CheckInIdentityPanel({ seed, roomNo, onChange }: Props) {
  const [policy, setPolicy] = useState<ReaderPolicy | null>(null);
  const [form, setForm] = useState<EgmIdentityForm>(() => emptyEgmForm(seed));
  const [approved, setApproved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanScore, setScanScore] = useState<number | null>(null);
  const [scanErrors, setScanErrors] = useState<string[]>([]);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);

  useEffect(() => {
    void roomioFetch('/api/integrations/id-reader/check-in-config')
      .then((r) => r.json())
      .then((j: ReaderPolicy) => setPolicy(j))
      .catch(() => setPolicy(null));
  }, []);

  useEffect(() => {
    setForm((prev) => emptyEgmForm({ ...seed, ...prev, roomNo: roomNo || prev.roomNo }));
  }, [seed, roomNo]);

  const formValidation = useMemo(
    () => validateEgmFormForCheckIn({ ...form, roomNo: roomNo || form.roomNo }),
    [form, roomNo],
  );

  const egmStatus = computeEgmStatus({ ...form, roomNo: roomNo || form.roomNo });

  const blockReason = useMemo(() => {
    if (policy?.enabled === false) return null;
    if (policy?.requireManualApproval && !approved) {
      return 'Kimlik bilgilerini kontrol edip onay kutusunu işaretleyin.';
    }
    if (policy?.blockCheckInUntilReady && egmStatus !== 'ready') {
      return 'EGM alanları eksik — tüm zorunlu alanları doldurun.';
    }
    if (!formValidation.ok) {
      return formValidation.errors[0] ?? 'Kimlik doğrulama hatası';
    }
    return null;
  }, [approved, egmStatus, formValidation, policy]);

  const canSubmit = !blockReason;

  useEffect(() => {
    onChange({
      form: { ...form, roomNo: roomNo || form.roomNo },
      approved,
      scanScore,
      canSubmit,
      blockReason,
    });
  }, [form, approved, scanScore, canSubmit, blockReason, roomNo, onChange]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyScanResponse = useCallback(
    (scan: IdScanResult) => {
      const mapped = buildEgmFormFromScan(scan, { ...seed, roomNo: roomNo || seed.roomNo });
      setForm(mapped.form);
      setScanMessage(scan.message);
      setScanScore(scan.validation?.score ?? mapped.validation.score);
      setScanErrors(scan.validation?.errors ?? mapped.validation.errors);
      setScanWarnings(scan.validation?.warnings ?? mapped.validation.warnings);
    },
    [roomNo, seed],
  );

  const scan = useCallback(async () => {
    setScanning(true);
    setScanMessage(null);
    setScanErrors([]);
    setScanWarnings([]);
    setApproved(false);
    try {
      const res = await roomioFetch('/api/integrations/id-reader/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: seed.reservationId }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Tarama başarısız'));
      applyScanResponse((await res.json()) as IdScanResult);
    } catch (err) {
      setScanMessage(err instanceof Error ? err.message : 'Tarama başarısız');
      setScanScore(null);
    } finally {
      setScanning(false);
    }
  }, [applyScanResponse, seed]);

  const scanFromImage = useCallback(
    async (file: File) => {
      setScanning(true);
      setScanMessage(null);
      setScanErrors([]);
      setScanWarnings([]);
      setApproved(false);
      try {
        const imageBase64 = await fileToDownsizedDataUrl(file);
        const res = await roomioFetch('/api/integrations/id-reader/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, reservationId: seed.reservationId }),
        });
        if (!res.ok) throw new Error(await parseApiError(res, 'Tarama başarısız'));
        applyScanResponse((await res.json()) as IdScanResult);
      } catch (err) {
        setScanMessage(err instanceof Error ? err.message : 'Tarama başarısız');
        setScanScore(null);
      } finally {
        setScanning(false);
      }
    },
    [applyScanResponse, seed],
  );

  const panelValues = useMemo(
    () => ({
      guestName: `${form.firstName} ${form.lastName}`.trim(),
      firstName: form.firstName,
      lastName: form.lastName,
      nationality: form.nationality,
      idNo: form.idNo,
      idType: form.idType,
      birthDate: form.birthDate,
      birthPlace: form.birthPlace,
      gender: form.gender,
      fatherName: form.fatherName,
      motherName: form.motherName,
      checkIn: form.checkIn,
      fixRoomNo: roomNo || form.roomNo,
    }),
    [form, roomNo],
  );

  if (policy && !policy.enabled) {
    return (
      <div className="roomio-card">
        <h2 className="roomio-card-title">Kimlik / EGM</h2>
        <p className="roomio-page-desc">Kimlik okuyucu entegrasyonu kapalı. Ayarlardan etkinleştirin.</p>
      </div>
    );
  }

  return (
    <div className="roomio-card roomio-checkin-identity">
      <div className="roomio-checkin-identity__head">
        <div>
          <h2 className="roomio-card-title">Kimlik Tara — EGM Bildirimi</h2>
          <p className="roomio-page-desc">
            Kimlikokur ile tarayın, alanları kontrol edin ve onaylayın. Otomatik EGM gönderimi check-in sonrası yapılır.
          </p>
        </div>
        <EgmStatusBadge status={egmStatus} />
      </div>

      <div className="roomio-form-actions roomio-checkin-identity__actions">
        <Button variant="primary" onClick={() => void scan()} disabled={scanning}>
          <ScanLine size={16} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {scanning ? 'Taranıyor…' : 'Kimlik / Pasaport Tara'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          title="Kimlik/pasaport fotoğrafını yükleyin — tamamen yerel OCR ile okunur, görsel sunucuda saklanmaz"
        >
          <Camera size={16} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {scanning ? 'Taranıyor…' : 'Fotoğraftan Tara (Yerel OCR)'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void scanFromImage(file);
          }}
        />
        {scanScore !== null ? (
          <span className={`roomio-badge${scanScore >= 90 ? ' roomio-badge--success' : scanScore >= 70 ? '' : ' roomio-badge--warn'}`}>
            Güven skoru: %{scanScore}
          </span>
        ) : null}
      </div>

      {scanMessage ? <p className="roomio-page-desc">{scanMessage}</p> : null}

      {scanErrors.length > 0 ? (
        <div className="roomio-alert roomio-alert--danger" role="alert">
          <strong>Doğrulama hatası:</strong> {scanErrors.join(' · ')}
        </div>
      ) : null}

      {scanWarnings.length > 0 ? (
        <div className="roomio-alert roomio-alert--warn" role="status">
          <strong>Kontrol edin:</strong> {scanWarnings.join(' · ')}
        </div>
      ) : null}

      {!formValidation.ok && scanErrors.length === 0 ? (
        <div className="roomio-alert roomio-alert--danger" role="alert">
          {formValidation.errors.join(' · ')}
        </div>
      ) : null}

      {formValidation.warnings.length > 0 && scanWarnings.length === 0 ? (
        <div className="roomio-alert roomio-alert--warn" role="status">
          {formValidation.warnings.join(' · ')}
        </div>
      ) : null}

      <EgmIdentityFormPanel
        refNo={seed.refNo}
        values={panelValues}
        onChange={(patch) => {
          setApproved(false);
          setForm((prev) =>
            emptyEgmForm({
              ...prev,
              firstName: String(patch.firstName ?? prev.firstName),
              lastName: String(patch.lastName ?? prev.lastName),
              nationality: String(patch.nationality ?? prev.nationality),
              idNo: String(patch.idNo ?? prev.idNo),
              idType: (patch.idType as EgmIdentityForm['idType']) ?? prev.idType,
              birthDate: String(patch.birthDate ?? prev.birthDate),
              birthPlace: String(patch.birthPlace ?? prev.birthPlace),
              gender: (patch.gender as EgmIdentityForm['gender']) ?? prev.gender,
              fatherName: String(patch.fatherName ?? prev.fatherName),
              motherName: String(patch.motherName ?? prev.motherName),
              roomNo: roomNo || prev.roomNo,
              checkIn: prev.checkIn,
              checkOut: prev.checkOut,
              reservationId: prev.reservationId,
              refNo: prev.refNo,
            }),
          );
        }}
      />

      <label className="roomio-field roomio-field--row roomio-checkin-identity__approve">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
          disabled={!formValidation.ok || (policy?.blockCheckInUntilReady && egmStatus !== 'ready')}
        />
        <span>
          Kimlik bilgilerini belge ile karşılaştırdım ve EGM bildirimi için onaylıyorum.
          {policy?.requireManualApproval === false ? ' (otomatik onay modu)' : ''}
        </span>
      </label>

      {blockReason ? (
        <p className="roomio-text-warn" role="status">{blockReason}</p>
      ) : (
        <p className="roomio-page-desc roomio-text-success">Check-in için kimlik adımı tamam.</p>
      )}
    </div>
  );
}
