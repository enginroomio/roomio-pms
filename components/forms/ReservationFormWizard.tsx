'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ScanLine, Zap, Check, Bed, Banknote, FileText, IdCard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui';
import { EgmIdentityFormPanel } from '@/components/egm/EgmIdentityFormPanel';
import { EgmStatusBadge } from '@/components/egm/EgmStatusBadge';
import { AgencyPicker } from '@/components/forms/AgencyPicker';
import { CompanyPicker } from '@/components/forms/CompanyPicker';
import { GuestArchiveLookup } from '@/components/forms/GuestArchiveLookup';
import { RatePlanPicker } from '@/components/forms/RatePlanPicker';
import { ReservationPricingPanel } from '@/components/forms/ReservationPricingPanel';
import { ReservationStayAvailability } from '@/components/forms/ReservationStayAvailability';
import { addReservation, updateLocalReservation } from '@/lib/data/reservations-store';
import {
  defaultFormLayout,
  elektraCoverage,
  formFieldLabel,
  formPageById,
  mergeFormLayoutWithDefaults,
  type FormFieldConfig,
  type FormLayout,
} from '@/lib/forms/form-catalog';
import { foreignToTry, formatDualMoney, formatMoney, rateMapFromRows, tryToForeign } from '@/lib/exchange/money';
import { PAYMENT_CURRENCIES, type ExchangeRateSnapshot, type PaymentCurrency } from '@/lib/exchange/types';
import { calculateTaxes } from '@/lib/tax/calculate';
import type { TaxRule } from '@/lib/tax/types';
import { computeEgmStatus, splitGuestName } from '@/lib/egm/types';
import type { Reservation } from '@/lib/types/reservation';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { buildEgmFormFromScan } from '@/lib/integrations/id-reader/map-to-egm';
import type { IdScanResult } from '@/lib/integrations/id-reader/types';
import { QuickGuestFinder } from '@/components/forms/reservation-quick-entry/QuickGuestFinder';
import {
  QuickChipGroup,
  QuickCurrencyPicker,
  QuickJumpNav,
  QuickKbsChecklist,
  QuickSectionHead,
  QuickStepper,
  QuickToast,
} from '@/components/forms/reservation-quick-entry/QuickUiParts';

/**
 * Reads an image file and re-encodes it as a downsized JPEG data URL,
 * entirely in browser memory (FileReader + canvas — no upload, no storage).
 * Mirrors components/reception/CheckInIdentityPanel.tsx's helper of the same
 * name; kept local here to avoid coupling the two components together.
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

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function DualAmount({ amount, currency, rates }: { amount: number; currency: string; rates: ReturnType<typeof rateMapFromRows> }) {
  const { primary, secondary } = formatDualMoney(amount, currency, rates);
  return (
    <span className="roomio-dual-amount">
      <strong>{primary}</strong>
      {secondary ? <em>{secondary}</em> : null}
    </span>
  );
}

type FormValues = Record<string, string | number>;

const PRICING_PRIMARY_KEYS = new Set(['currency', 'rate', 'rateDate']);

const DEFAULTS: FormValues = {
  senderType: 'Münferit',
  agency: 'Direct',
  agencyCode: '',
  resType: 'Kesin',
  checkIn: '2026-06-20',
  checkOut: '2026-06-22',
  arrivalTime: '14:00',
  departureTime: '12:00',
  roomType: 'DBL',
  roomCount: 1,
  mealPlan: 'BB',
  adults: 2,
  children: 0,
  infants: 0,
  nationality: 'TR',
  currency: 'TRY',
  rate: 5200,
  ratePlanCode: '',
  discountPct: 0,
  market: 'BAR',
  segment: 'LEIS',
  source: 'DIR',
  paymentType: 'Kredi Kartı',
  payerType: 'Misafir',
  companyCode: '',
  depositAmount: 0,
  idType: 'TCKN',
  birthDate: '',
  birthPlace: '',
  gender: '',
  fatherName: '',
  motherName: '',
  firstName: '',
  lastName: '',
};

function reservationToFormValues(r: Reservation): FormValues {
  const extra = r.extraData ?? {};
  return {
    ...DEFAULTS,
    ...extra,
    guestName: r.guestName,
    email: r.email ?? '',
    phone: r.phone ?? '',
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    roomType: r.roomType,
    mealPlan: r.mealPlan,
    adults: r.adults,
    children: r.children,
    currency: r.currency,
    rate: r.rate,
    agency: r.agency,
    market: r.market,
    notes: r.notes ?? '',
    resType: r.status === 'OPTION' ? 'Opsiyon' : r.status === 'CONFIRMED' ? 'Kesin' : 'Kesin',
  };
}

type Props = {
  existing?: Reservation;
  seed?: { fixRoomNo?: string; checkIn?: string };
  embedded?: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  /** Düzenlemede tüm adımları tek ekranda göster */
  singleScreen?: boolean;
};

export function ReservationFormWizard({ existing, seed, embedded, onComplete, onCancel, singleScreen: singleScreenProp }: Props) {
  const isEdit = Boolean(existing);
  const singleScreen = singleScreenProp ?? !embedded;
  const router = useRouter();
  const [layout, setLayout] = useState<FormLayout | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<FormValues>(() => {
    const base = existing ? reservationToFormValues(existing) : { ...DEFAULTS };
    if (seed?.fixRoomNo) base.fixRoomNo = seed.fixRoomNo;
    if (seed?.checkIn) base.checkIn = seed.checkIn;
    return base;
  });
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [fx, setFx] = useState<ExchangeRateSnapshot | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [egmWarning, setEgmWarning] = useState<string | null>(null);
  const [marketRequired, setMarketRequired] = useState(false);
  const [refPreview, setRefPreview] = useState(existing?.refNo ?? '');
  const [roomTypeOptions, setRoomTypeOptions] = useState<{ code: string; label: string }[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanScore, setScanScore] = useState<number | null>(null);
  const [scanErrors, setScanErrors] = useState<string[]>([]);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [toastKind, setToastKind] = useState<'ok' | 'err'>('ok');
  const scanFileInputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<() => void>(() => {});

  const page = formPageById('reservations-new')!;
  const coverage = useMemo(() => elektraCoverage('reservations-new'), []);
  const checkIn = String(values.checkIn ?? '');
  const rateDate = checkIn || todayIso();
  const rateMap = useMemo(() => rateMapFromRows(fx?.rates ?? []), [fx]);
  const currency = String(values.currency ?? 'TRY');
  const rate = Number(values.rate ?? 0);
  const roomCount = Math.max(1, Number(values.roomCount ?? 1));
  const discountPct = Number(values.discountPct ?? 0);
  const nights = nightsBetween(String(values.checkIn ?? ''), String(values.checkOut ?? ''));
  const nightCount = Math.max(nights, 1);

  function addDaysIso(iso: string, days: number): string {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function applyNightCount(n: number) {
    const ci = String(values.checkIn ?? '');
    if (ci) setValues((prev) => ({ ...prev, checkOut: addDaysIso(ci, n) }));
  }

  function quickCheckin(offset: number) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const iso = d.toISOString().slice(0, 10);
    setValues((prev) => ({ ...prev, checkIn: iso, checkOut: addDaysIso(iso, Math.max(nights, 2)) }));
  }

  function saveDraft() {
    try {
      localStorage.setItem('roomio-rez-draft', JSON.stringify(values));
      setToastKind('ok');
      setToast('Taslak olarak kaydedildi');
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToastKind('err');
      setToast('Taslak kaydedilemedi');
    }
  }

  useEffect(() => {
    if (!singleScreen || isEdit) return;
    try {
      const raw = localStorage.getItem('roomio-rez-draft');
      if (raw && !existing) {
        const draft = JSON.parse(raw) as FormValues;
        setValues((prev) => ({ ...prev, ...draft }));
      }
    } catch {
      // ignore corrupt draft
    }
  }, [singleScreen, isEdit, existing]);

  useEffect(() => {
    if (!singleScreen || isEdit) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        submitRef.current();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [singleScreen, isEdit]);

  const gross = rate * nightCount * roomCount;
  const subtotal = Math.round(gross * (1 - discountPct / 100));
  const taxes = useMemo(() => calculateTaxes(subtotal, taxRules), [subtotal, taxRules]);
  const senderType = String(values.senderType ?? 'Münferit');
  const egmStatus = useMemo(() => {
    const { firstName, lastName } = splitGuestName(String(values.guestName ?? ''));
    return computeEgmStatus({
      firstName: String(values.firstName || firstName),
      lastName: String(values.lastName || lastName),
      roomNo: String(values.fixRoomNo ?? ''),
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
  }, [values]);

  const applyScanResponse = useCallback(
    (scan: IdScanResult) => {
      const mapped = buildEgmFormFromScan(scan, {
        firstName: String(values.firstName ?? ''),
        lastName: String(values.lastName ?? ''),
        nationality: String(values.nationality ?? 'TR'),
        roomNo: String(values.fixRoomNo ?? ''),
        checkIn: String(values.checkIn ?? ''),
        checkOut: String(values.checkOut ?? ''),
      });
      setValues((prev) => ({
        ...prev,
        firstName: mapped.form.firstName,
        lastName: mapped.form.lastName,
        guestName: String(prev.guestName ?? '').trim()
          ? prev.guestName
          : `${mapped.form.firstName} ${mapped.form.lastName}`.trim(),
        nationality: mapped.form.nationality,
        idNo: mapped.form.idNo,
        idType: mapped.form.idType,
        birthDate: mapped.form.birthDate,
        birthPlace: mapped.form.birthPlace,
        gender: mapped.form.gender,
        fatherName: mapped.form.fatherName,
        motherName: mapped.form.motherName,
      }));
      setScanMessage(scan.message);
      setScanScore(scan.validation?.score ?? mapped.validation.score);
      setScanErrors(scan.validation?.errors ?? mapped.validation.errors);
      setScanWarnings(scan.validation?.warnings ?? mapped.validation.warnings);
    },
    [values.firstName, values.lastName, values.nationality, values.fixRoomNo, values.checkIn, values.checkOut],
  );

  const runIdScan = useCallback(
    async (imageBase64?: string) => {
      setScanning(true);
      setScanMessage(null);
      setScanErrors([]);
      setScanWarnings([]);
      try {
        const res = await roomioFetch('/api/integrations/id-reader/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imageBase64 ? { imageBase64 } : {}),
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
    [applyScanResponse],
  );

  const scanFromImage = useCallback(
    async (file: File) => {
      try {
        const imageBase64 = await fileToDownsizedDataUrl(file);
        await runIdScan(imageBase64);
      } catch (err) {
        setScanMessage(err instanceof Error ? err.message : 'Görsel okunamadı');
      }
    },
    [runIdScan],
  );

  const loadFx = useCallback(async (date: string, refresh = false) => {
    setFxLoading(true);
    try {
      const res = await roomioFetch(
        `/api/exchange-rates?date=${encodeURIComponent(date)}${refresh ? '&refresh=1' : ''}`,
      );
      const j = (await res.json()) as ExchangeRateSnapshot & { ok?: boolean; error?: string };
      if (res.ok && j.rates?.length) {
        setFx(j);
      } else {
        setFx(null);
      }
    } catch {
      setFx(null);
    } finally {
      setFxLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [tplRes, taxRes, marketRes, refRes, typesRes] = await Promise.all([
          roomioFetch('/api/reports/templates?pageId=reservations-new'),
          roomioFetch('/api/tax/rules'),
          roomioFetch('/api/market-required'),
          existing?.refNo ? Promise.resolve(null) : roomioFetch('/api/reservations/next-ref'),
          roomioFetch('/api/room-type-defs'),
        ]);
        const tplJ = (await tplRes.json()) as { template?: { layout?: FormLayout } };
        const taxJ = (await taxRes.json()) as { rules?: TaxRule[] };
        const marketJ = (await marketRes.json()) as { required?: boolean };
        setLayout(
          mergeFormLayoutWithDefaults('reservations-new', tplJ.template?.layout)
            ?? defaultFormLayout('reservations-new'),
        );
        if (taxJ.rules) setTaxRules(taxJ.rules);
        setMarketRequired(Boolean(marketJ.required));

        if (refRes) {
          const refJ = (await refRes.json()) as { refNo?: string };
          if (refJ.refNo) setRefPreview(refJ.refNo);
        }

        const typesJ = (await typesRes.json()) as { types?: { code: string; short: string; name: string; active?: boolean }[] };
        if (typesJ.types?.length) {
          setRoomTypeOptions(
            typesJ.types
              .filter((t) => t.active !== false)
              .map((t) => ({ code: t.code, label: `${t.short} — ${t.name}` })),
          );
        }
      } catch {
        setLayout(defaultFormLayout('reservations-new'));
      }
    })();
  }, [existing?.refNo]);

  useEffect(() => {
    void loadFx(rateDate);
  }, [rateDate, loadFx]);

  const currencyOptions = useMemo(() => {
    const fromFx = fx?.rates.map((r) => r.code) ?? [];
    return [...PAYMENT_CURRENCIES, ...fromFx].filter((c, i, a) => a.indexOf(c) === i);
  }, [fx]);

  const steps = layout?.steps ?? page.steps;
  const activeStep = steps[stepIndex];

  const requiredFieldKeys = useMemo(
    () => layout?.fields.filter((f) => f.required).map((f) => f.key) ?? [],
    [layout],
  );
  const missingRequiredKeys = useMemo(
    () => requiredFieldKeys.filter((k) => !String(values[k] ?? '').trim()),
    [requiredFieldKeys, values],
  );
  const requiredTotal = requiredFieldKeys.length;
  const requiredDone = requiredTotal - missingRequiredKeys.length;
  const progressPct = requiredTotal > 0 ? Math.round((requiredDone / requiredTotal) * 100) : 100;

  useEffect(() => {
    // Tek ekran modunda zaten mount anında normal (cache'li) kur yükleniyor
    // (yukarıdaki effect) — burada ayrıca canlı TCMB sorgusu zorlamak (refresh=1)
    // sayfa açılışında fazladan, yavaşlatan bir ağ isteğiydi; kaldırıldı.
    if (activeStep?.id === 'pricing') {
      void loadFx(rateDate, true);
    }
  }, [activeStep?.id, rateDate, loadFx]);

  const selectedFxRow = currency === 'TRY' ? rateMap.get('TRY') : rateMap.get(currency);
  const exchangeRate = currency === 'TRY' ? 1 : (selectedFxRow?.tryPerUnitBuy ?? 0);

  function setValue(key: string, val: string | number) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function onCurrencyChange(next: PaymentCurrency) {
    const tryValue = foreignToTry(rate, currency, rateMap);
    const converted = next === 'TRY' ? tryValue : tryToForeign(tryValue, next, rateMap);
    const step = next === 'JPY' ? 1 : next === 'TRY' ? 100 : 0.01;
    setValues((prev) => ({ ...prev, currency: next, rate: Math.round(converted / step) * step }));
  }

  function fieldDef(key: string, cfg: FormFieldConfig) {
    return page.fields.find((f) => f.key === key) ?? {
      key,
      label: cfg.label ?? key,
      type: cfg.type ?? 'text',
      options: cfg.options,
    };
  }

  function shouldShowField(key: string): boolean {
    if (key === 'agency' && senderType !== 'Acenta') return false;
    if (key === 'companyName' && senderType !== 'Şirket') return false;
    return true;
  }

  function inputType(defType: string): string {
    if (defType === 'number') return 'number';
    if (defType === 'date') return 'date';
    if (defType === 'time') return 'time';
    if (defType === 'email') return 'email';
    if (defType === 'tel') return 'tel';
    return 'text';
  }

  const fxReady = Boolean(fx?.rates?.length);

  function renderField(cfg: FormFieldConfig, opts?: { textareaRows?: number }) {
    if (!shouldShowField(cfg.key)) return null;
    const def = fieldDef(cfg.key, cfg);
    const label = cfg.label ?? formFieldLabel('reservations-new', cfg.key, def.label);
    const val = values[cfg.key] ?? def.defaultValue ?? '';
    const full = cfg.width === 'full';
    const hasError = fieldErrors.has(cfg.key);
    const fieldId = `rf-${cfg.key}`;

    if (cfg.key === 'currency' || def.type === 'currency' || cfg.type === 'currency') {
      return (
        <label key={cfg.key} htmlFor={fieldId} className={`roomio-field${full ? ' roomio-field--full' : ''}`}>
          <span>{label}{cfg.required ? ' *' : ''}</span>
          <select
            id={fieldId}
            className={`roomio-select${hasError ? ' roomio-field-error' : ''}`}
            value={String(val)}
            onChange={(e) => onCurrencyChange(e.target.value as PaymentCurrency)}
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {!fxReady && currency !== 'TRY' ? (
            <small className="roomio-field-hint">TCMB kuru yüklenince TL karşılığı hesaplanır.</small>
          ) : null}
        </label>
      );
    }

    if (def.type === 'select') {
      const options = cfg.key === 'roomType' && roomTypeOptions.length
        ? roomTypeOptions.map((o) => o.code)
        : (def.options ?? []);
      const optionLabel = (o: string) => {
        if (cfg.key === 'roomType') {
          const row = roomTypeOptions.find((t) => t.code === o);
          return row?.label ?? o;
        }
        return o;
      };
      return (
        <label key={cfg.key} htmlFor={fieldId} className={`roomio-field${full ? ' roomio-field--full' : ''}`}>
          <span>{label}{cfg.required ? ' *' : ''}</span>
          <select
            id={fieldId}
            className={`roomio-select${hasError ? ' roomio-field-error' : ''}`}
            value={String(val)}
            required={cfg.required}
            onChange={(e) => setValue(cfg.key, e.target.value)}
          >
            {options.map((o) => <option key={o} value={o}>{optionLabel(o)}</option>)}
          </select>
        </label>
      );
    }

    if (def.type === 'textarea') {
      return (
        <label key={cfg.key} htmlFor={fieldId} className="roomio-field roomio-field--full">
          <span>{label}</span>
          <textarea
            id={fieldId}
            className={`roomio-input${hasError ? ' roomio-field-error' : ''}`}
            rows={opts?.textareaRows ?? 3}
            value={String(val)}
            onChange={(e) => setValue(cfg.key, e.target.value)}
          />
        </label>
      );
    }

    return (
      <label key={cfg.key} htmlFor={fieldId} className={`roomio-field${full ? ' roomio-field--full' : ''}`}>
        <span>{label}{cfg.required ? ' *' : ''}</span>
        <input
          id={fieldId}
          className={`roomio-input${hasError ? ' roomio-field-error' : ''}`}
          type={inputType(def.type)}
          value={val}
          required={cfg.required}
          placeholder={def.placeholder}
          min={def.type === 'number' ? 0 : undefined}
          onChange={(e) => setValue(cfg.key, def.type === 'number' ? Number(e.target.value) : e.target.value)}
        />
      </label>
    );
  }

  function mapStatus(): Reservation['status'] {
    const t = String(values.resType ?? 'Kesin');
    if (t === 'Opsiyon') return 'OPTION';
    if (t === 'Beklemede') return 'OPTION';
    return 'CONFIRMED';
  }

  async function onSubmit() {
    setSubmitError(null);
    setEgmWarning(null);
    setFieldErrors(new Set());

    if (missingRequiredKeys.length > 0) {
      setFieldErrors(new Set(missingRequiredKeys));
      const firstKey = missingRequiredKeys[0];
      const stepId = layout?.fields.find((f) => f.key === firstKey)?.stepId;
      const stepEl = stepId
        ? document.getElementById(isEdit ? `rez-edit-step-${stepId}` : `rez-new-step-${stepId}`)
        : null;
      const fieldEl = document.getElementById(`rf-${firstKey}`);
      (stepEl ?? fieldEl)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldEl?.focus?.();
      setSubmitError(
        `Eksik zorunlu alanlar: ${missingRequiredKeys
          .map((k) => formFieldLabel('reservations-new', k))
          .join(', ')}`,
      );
      setToastKind('err');
      setToast('Eksik zorunlu alanlar var — kırmızı işaretli alanları tamamlayın');
      setTimeout(() => setToast(null), 2800);
      setTimeout(() => setFieldErrors(new Set()), 2200);
      return;
    }

    if (marketRequired && !String(values.market ?? '').trim()) {
      setSubmitError('Market kodu zorunludur — Kuruluş ayarlarından kontrol edin.');
      return;
    }

    const submissionValues: FormValues = {
      ...values,
      rateDate,
      exchangeRate: currency === 'TRY' ? 1 : exchangeRate,
    };
    const coreKeys = new Set([
      'guestName', 'checkIn', 'checkOut', 'roomType', 'mealPlan', 'rate', 'currency',
      'agency', 'market', 'adults', 'children', 'email', 'phone', 'notes',
    ]);
    const extraData: Record<string, string> = {};
    for (const [k, v] of Object.entries(submissionValues)) {
      if (!coreKeys.has(k)) extraData[k] = String(v);
    }

    const fixRoomNo = String(values.fixRoomNo ?? '').trim();
    const agencyCode = String(values.agencyCode ?? '').trim();

    const reservation: Reservation = {
      id: existing?.id ?? `new-${Date.now()}`,
      refNo: existing?.refNo ?? (refPreview || '1'),
      guestName: String(values.guestName ?? ''),
      email: values.email ? String(values.email) : undefined,
      phone: values.phone ? String(values.phone) : undefined,
      checkIn: String(values.checkIn ?? ''),
      checkOut: String(values.checkOut ?? ''),
      roomType: String(values.roomType ?? 'DBL'),
      roomNo: fixRoomNo || undefined,
      adults: Number(values.adults ?? 2),
      children: Number(values.children ?? 0),
      mealPlan: String(values.mealPlan ?? 'BB'),
      rate,
      currency: currency as PaymentCurrency,
      agency: senderType === 'Acenta' ? String(values.agency ?? 'Direct') : senderType,
      market: String(values.market ?? 'BAR'),
      status: isEdit ? (existing?.status ?? mapStatus()) : mapStatus(),
      createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10),
      notes: values.notes ? String(values.notes) : undefined,
      extraData: Object.keys(extraData).length ? extraData : undefined,
    };

    if (agencyCode) {
      reservation.extraData = { ...(reservation.extraData ?? {}), agencyCode };
    }

    const payload = {
      id: reservation.id,
      refNo: reservation.refNo,
      guestName: reservation.guestName,
      email: reservation.email,
      phone: reservation.phone,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      roomType: reservation.roomType,
      roomNo: reservation.roomNo,
      adults: reservation.adults,
      children: reservation.children,
      mealPlan: reservation.mealPlan,
      rate: reservation.rate,
      currency: reservation.currency,
      agency: reservation.agency,
      market: reservation.market,
      status: reservation.status,
      notes: reservation.notes,
      extraData: reservation.extraData,
    };

    if (isEdit) {
      const res = await roomioFetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setSubmitError(await parseApiError(res, 'Güncelleme başarısız'));
        return;
      }
      updateLocalReservation(reservation.id, reservation);
    } else {
      addReservation(reservation);
      const res = await roomioFetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation),
      });
      if (!res.ok) {
        setSubmitError(await parseApiError(res, 'Kayıt başarısız'));
        return;
      }
    }

    if (String(values.idNo ?? '').trim()) {
      const { firstName: fn, lastName: ln } = splitGuestName(String(values.guestName ?? ''));
      try {
        const egmRes = await roomioFetch('/api/egm/identity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            form: {
              reservationId: reservation.id,
              refNo: reservation.refNo,
              firstName: String(values.firstName || fn),
              lastName: String(values.lastName || ln),
              roomNo: String(values.fixRoomNo ?? ''),
              nationality: String(values.nationality ?? 'TR'),
              idNo: String(values.idNo ?? ''),
              idType: (values.idType as 'TCKN' | 'PASSPORT' | 'OTHER') ?? 'TCKN',
              birthDate: String(values.birthDate ?? ''),
              birthPlace: String(values.birthPlace ?? ''),
              gender: (values.gender as 'E' | 'K' | '') ?? '',
              fatherName: String(values.fatherName ?? ''),
              motherName: String(values.motherName ?? ''),
              checkIn: String(values.checkIn ?? ''),
              checkOut: String(values.checkOut ?? ''),
            },
          }),
        });
        if (!egmRes.ok) {
          setEgmWarning(await parseApiError(egmRes, 'EGM kimlik kaydı oluşturulamadı'));
        }
      } catch (err) {
        setEgmWarning(err instanceof Error ? err.message : 'EGM kimlik kaydı oluşturulamadı');
      }
    }

    setSaved(true);
    setSubmitError(null);
    setToastKind('ok');
    setToast(`Rezervasyon kaydedildi — no. ${reservation.refNo}`);
    try {
      localStorage.removeItem('roomio-rez-draft');
    } catch {
      // ignore
    }
    if (embedded) {
      onComplete?.();
      return;
    }
    const successTarget = isEdit ? `/reservations/${reservation.id}` : '/reservations';
    setTimeout(() => router.push(successTarget), isEdit ? 1200 : 800);
  }

  submitRef.current = () => { void onSubmit(); };

  if (!layout) {
    return <p className="roomio-page-desc">Form yükleniyor…</p>;
  }

  function fieldsForStep(stepId: string) {
    return layout?.fields.filter((f) => f.stepId === stepId) ?? [];
  }

  function renderStepContent(stepId: string, compact = false, wizardCompact = false, withScan = false) {
    const stepFields = fieldsForStep(stepId);

    if (stepId === 'egm') {
      if (compact) {
        return (
          <div className="roomio-form-grid roomio-form-grid--3 roomio-rez-edit-screen__fields">
            {stepFields.map((f) => renderField(f))}
          </div>
        );
      }
      return (
        <>
          {withScan ? (
            <div className="roomio-rez-id-scan">
              <div className="roomio-form-actions roomio-rez-id-scan__actions">
                <Button variant="primary" onClick={() => void runIdScan()} disabled={scanning}>
                  <ScanLine size={14} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {scanning ? 'Taranıyor…' : 'Kimlik / Pasaport Tara'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => scanFileInputRef.current?.click()}
                  disabled={scanning}
                  title="Kimlik/pasaport fotoğrafını yükleyin — yerel OCR ile okunur, görsel sunucuda saklanmaz"
                >
                  <Camera size={14} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Fotoğraftan Tara
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
                    if (file) void scanFromImage(file);
                  }}
                />
                {scanScore !== null ? (
                  <span className={`roomio-badge${scanScore >= 90 ? ' roomio-badge--success' : scanScore >= 70 ? '' : ' roomio-badge--warn'}`}>
                    Güven skoru: %{scanScore}
                  </span>
                ) : null}
              </div>
              {scanMessage ? <p className="roomio-page-desc roomio-rez-id-scan__msg">{scanMessage}</p> : null}
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
            </div>
          ) : null}
          <EgmIdentityFormPanel
            compact={wizardCompact}
            values={values}
            refNo={refPreview}
            onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
            skipArchiveSearch={singleScreen}
          />
        </>
      );
    }

    if (stepId === 'guest') {
      return (
        <>
          {!compact ? (
            <GuestArchiveLookup values={values} onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))} />
          ) : null}
          <CompanyPicker
            senderType={senderType}
            companyCode={String(values.companyCode ?? '')}
            onSelect={(code, name) => setValues((prev) => ({ ...prev, companyCode: code, companyName: name }))}
          />
          <AgencyPicker
            senderType={senderType}
            agencyCode={String(values.agencyCode ?? values.agency ?? '')}
            onSelect={(code, name) => setValues((prev) => ({ ...prev, agencyCode: code, agency: name, market: 'OTA' }))}
          />
          <div
            className={`roomio-form-grid roomio-rez-new-wizard__fields ${
              compact ? 'roomio-form-grid--3 roomio-rez-edit-screen__fields' : 'roomio-form-grid--3'
            }`}
          >
            {stepFields.map((f) => renderField(f))}
          </div>
        </>
      );
    }

    if (stepId === 'stay') {
      return (
        <>
          {!compact ? (
            <ReservationStayAvailability
              compact={wizardCompact}
              checkIn={String(values.checkIn ?? '')}
              checkOut={String(values.checkOut ?? '')}
              roomType={String(values.roomType ?? 'DBL')}
              roomCount={roomCount}
            />
          ) : null}
          <div
            className={`roomio-form-grid roomio-rez-new-wizard__fields ${
              compact ? 'roomio-form-grid--3 roomio-rez-edit-screen__fields' : wizardCompact ? 'roomio-form-grid--3' : 'roomio-form-grid--2'
            }`}
          >
            {stepFields.map((f) => renderField(f))}
          </div>
        </>
      );
    }

    if (stepId === 'pricing') {
      return (
        <>
          {!compact ? (
            <RatePlanPicker
              compact={wizardCompact}
              roomType={String(values.roomType ?? 'DBL')}
              checkIn={checkIn}
              selectedCode={String(values.ratePlanCode ?? '')}
              onApply={(plan) => {
                setValues((prev) => ({
                  ...prev,
                  ratePlanCode: plan.code,
                  rate: plan.baseRate,
                  currency: plan.currency,
                  market: plan.market,
                  ...(plan.mealPlan ? { mealPlan: plan.mealPlan } : {}),
                }));
              }}
            />
          ) : null}
          {!compact ? (
            <ReservationPricingPanel
              compact={wizardCompact}
              currency={currency}
              rate={rate}
              rateDate={rateDate}
              exchangeRate={exchangeRate}
              currencyOptions={currencyOptions}
              nights={nights}
              roomCount={roomCount}
              discountPct={discountPct}
              gross={gross}
              subtotal={subtotal}
              taxes={taxes}
              rateMap={rateMap}
              fxReady={fxReady}
              fxLoading={fxLoading}
              fxDate={fx?.date}
              onCurrencyChange={onCurrencyChange}
              onRateChange={(next) => setValue('rate', next)}
              onRefreshFx={() => void loadFx(rateDate, true)}
            />
          ) : null}
          <div
            className={`roomio-form-grid roomio-rez-new-wizard__fields ${
              compact ? 'roomio-form-grid--3 roomio-rez-edit-screen__fields' : wizardCompact ? 'roomio-form-grid--3' : 'roomio-form-grid--2'
            }`}
            style={compact || wizardCompact ? undefined : { marginTop: 16 }}
          >
            {(compact ? stepFields : stepFields.filter((f) => !PRICING_PRIMARY_KEYS.has(f.key))).map((f) => renderField(f))}
          </div>
        </>
      );
    }

    if (stepId === 'extra') {
      const noteKeys = new Set(['checkInNote', 'roomNote', 'checkOutNote', 'notes']);
      const shortFields = stepFields.filter((f) => !noteKeys.has(f.key));
      const noteFields = stepFields.filter((f) => noteKeys.has(f.key));

      if (wizardCompact || compact) {
        return (
          <>
            <div className="roomio-form-grid roomio-form-grid--3 roomio-rez-new-wizard__fields">
              {shortFields.map((f) => renderField(f))}
            </div>
            <div className="roomio-form-grid roomio-form-grid--2 roomio-rez-new-wizard__fields roomio-rez-new-wizard__notes">
              {noteFields.map((f) => renderField(f, { textareaRows: 2 }))}
            </div>
          </>
        );
      }

      return (
        <div className="roomio-form-grid roomio-form-grid--2">
          {stepFields.map((f) => renderField(f))}
        </div>
      );
    }

    return (
      <div
        className={`roomio-form-grid roomio-rez-new-wizard__fields ${
          compact ? 'roomio-form-grid--3 roomio-rez-edit-screen__fields' : wizardCompact ? 'roomio-form-grid--3' : 'roomio-form-grid--2'
        }`}
      >
        {stepFields.map((f) => renderField(f))}
      </div>
    );
  }

  const priceSummary = (
    <aside className="roomio-reservation-new__summary roomio-card">
      <h2 className="roomio-card-title">Fiyat özeti</h2>
      <dl className="roomio-price-summary">
        <div><dt>Rezervasyon no</dt><dd>{refPreview}</dd></div>
        <div><dt>EGM kimlik</dt><dd><EgmStatusBadge status={egmStatus} compact /></dd></div>
        <div><dt>Gece × oda</dt><dd>{nights > 0 ? `${nights} × ${roomCount}` : '—'}</dd></div>
        <div><dt>Gece fiyatı</dt><dd><DualAmount amount={rate} currency={currency} rates={rateMap} /></dd></div>
        {discountPct > 0 ? (
          <div><dt>İndirim</dt><dd>%{discountPct}</dd></div>
        ) : null}
        <div className="roomio-price-summary__divider" />
        <div><dt>Ara toplam</dt><dd><DualAmount amount={subtotal} currency={currency} rates={rateMap} /></dd></div>
        {taxes.lines.map((line) => (
          <div key={line.code}>
            <dt>{line.name} (%{line.rate})</dt>
            <dd><DualAmount amount={line.amount} currency={currency} rates={rateMap} /></dd>
          </div>
        ))}
        <div className="roomio-price-summary__total">
          <dt>Toplam</dt>
          <dd><DualAmount amount={taxes.total} currency={currency} rates={rateMap} /></dd>
        </div>
        {currency !== 'TRY' ? (
          <div className="roomio-price-summary__try-total">
            <dt>TL toplam (giriş günü TCMB alış)</dt>
            <dd>{formatMoney(foreignToTry(taxes.total, currency, rateMap), 'TRY')}</dd>
          </div>
        ) : null}
        <div className="roomio-price-summary__fx-rate">
          <dt>Döviz kuru (giriş: {rateDate})</dt>
          <dd>
            1 {currency} = {exchangeRate.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} TRY
          </dd>
        </div>
      </dl>
      {!singleScreen ? (
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          <a href="/settings?section=currencies">Kurlar</a>
          {' · '}
          <a href="/settings?section=tax-rules">Vergiler</a>
          {' · '}
          <a href="/reports?tab=forms">Form tasarımı</a>
        </p>
      ) : null}
    </aside>
  );

  if (singleScreen && isEdit) {
    return (
      <div className="roomio-rez-edit-screen">
        {saved ? (
          <div className="roomio-card roomio-alert roomio-alert--success" role="status">
            {`${refPreview} güncellendi — detay sayfasına yönlendiriliyorsunuz…`}
          </div>
        ) : null}
        {saved && egmWarning ? (
          <p className="roomio-card roomio-text-warn" role="status" style={{ marginBottom: 8, padding: '8px 12px' }}>
            Rezervasyon güncellendi; EGM kimlik kaydı tamamlanamadı: {egmWarning}
          </p>
        ) : null}

        {!fxReady ? (
          <p className="roomio-rez-edit-screen__fx-hint" role="status">
            TCMB kurları yüklenemedi — TRY dışı dövizlerde TL karşılığı gecikebilir.
          </p>
        ) : null}

        <div className="roomio-reservation-new roomio-rez-edit-screen__layout">
          <div className="roomio-reservation-new__main">
            <div className="roomio-rez-edit-screen__steps" aria-label="Rezervasyon düzenleme — tüm adımlar">
              {steps.map((step, index) => (
                <section
                  key={step.id}
                  className={`roomio-card roomio-rez-edit-screen__step${step.id === 'egm' ? ' roomio-rez-edit-screen__step--wide' : ''}`}
                  aria-labelledby={`rez-edit-step-${step.id}`}
                >
                  <h3 id={`rez-edit-step-${step.id}`} className="roomio-rez-edit-screen__step-title">
                    <span>{index + 1}</span>
                    {step.title}
                    {step.id === 'egm' ? <EgmStatusBadge status={egmStatus} compact /> : null}
                  </h3>
                  {renderStepContent(step.id, true)}
                </section>
              ))}
            </div>

            {submitError ? (
              <p className="roomio-text-warn roomio-rez-edit-screen__error" role="alert">{submitError}</p>
            ) : null}

            <div className="roomio-form-actions roomio-reservation-new__actions roomio-rez-edit-screen__actions">
              <Button variant="secondary" href={`/reservations/${existing?.id}`}>İptal</Button>
              <button type="button" className="roomio-btn roomio-btn--primary" onClick={() => void onSubmit()}>
                Güncelle
              </button>
            </div>
          </div>
          {priceSummary}
        </div>
      </div>
    );
  }

  if (singleScreen && !isEdit) {
    const roomChips = roomTypeOptions.length ? roomTypeOptions.map((o) => o.code) : ['DBL', 'TWN', 'SUI', 'SGL'];
    const roomChipLabels = Object.fromEntries(
      roomTypeOptions.map((o) => [o.code, o.label.split(' — ')[0] ?? o.code]),
    );
    const mealChips = ['RO', 'BB', 'HB', 'FB', 'AI'];
    const paymentChips = ['Kredi Kartı', 'Nakit', 'Havale'];
    const ratePlanChips = ['BAR-2026', 'CORP-2026', 'OTA promo'];
    const stayFields = fieldsForStep('stay');
    const pricingFields = fieldsForStep('pricing');
    const guestFields = fieldsForStep('guest');
    const egmFields = fieldsForStep('egm');
    const extraFields = fieldsForStep('extra');
    const pricingAdvFields = pricingFields.filter((f) => !PRICING_PRIMARY_KEYS.has(f.key) && f.key !== 'paymentType');
    const pickStay = (key: string) => stayFields.find((f) => f.key === key);

    return (
      <div className={`roomio-rez-quick roomio-rez-new-wizard roomio-rez-new-screen${embedded ? ' roomio-rez-new-wizard--embedded' : ''}`}>
        <div className="roomio-rez-quick__head">
          <div>
            <h1>
              Yeni rezervasyon
              <span className="roomio-rez-quick__mode"><Zap size={11} aria-hidden /> Hızlı kayıt</span>
            </h1>
            <p>Misafiri arayın, bilgiler otomatik dolsun — geri kalanı tek tıkla seçin.</p>
          </div>
          <div className="roomio-rez-quick__head-actions">
            {embedded ? (
              <Button variant="secondary" onClick={onCancel}>İptal</Button>
            ) : (
              <Button variant="secondary" href="/reservations">İptal</Button>
            )}
            <Button variant="secondary" type="button" onClick={saveDraft}>Taslak kaydet</Button>
            <button type="button" className="roomio-btn roomio-btn--primary" onClick={() => void onSubmit()}>
              <Check size={14} aria-hidden style={{ marginRight: 6 }} />
              Kaydet <span className="roomio-rez-quick__kbd">⌘S</span>
            </button>
          </div>
        </div>

        <QuickToast message={toast ?? (saved ? `${refPreview} kaydedildi` : null)} kind={toastKind} />
        {saved && egmWarning ? (
          <p className="roomio-card roomio-text-warn" role="status" style={{ padding: '8px 12px' }}>
            Rezervasyon kaydedildi; EGM kimlik kaydı tamamlanamadı: {egmWarning}
          </p>
        ) : null}
        {!fxReady ? (
          <p className="roomio-rez-edit-screen__fx-hint" role="status">
            TCMB kurları yüklenemedi — TRY dışı dövizlerde TL karşılığı gecikebilir.
          </p>
        ) : null}

        <div className="roomio-rez-quick__progress roomio-card" role="status">
          <div className="roomio-rez-quick__progress-top">
            <span>Zorunlu alanlar <b>{requiredDone}/{requiredTotal}</b> tamamlandı</span>
            <span className="roomio-rez-quick__progress-pct">%{progressPct}</span>
          </div>
          <div className="roomio-rez-quick__progress-track">
            <div className="roomio-rez-quick__progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <QuickJumpNav />

        <div className="roomio-rez-quick__layout">
          <div className="roomio-rez-quick__formcol">
            <QuickGuestFinder
              onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
              onScan={() => void runIdScan()}
              onScanImage={(file) => void scanFromImage(file)}
              scanning={scanning}
              scanMessage={scanMessage}
              scanFileInputRef={scanFileInputRef}
            />

            <div className="roomio-rez-quick__card">
              <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2">
                {fieldsForStep('sender').map((f) => renderField(f))}
              </div>
            </div>

            <section className="roomio-rez-quick__card" id="rez-sec-misafir">
              <QuickSectionHead
                icon={<IdCard size={15} />}
                title="Misafir & KBS kimlik"
                description="Zorunlu alanlar polis bildirimi (KBS) için gereklidir"
              />
              <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2">
                {egmFields.map((f) => renderField(f))}
                {guestFields.filter((f) => !['nationality', 'idNo', 'vipLevel'].includes(f.key)).map((f) => renderField(f))}
                {guestFields.filter((f) => ['nationality', 'idNo', 'vipLevel'].includes(f.key)).map((f) => renderField(f))}
              </div>
            </section>

            <section className="roomio-rez-quick__card" id="rez-sec-konaklama">
              <QuickSectionHead
                icon={<Bed size={15} />}
                title="Konaklama"
                description={`${String(values.roomType ?? 'DBL')} — ${nights > 0 ? `${nights} gece` : 'tarih seçin'}`}
              />
              <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2" style={{ marginBottom: 12 }}>
                <div>
                  {pickStay('checkIn') ? renderField(pickStay('checkIn')!) : null}
                  <div className="roomio-rez-quick__chips" style={{ marginTop: 7 }}>
                    <button type="button" className="roomio-rez-quick__chip" onClick={() => quickCheckin(0)}>Bugün</button>
                    <button type="button" className="roomio-rez-quick__chip" onClick={() => quickCheckin(1)}>Yarın</button>
                  </div>
                </div>
                <div>
                  {pickStay('checkOut') ? renderField(pickStay('checkOut')!) : null}
                  <div className="roomio-rez-quick__chips" style={{ marginTop: 7 }}>
                    {[1, 2, 3, 7].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`roomio-rez-quick__chip${nights === n ? ' is-selected' : ''}`}
                        onClick={() => applyNightCount(n)}
                      >
                        {n} gece
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2" style={{ marginBottom: 12 }}>
                {pickStay('arrivalTime') ? renderField(pickStay('arrivalTime')!) : null}
                {pickStay('departureTime') ? renderField(pickStay('departureTime')!) : null}
              </div>
              <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2" style={{ marginBottom: 12 }}>
                <div>
                  <span className="roomio-field"><span>Oda tipi</span></span>
                  <QuickChipGroup
                    options={roomChips}
                    value={String(values.roomType ?? 'DBL')}
                    labels={roomChipLabels}
                    onChange={(v) => setValue('roomType', v)}
                  />
                </div>
                <div>
                  <span className="roomio-field"><span>Pansiyon</span></span>
                  <QuickChipGroup
                    options={mealChips}
                    value={String(values.mealPlan ?? 'BB')}
                    onChange={(v) => setValue('mealPlan', v)}
                  />
                </div>
              </div>
              <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2">
                <div className="roomio-rez-quick__field-row">
                  <span className="roomio-field" style={{ margin: 0 }}><span>Oda sayısı</span></span>
                  <QuickStepper value={roomCount} min={1} max={9} onChange={(v) => setValue('roomCount', v)} />
                </div>
                <div className="roomio-rez-quick__field-row">
                  <span className="roomio-field" style={{ margin: 0 }}><span>Yetişkin</span></span>
                  <QuickStepper value={Number(values.adults ?? 2)} min={1} max={10} onChange={(v) => setValue('adults', v)} />
                </div>
                <div className="roomio-rez-quick__field-row">
                  <span className="roomio-field" style={{ margin: 0 }}><span>Çocuk</span></span>
                  <QuickStepper value={Number(values.children ?? 0)} min={0} max={10} onChange={(v) => setValue('children', v)} />
                </div>
                <div className="roomio-rez-quick__field-row">
                  <span className="roomio-field" style={{ margin: 0 }}><span>Bebek</span></span>
                  <QuickStepper value={Number(values.infants ?? 0)} min={0} max={10} onChange={(v) => setValue('infants', v)} />
                </div>
              </div>
              <div style={{ marginTop: 12, maxWidth: 220 }}>
                <label className="roomio-field" htmlFor="rf-fixRoomNo">
                  <span>Oda no <span className="roomio-rez-quick__opt">opsiyonel</span></span>
                  <input
                    id="rf-fixRoomNo"
                    className="roomio-input"
                    value={String(values.fixRoomNo ?? '')}
                    placeholder="Örn. 312"
                    onChange={(e) => setValue('fixRoomNo', e.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="roomio-rez-quick__card" id="rez-sec-fiyat">
              <QuickSectionHead
                icon={<Banknote size={15} />}
                title="Fiyatlandırma"
                description="Tutar girilince özet otomatik güncellenir"
              />
              <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2" style={{ marginBottom: 12 }}>
                <div>
                  <label className="roomio-field" htmlFor="rez-quick-rate">
                    <span>Gece fiyatı ({currency})</span>
                    <div className="roomio-rez-quick__price-row">
                      <input
                        id="rez-quick-rate"
                        className="roomio-input"
                        type="number"
                        min={0}
                        step={currency === 'JPY' ? 1 : currency === 'TRY' ? 100 : 0.01}
                        value={rate}
                        onChange={(e) => setValue('rate', Number(e.target.value))}
                      />
                    </div>
                  </label>
                  <span className="roomio-field" style={{ display: 'block', marginTop: 8 }}>
                    <span>Para birimi</span>
                  </span>
                  <QuickCurrencyPicker
                    value={currency}
                    options={currencyOptions}
                    onChange={(v) => onCurrencyChange(v as PaymentCurrency)}
                  />
                </div>
                <div>
                  <span className="roomio-field"><span>Ödeme tipi</span></span>
                  <QuickChipGroup
                    options={paymentChips}
                    value={String(values.paymentType ?? 'Kredi Kartı')}
                    onChange={(v) => setValue('paymentType', v)}
                  />
                </div>
              </div>
              <div className="roomio-rez-quick__fx" aria-label="Döviz kuru">
                <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2">
                  <label className="roomio-field">
                    <span>Kur günü (giriş)</span>
                    <input className="roomio-input" type="text" readOnly value={rateDate} />
                  </label>
                  <label className="roomio-field">
                    <span>TCMB alış kuru</span>
                    <input
                      className="roomio-input"
                      type="text"
                      readOnly
                      value={
                        currency === 'TRY'
                          ? '1,0000'
                          : exchangeRate > 0
                            ? `1 ${currency} = ${exchangeRate.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} TRY`
                            : '—'
                      }
                    />
                  </label>
                </div>
                {currency !== 'TRY' && exchangeRate > 0 ? (
                  <p className="roomio-rez-quick__fx-hint">
                    Gece fiyatı TL karşılığı:{' '}
                    <strong>{formatMoney(foreignToTry(rate, currency, rateMap), 'TRY')}</strong>
                    <span className="roomio-text-muted"> · giriş günü TCMB alış</span>
                  </p>
                ) : null}
                {currency !== 'TRY' && !fxReady ? (
                  <p className="roomio-field-hint">TCMB kuru yüklenince TL karşılığı ve folyo tutarı hesaplanır.</p>
                ) : null}
              </div>
              <div>
                <span className="roomio-field"><span>Rate plan</span></span>
                <QuickChipGroup
                  options={ratePlanChips}
                  value={String(values.ratePlanCode || values.rateCode || 'BAR-2026')}
                  onChange={(v) => setValues((prev) => ({ ...prev, ratePlanCode: v, rateCode: v }))}
                />
              </div>
              <details className="roomio-rez-quick__details" style={{ marginTop: 14 }}>
                <summary>
                  <FileText size={15} aria-hidden />
                  Gelişmiş fiyatlandırma <span className="roomio-rez-quick__opt">opsiyonel</span>
                  <ChevronDown size={14} className="roomio-rez-quick__details-chev" aria-hidden />
                </summary>
                <div className="roomio-rez-quick__details-body">
                  <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2">
                    {pricingAdvFields.map((f) => renderField(f))}
                  </div>
                </div>
              </details>
            </section>

            <details className="roomio-rez-quick__details" id="rez-sec-ek">
              <summary>
                <FileText size={15} aria-hidden />
                Ek bilgiler <span className="roomio-rez-quick__opt">opsiyonel</span>
                <ChevronDown size={14} className="roomio-rez-quick__details-chev" aria-hidden />
              </summary>
              <div className="roomio-rez-quick__details-body">
                <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2" style={{ marginBottom: 12 }}>
                  {extraFields.filter((f) => f.key !== 'notes' && !f.key.endsWith('Note')).map((f) => renderField(f))}
                </div>
                <div className="roomio-rez-quick__grid roomio-rez-quick__grid--2">
                  {extraFields.filter((f) => f.key.endsWith('Note') || f.key === 'notes').map((f) => renderField(f, { textareaRows: 2 }))}
                </div>
              </div>
            </details>

            {submitError ? (
              <p className="roomio-text-warn" role="alert">{submitError}</p>
            ) : null}
          </div>

          <aside className="roomio-rez-quick__sumcol">
            {priceSummary}
            <QuickKbsChecklist values={values} />
          </aside>
        </div>

        <div className="roomio-rez-quick__actionbar">
          {embedded ? (
            <Button variant="secondary" onClick={onCancel}>İptal</Button>
          ) : (
            <Button variant="secondary" href="/reservations">İptal</Button>
          )}
          <Button variant="secondary" type="button" onClick={saveDraft}>Taslak kaydet</Button>
          <button type="button" className="roomio-btn roomio-btn--primary" onClick={() => void onSubmit()}>
            <Check size={14} aria-hidden style={{ marginRight: 6 }} />
            Kaydet <span className="roomio-rez-quick__kbd">⌘S</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`roomio-rez-new-wizard${embedded ? ' roomio-rez-new-wizard--embedded' : ''}`}>
      {saved ? (
        <div className="roomio-card roomio-alert roomio-alert--success" role="status">
          {isEdit
            ? `${refPreview} güncellendi — detay sayfasına yönlendiriliyorsunuz…`
            : `${refPreview} kaydedildi — listeye yönlendiriliyorsunuz…`}
        </div>
      ) : null}
      {saved && egmWarning ? (
        <p className="roomio-card roomio-text-warn roomio-rez-new-wizard__warn" role="status">
          Rezervasyon kaydedildi; EGM kimlik kaydı tamamlanamadı: {egmWarning}
        </p>
      ) : null}

      {!embedded ? (
        <div className="roomio-card roomio-elektra-compare roomio-rez-new-wizard__compare">
          <p className="roomio-page-desc">
            <strong>Elektra screen-038</strong> karşılaştırması: {coverage.covered}/{coverage.total} alan varsayılanda.
            {coverage.missing.length ? ` Eksik: ${coverage.missing.slice(0, 3).join(', ')}${coverage.missing.length > 3 ? '…' : ''}` : ' Tamam.'}
            {' · '}
            <Link href="/tools/rollout?phase=rezervasyon">Rollout</Link>
          </p>
        </div>
      ) : null}

      {!fxReady && activeStep?.id !== 'pricing' ? (
        <div className="roomio-card roomio-alert roomio-alert--warn roomio-rez-new-wizard__fx-hint">
          <p className="roomio-page-desc">
            TCMB kurları yüklenemedi — fiyatlandırma adımında kur yenilenir.
          </p>
        </div>
      ) : null}

      <nav className="roomio-wizard-steps roomio-rez-new-wizard__steps" aria-label="Rezervasyon adımları">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`roomio-wizard-steps__item${i === stepIndex ? ' is-active' : ''}${i < stepIndex ? ' is-done' : ''}`}
            onClick={() => setStepIndex(i)}
          >
            <span>{i + 1}</span>
            <strong>{s.title}</strong>
          </button>
        ))}
      </nav>

      <div className="roomio-reservation-new roomio-rez-new-wizard__layout">
        <div className="roomio-reservation-new__main">
          <section className="roomio-card roomio-rez-new-wizard__step">
            <h2 className="roomio-card-title">{activeStep?.title}</h2>
            {activeStep?.description ? <p className="roomio-page-desc roomio-rez-new-wizard__step-desc">{activeStep.description}</p> : null}
            <div className="roomio-rez-new-wizard__step-body">
              {activeStep ? renderStepContent(activeStep.id, false, true) : null}
            </div>
          </section>

          {submitError ? (
            <p className="roomio-text-warn roomio-rez-new-wizard__error" role="alert">{submitError}</p>
          ) : null}
        </div>

        {priceSummary}
      </div>

      <div className="roomio-form-actions roomio-reservation-new__actions roomio-rez-new-wizard__actions">
        {stepIndex > 0 ? (
          <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)}>← Geri</Button>
        ) : embedded ? (
          <Button variant="secondary" onClick={onCancel}>İptal</Button>
        ) : (
          <Button variant="secondary" href="/reservations">İptal</Button>
        )}
        {stepIndex < steps.length - 1 ? (
          <Button onClick={() => setStepIndex((i) => i + 1)}>İleri →</Button>
        ) : (
          <button type="button" className="roomio-btn roomio-btn--primary" onClick={() => void onSubmit()}>
            {isEdit ? 'Güncelle' : 'Kaydet'}
          </button>
        )}
      </div>
    </div>
  );
}
