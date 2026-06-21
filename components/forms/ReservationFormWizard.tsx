'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { EgmIdentityFormPanel } from '@/components/egm/EgmIdentityFormPanel';
import { EgmStatusBadge } from '@/components/egm/EgmStatusBadge';
import { ReservationPricingPanel } from '@/components/forms/ReservationPricingPanel';
import { nextRefNo } from '@/lib/data/reservations';
import { addReservation } from '@/lib/data/reservations-store';
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
  discountPct: 0,
  market: 'BAR',
  segment: 'LEIS',
  source: 'DIR',
  paymentType: 'Kredi Kartı',
  payerType: 'Misafir',
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

export function ReservationFormWizard() {
  const router = useRouter();
  const [layout, setLayout] = useState<FormLayout | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<FormValues>(DEFAULTS);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [fx, setFx] = useState<ExchangeRateSnapshot | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const refPreview = useMemo(() => nextRefNo(), []);

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
      const [tplRes, taxRes] = await Promise.all([
        roomioFetch('/api/reports/templates?pageId=reservations-new'),
        roomioFetch('/api/tax/rules'),
      ]);
      const tplJ = (await tplRes.json()) as { template?: { layout?: FormLayout } };
      const taxJ = (await taxRes.json()) as { rules?: TaxRule[] };
      setLayout(mergeFormLayoutWithDefaults('reservations-new', tplJ.template?.layout) ?? defaultFormLayout('reservations-new'));
      if (taxJ.rules) setTaxRules(taxJ.rules);
    })();
  }, []);

  useEffect(() => {
    void loadFx(rateDate);
  }, [rateDate, loadFx]);

  const currencyOptions = useMemo(() => {
    const fromFx = fx?.rates.map((r) => r.code) ?? [];
    return [...PAYMENT_CURRENCIES, ...fromFx].filter((c, i, a) => a.indexOf(c) === i);
  }, [fx]);

  const steps = layout?.steps ?? page.steps;
  const activeStep = steps[stepIndex];
  const stepFields = layout?.fields.filter((f) => f.stepId === activeStep?.id) ?? [];

  useEffect(() => {
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

  function renderField(cfg: FormFieldConfig) {
    if (!shouldShowField(cfg.key)) return null;
    const def = fieldDef(cfg.key, cfg);
    const label = cfg.label ?? formFieldLabel('reservations-new', cfg.key, def.label);
    const val = values[cfg.key] ?? def.defaultValue ?? '';
    const full = cfg.width === 'full';

    if (cfg.key === 'currency' || def.type === 'currency' || cfg.type === 'currency') {
      return (
        <label key={cfg.key} className={`roomio-field${full ? ' roomio-field--full' : ''}`}>
          <span>{label}{cfg.required ? ' *' : ''}</span>
          <select
            className="roomio-select"
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
      return (
        <label key={cfg.key} className={`roomio-field${full ? ' roomio-field--full' : ''}`}>
          <span>{label}{cfg.required ? ' *' : ''}</span>
          <select className="roomio-select" value={String(val)} required={cfg.required} onChange={(e) => setValue(cfg.key, e.target.value)}>
            {(def.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      );
    }

    if (def.type === 'textarea') {
      return (
        <label key={cfg.key} className="roomio-field roomio-field--full">
          <span>{label}</span>
          <textarea className="roomio-input" rows={3} value={String(val)} onChange={(e) => setValue(cfg.key, e.target.value)} />
        </label>
      );
    }

    return (
      <label key={cfg.key} className={`roomio-field${full ? ' roomio-field--full' : ''}`}>
        <span>{label}{cfg.required ? ' *' : ''}</span>
        <input
          className="roomio-input"
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
    const submissionValues: FormValues = {
      ...values,
      rateDate,
      exchangeRate,
    };
    const coreKeys = new Set([
      'guestName', 'checkIn', 'checkOut', 'roomType', 'mealPlan', 'rate', 'currency',
      'agency', 'market', 'adults', 'children', 'email', 'phone', 'notes',
    ]);
    const extraData: Record<string, string> = {};
    for (const [k, v] of Object.entries(submissionValues)) {
      if (!coreKeys.has(k)) extraData[k] = String(v);
    }

    const reservation: Reservation = {
      id: `new-${Date.now()}`,
      refNo: refPreview,
      guestName: String(values.guestName ?? ''),
      email: values.email ? String(values.email) : undefined,
      phone: values.phone ? String(values.phone) : undefined,
      checkIn: String(values.checkIn ?? ''),
      checkOut: String(values.checkOut ?? ''),
      roomType: String(values.roomType ?? 'DBL'),
      adults: Number(values.adults ?? 2),
      children: Number(values.children ?? 0),
      mealPlan: String(values.mealPlan ?? 'BB'),
      rate,
      currency: currency as PaymentCurrency,
      agency: senderType === 'Acenta' ? String(values.agency ?? 'Direct') : senderType,
      market: String(values.market ?? 'BAR'),
      status: mapStatus(),
      createdAt: new Date().toISOString().slice(0, 10),
      notes: values.notes ? String(values.notes) : undefined,
      extraData: Object.keys(extraData).length ? extraData : undefined,
    };

    addReservation(reservation);
    await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    });

    const { firstName: fn, lastName: ln } = splitGuestName(String(values.guestName ?? ''));
    await roomioFetch('/api/egm/identity', {
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

    setSaved(true);
    setTimeout(() => router.push('/reservations'), 800);
  }

  if (!layout) {
    return <p className="roomio-page-desc">Form yükleniyor…</p>;
  }

  return (
    <>
      {saved ? (
        <div className="roomio-card roomio-alert roomio-alert--success">Rezervasyon kaydedildi…</div>
      ) : null}

      <div className="roomio-card roomio-elektra-compare" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <p className="roomio-page-desc" style={{ margin: 0 }}>
          <strong>Elektra screen-038</strong> karşılaştırması: {coverage.covered}/{coverage.total} alan varsayılanda.
          {coverage.missing.length ? ` Eksik (form tasarımdan eklenebilir): ${coverage.missing.slice(0, 4).join(', ')}${coverage.missing.length > 4 ? '…' : ''}` : ' Tamam.'}
          {' · '}
          <Link href="/tools/rollout?phase=rezervasyon">Rollout</Link>
        </p>
      </div>

      {!fxReady && activeStep?.id !== 'pricing' ? (
        <div className="roomio-card roomio-alert roomio-alert--warn" style={{ marginBottom: 16 }}>
          <p className="roomio-page-desc" style={{ margin: 0 }}>
            TCMB kurları şu an yüklenemedi — misafir ve EGM adımlarına devam edebilirsiniz; fiyatlandırma adımında kur otomatik yenilenir.
          </p>
        </div>
      ) : null}

      <nav className="roomio-wizard-steps" aria-label="Rezervasyon adımları">
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

      <div className="roomio-reservation-new">
        <div className="roomio-reservation-new__main">
          <section className="roomio-card">
            <h2 className="roomio-card-title">{activeStep?.title}</h2>
            {activeStep?.description ? <p className="roomio-page-desc">{activeStep.description}</p> : null}
            {activeStep?.id === 'egm' ? (
              <EgmIdentityFormPanel
                values={values}
                refNo={refPreview}
                onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
              />
            ) : activeStep?.id === 'pricing' ? (
              <>
                <ReservationPricingPanel
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
                <div className="roomio-form-grid roomio-form-grid--2" style={{ marginTop: 16 }}>
                  {stepFields.filter((f) => !PRICING_PRIMARY_KEYS.has(f.key)).map(renderField)}
                </div>
              </>
            ) : (
              <div className="roomio-form-grid roomio-form-grid--2">
                {stepFields.map(renderField)}
              </div>
            )}
          </section>

          <div className="roomio-form-actions roomio-reservation-new__actions">
            {stepIndex > 0 ? (
              <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)}>← Geri</Button>
            ) : (
              <Button variant="secondary" href="/reservations">İptal</Button>
            )}
            {stepIndex < steps.length - 1 ? (
              <Button onClick={() => setStepIndex((i) => i + 1)}>İleri →</Button>
            ) : (
              <button type="button" className="roomio-btn roomio-btn--primary" onClick={() => void onSubmit()}>Kaydet</button>
            )}
          </div>
        </div>

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
          <p className="roomio-page-desc" style={{ marginTop: 8 }}>
            <a href="/settings?section=currencies">Kurlar</a>
            {' · '}
            <a href="/settings?section=tax-rules">Vergiler</a>
            {' · '}
            <a href="/reports?tab=forms">Form tasarımı</a>
          </p>
        </aside>
      </div>
    </>
  );
}
