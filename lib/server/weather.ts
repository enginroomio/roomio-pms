import { WEATHER_FORECAST, WEATHER_TODAY } from '@/lib/data/guest-relations';
import { getBusinessDate, getProperty, init } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export type WeatherToday = {
  date: string;
  city: string;
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
  source: 'live' | 'seed';
};

export type WeatherForecastDay = {
  day: string;
  high: number;
  low: number;
  condition: string;
};

const WMO_TR: Record<number, string> = {
  0: 'Açık',
  1: 'Az bulutlu',
  2: 'Parçalı bulutlu',
  3: 'Kapalı',
  45: 'Sis',
  48: 'Sis',
  51: 'Çisenti',
  61: 'Yağmurlu',
  63: 'Yağmurlu',
  65: 'Şiddetli yağmur',
  71: 'Karlı',
  80: 'Sağanak',
  95: 'Fırtına',
};

function wmoLabel(code: number): string {
  return WMO_TR[code] ?? WMO_TR[Math.floor(code / 10) * 10] ?? 'Parçalı bulutlu';
}

type CacheEntry = { at: number; today: WeatherToday; forecast: WeatherForecastDay[] };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 30 * 60_000;

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  istanbul: { lat: 41.0082, lon: 28.9784 },
  antalya: { lat: 36.8969, lon: 30.7133 },
};

function cityKey(city?: string | null): string {
  const c = (city ?? 'istanbul').toLowerCase();
  if (c.includes('antalya') || c.includes('lara')) return 'antalya';
  return 'istanbul';
}

function seedWeather(city: string, businessDate: string): { today: WeatherToday; forecast: WeatherForecastDay[] } {
  return {
    today: {
      ...WEATHER_TODAY,
      date: businessDate,
      city,
      source: 'seed',
    },
    forecast: WEATHER_FORECAST,
  };
}

export async function getWeatherServer(propertyId?: string): Promise<{
  today: WeatherToday;
  forecast: WeatherForecastDay[];
}> {
  await init();
  const prop = propertyId ?? DEFAULT_PROPERTY_ID;
  const property = await getProperty(prop);
  const businessDate = await getBusinessDate(prop);
  const city = property?.city ?? WEATHER_TODAY.city;
  const key = `${prop}:${cityKey(property?.city)}`;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return { today: { ...hit.today, date: businessDate }, forecast: hit.forecast };
  }

  const coords = CITY_COORDS[cityKey(property?.city)] ?? CITY_COORDS.istanbul;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(coords.lat));
  url.searchParams.set('longitude', String(coords.lon));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('timezone', 'Europe/Istanbul');
  url.searchParams.set('forecast_days', '5');

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) throw new Error(`weather ${res.status}`);
    const j = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        wind_speed_10m?: number;
        weather_code?: number;
      };
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        weather_code?: number[];
      };
    };

    const cur = j.current;
    const today: WeatherToday = {
      date: businessDate,
      city,
      temp: `${Math.round(cur?.temperature_2m ?? 24)}°C`,
      condition: wmoLabel(cur?.weather_code ?? 2),
      humidity: `%${Math.round(cur?.relative_humidity_2m ?? 58)}`,
      wind: `${Math.round(cur?.wind_speed_10m ?? 12)} km/s`,
      source: 'live',
    };

    const forecast: WeatherForecastDay[] = (j.daily?.time ?? []).slice(0, 5).map((iso, i) => {
      const parts = iso.split('-');
      const day = parts.length === 3 ? `${parts[2]}.${parts[1]}` : iso;
      return {
        day,
        high: Math.round(j.daily?.temperature_2m_max?.[i] ?? 26),
        low: Math.round(j.daily?.temperature_2m_min?.[i] ?? 18),
        condition: wmoLabel(j.daily?.weather_code?.[i] ?? 2),
      };
    });

    cache.set(key, { at: Date.now(), today, forecast });
    return { today, forecast };
  } catch {
    const fallback = seedWeather(city, businessDate);
    cache.set(key, { at: Date.now(), ...fallback });
    return fallback;
  }
}
