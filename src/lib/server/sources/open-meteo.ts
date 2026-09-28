import 'server-only';
import { cached, fetchJson } from '@/lib/server/cache';
import { icaFromPm25 } from '@/lib/air-quality';
import type { WeatherSnapshot } from '@/types';

/** Medellín city centre (La Alpujarra). */
export const MEDELLIN_CENTER = { latitude: 6.2442, longitude: -75.5812 };

const WEATHER_TTL = 15 * 60 * 1000;
const AIR_TTL = 30 * 60 * 1000;

/** WMO weather interpretation codes, in Spanish. */
const WEATHER_CODES: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna',
  55: 'Llovizna intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia',
  65: 'Lluvia fuerte',
  80: 'Chubascos ligeros',
  81: 'Chubascos',
  82: 'Chubascos fuertes',
  95: 'Tormenta eléctrica',
  96: 'Tormenta con granizo',
  99: 'Tormenta fuerte con granizo',
};

export function describeWeather(code: number): string {
  return WEATHER_CODES[code] ?? 'Variable';
}

interface ForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    uv_index: number;
    is_day: number;
  };
  hourly: { time: string[]; uv_index: number[] };
  daily: {
    uv_index_max: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

export function getWeather(): Promise<WeatherSnapshot> {
  return cached('open-meteo:weather', WEATHER_TTL, async () => {
    const params = new URLSearchParams({
      latitude: String(MEDELLIN_CENTER.latitude),
      longitude: String(MEDELLIN_CENTER.longitude),
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,uv_index,is_day',
      hourly: 'uv_index',
      daily: 'uv_index_max,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      forecast_days: '1',
      timezone: 'America/Bogota',
    });
    const data = await fetchJson<ForecastResponse>(`https://api.open-meteo.com/v1/forecast?${params}`);
    const c = data.current;
    return {
      temperature: Math.round(c.temperature_2m),
      apparentTemperature: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      weatherCode: c.weather_code,
      description: describeWeather(c.weather_code),
      isDay: c.is_day === 1,
      uvIndex: Math.round(c.uv_index * 10) / 10,
      uvMax: Math.round(data.daily.uv_index_max[0] ?? 0),
      tempMax: Math.round(data.daily.temperature_2m_max[0] ?? c.temperature_2m),
      tempMin: Math.round(data.daily.temperature_2m_min[0] ?? c.temperature_2m),
      rainProbability: data.daily.precipitation_probability_max[0] ?? 0,
      hourlyUv: data.hourly.time.map((time, i) => ({ time, uv: data.hourly.uv_index[i] ?? 0 })),
      updatedAt: `${c.time}:00-05:00`,
    };
  });
}

interface AirResponse {
  current: {
    time: string;
    pm2_5: number | null;
    pm10: number | null;
    ozone: number | null;
    nitrogen_dioxide: number | null;
  };
  hourly: { time: string[]; pm2_5: Array<number | null> };
}

export interface ModelledAir {
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
  updatedAt: string;
  forecast: Array<{ time: string; pm25: number; ica: number }>;
}

/** CAMS-modelled air quality from Open-Meteo. Used for pollutants SIATA does not expose and as a fallback. */
export function getModelledAir(): Promise<ModelledAir> {
  return cached('open-meteo:air', AIR_TTL, async () => {
    const params = new URLSearchParams({
      latitude: String(MEDELLIN_CENTER.latitude),
      longitude: String(MEDELLIN_CENTER.longitude),
      current: 'pm2_5,pm10,ozone,nitrogen_dioxide',
      hourly: 'pm2_5',
      forecast_days: '2',
      timezone: 'America/Bogota',
    });
    const data = await fetchJson<AirResponse>(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
    const nowIndex = Math.max(0, data.hourly.time.findIndex((t) => t >= data.current.time.slice(0, 13)));
    const forecast = data.hourly.time
      .slice(nowIndex, nowIndex + 24)
      .map((time, i) => ({ time, value: data.hourly.pm2_5[nowIndex + i] }))
      .filter((p): p is { time: string; value: number } => typeof p.value === 'number')
      .map(({ time, value }) => ({ time, pm25: Math.round(value * 10) / 10, ica: icaFromPm25(value) }));

    return {
      pm25: data.current.pm2_5,
      pm10: data.current.pm10,
      ozone: data.current.ozone,
      no2: data.current.nitrogen_dioxide,
      updatedAt: `${data.current.time}:00-05:00`,
      forecast,
    };
  });
}
