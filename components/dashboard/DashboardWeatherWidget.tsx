'use client';

import { useCallback, useEffect, useState } from 'react';
import { CloudSun } from 'lucide-react';
import { roomioFetch } from '@/lib/client/api';
import { WEATHER_FORECAST, WEATHER_TODAY } from '@/lib/data/guest-relations';
import type { WeatherForecastDay, WeatherToday } from '@/lib/server/weather';

const FALLBACK_TODAY: WeatherToday = { ...WEATHER_TODAY, source: 'seed' };

/** Ana sayfa yan panel — hava durumu + kısa tahmin */
export function DashboardWeatherWidget() {
  const [today, setToday] = useState<WeatherToday>(FALLBACK_TODAY);
  const [forecast, setForecast] = useState<WeatherForecastDay[]>(WEATHER_FORECAST);

  const load = useCallback(async () => {
    try {
      const res = await roomioFetch('/api/weather');
      if (!res.ok) throw new Error(`weather ${res.status}`);
      const j = (await res.json()) as { today?: WeatherToday; forecast?: WeatherForecastDay[] };
      setToday(j.today ?? FALLBACK_TODAY);
      setForecast(j.forecast ?? WEATHER_FORECAST);
    } catch {
      setToday(FALLBACK_TODAY);
      setForecast(WEATHER_FORECAST);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="roomio-movements__block roomio-dashboard-weather" aria-label="Hava durumu">
      <div className="roomio-dashboard-weather__head">
        <CloudSun size={18} aria-hidden className="roomio-dashboard-weather__icon" />
        <div>
          <h2>Hava Durumu</h2>
          <p className="roomio-dashboard-weather__city">{today.city}</p>
        </div>
        <strong className="roomio-dashboard-weather__temp">{today.temp}</strong>
      </div>
      <p className="roomio-dashboard-weather__cond">{today.condition}</p>
      <p className="roomio-dashboard-weather__meta">
        Nem {today.humidity} · Rüzgar {today.wind}
      </p>
      {forecast.length > 0 ? (
        <div className="roomio-dashboard-weather__forecast" aria-label="4 günlük tahmin">
          {forecast.slice(0, 4).map((day) => (
            <div key={day.day} className="roomio-dashboard-weather__day">
              <span>{day.day}</span>
              <strong>{day.high}°</strong>
              <small>{day.low}°</small>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
