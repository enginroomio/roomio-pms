'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import { formatTcmbRate, tcmbPublishedBuy, tcmbUnitLabel } from '@/lib/exchange/tcmb-display';
import { STATUS_BAR_FX_CODES } from '@/lib/exchange/types';
import type { ExchangeRateSnapshot } from '@/lib/exchange/types';

type Props = {
  codes?: readonly string[];
  variant?: 'strip' | 'elektra';
};

type FxPayload = ExchangeRateSnapshot & {
  ok?: boolean;
  origin?: 'live' | 'archive' | 'cache' | 'seed';
  stale?: boolean;
  seeded?: boolean;
  archived?: boolean;
};

/** Elektra screen-000 — alt durum çubuğu TCMB alış kurları */
export function DailyFxStrip({ codes = STATUS_BAR_FX_CODES, variant = 'elektra' }: Props) {
  const [fx, setFx] = useState<FxPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const res = await roomioFetch(refresh ? '/api/exchange-rates?refresh=1' : '/api/exchange-rates');
      const j = (await res.json()) as FxPayload;
      if (j.rates?.length) setFx(j);
      else setFx(null);
    } catch {
      setFx(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    const timer = window.setInterval(() => void load(true), 15 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  const rowByCode = new Map(fx?.rates.map((r) => [r.code, r]) ?? []);

  if (variant === 'elektra') {
    return (
      <div className="roomio-elektra-fx-wrap">
        <div className="roomio-elektra-fx" aria-label="Günlük TCMB kurları">
          {codes.map((code) => {
            const row = rowByCode.get(code);
            const quote = row ? tcmbPublishedBuy(row) : undefined;
            return (
              <div
                key={code}
                className="roomio-elektra-fx__box"
                title={`TCMB alış · ${fx?.date ?? ''}${fx?.origin === 'archive' ? ' · günlük arşiv' : fx?.origin === 'live' ? '' : fx?.origin === 'seed' ? ' · demo' : ''}`}
              >
                <div className="roomio-elektra-fx__head">{code}</div>
                <div className="roomio-elektra-fx__body">
                  <strong>{loading ? '…' : quote ? formatTcmbRate(quote, code) : '—'}</strong>
                  <span className="roomio-elektra-fx__unit">
                    {row ? tcmbUnitLabel(code, row.unit) : `${code} 1`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {fx?.date ? (
          <Link href="/settings?section=currencies" className="roomio-elektra-fx__meta" title="Döviz tanımları">
            TCMB · {fx.date}
            {fx.origin === 'archive' ? ' · arşiv' : fx.origin === 'seed' ? ' · demo' : fx.origin === 'cache' ? ' · önbellek' : ''}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="roomio-daily-fx-strip" aria-label="Günlük döviz kurları">
      {codes.map((code) => {
        const row = rowByCode.get(code);
        const quote = row ? tcmbPublishedBuy(row) : undefined;
        return (
          <div key={code} className="roomio-daily-fx-strip__item">
            <span>{loading ? '…' : quote ? formatTcmbRate(quote, code) : '—'}</span>
            <strong>{row ? tcmbUnitLabel(code, row.unit) : code}</strong>
          </div>
        );
      })}
    </div>
  );
}
