'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import type { WeatherForecastDay, WeatherToday } from '@/lib/server/weather';

type Props = {
  mode: 'today' | 'forecast';
};

export function WeatherPanel({ mode }: Props) {
  const [today, setToday] = useState<WeatherToday | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastDay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/weather');
      const j = (await res.json()) as { today?: WeatherToday; forecast?: WeatherForecastDay[] };
      setToday(j.today ?? null);
      setForecast(j.forecast ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className="roomio-card"><p>Yükleniyor…</p></div>;
  }

  if (mode === 'today' && today) {
    return (
      <div className="roomio-card">
        {today.source === 'live' ? (
          <p className="roomio-page-desc" style={{ marginBottom: 8 }}>Open-Meteo canlı veri</p>
        ) : (
          <p className="roomio-page-desc" style={{ marginBottom: 8 }}>Demo yedek veri</p>
        )}
        <dl className="roomio-dl">
          <dt>Şehir</dt><dd>{today.city}</dd>
          <dt>Tarih</dt><dd>{today.date}</dd>
          <dt>Sıcaklık</dt><dd>{today.temp}</dd>
          <dt>Durum</dt><dd>{today.condition}</dd>
          <dt>Nem</dt><dd>{today.humidity}</dd>
          <dt>Rüzgar</dt><dd>{today.wind}</dd>
        </dl>
      </div>
    );
  }

  return (
    <div className="roomio-card">
      <div className="roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Gün</th>
              <th>Max</th>
              <th>Min</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((r) => (
              <tr key={r.day}>
                <td>{r.day}</td>
                <td>{r.high}°C</td>
                <td>{r.low}°C</td>
                <td>{r.condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
