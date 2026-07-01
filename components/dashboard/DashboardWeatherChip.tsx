'use client';

import { useCallback, useEffect, useState } from 'react';
import { CloudSun } from 'lucide-react';
import { roomioFetch } from '@/lib/client/api';
import { WEATHER_TODAY } from '@/lib/data/guest-relations';
import type { WeatherToday } from '@/lib/server/weather';

const FALLBACK_TODAY: WeatherToday = {
  ...WEATHER_TODAY,
  source: 'seed',
};

/** Orijinal operasyon şablonu — kompakt hava durumu şeridi */
export function DashboardWeatherChip() {
  const [today, setToday] = useState<WeatherToday>(FALLBACK_TODAY);

  const load = useCallback(async () => {
    try {
      const res = await roomioFetch('/api/weather');
      if (!res.ok) throw new Error(`weather ${res.status}`);
      const j = (await res.json()) as { today?: WeatherToday };
      setToday(j.today ?? FALLBACK_TODAY);
    } catch {
      setToday(FALLBACK_TODAY);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="roomio-orijinal-weather" aria-label="Hava durumu">
      <CloudSun size={16} aria-hidden className="roomio-orijinal-weather__icon" />
      <span className="roomio-orijinal-weather__city">{today.city}</span>
      <strong className="roomio-orijinal-weather__temp">{today.temp}</strong>
      <span className="roomio-orijinal-weather__cond">{today.condition}</span>
      <span className="roomio-orijinal-weather__meta">
        Nem {today.humidity} · Rüzgar {today.wind}
      </span>
    </div>
  );
}
