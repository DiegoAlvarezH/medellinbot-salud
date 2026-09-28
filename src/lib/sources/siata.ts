/**
 * SIATA (Sistema de Alerta Temprana del Valle de Aburrá, AMVA) — PM2.5 network.
 * Endpoints used by the official geoportal (geoportal.siata.gov.co). They are undocumented,
 * so callers must cache aggressively and keep a fallback.
 */
import type { AirStation } from '@/types';

export const SIATA_STATIONS_URL = 'https://geoportal.siata.gov.co/fastgeoapi/geodata/geodataJson/1/pm25_minio';
export const siataSeriesUrl = (code: number | string) =>
  `https://geoportal.siata.gov.co/fastgeoapi/geodata/geographJson/1/pm25/${encodeURIComponent(String(code))}`;

interface StationFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    nombreEstacion: string;
    estacion: string;
    Municipio: string;
    codigo: number;
    PM25_24H_prom: number | null;
    ICA_24H_prom: number | null;
    fechaFin: string | null;
  };
}

const MUNICIPALITIES: Record<string, string> = {
  medellin: 'Medellín',
  itagui: 'Itagüí',
  bello: 'Bello',
  envigado: 'Envigado',
  sabaneta: 'Sabaneta',
  'la estrella': 'La Estrella',
  caldas: 'Caldas',
  copacabana: 'Copacabana',
  girardota: 'Girardota',
  barbosa: 'Barbosa',
};

function normalizeMunicipality(raw: string): string {
  const key = raw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return MUNICIPALITIES[key] ?? raw.trim();
}

/** SIATA timestamps are local time without offset ("2026-09-28 17:00"). */
function toIso(local: string | null): string | null {
  if (!local) return null;
  return `${local.replace(' ', 'T').slice(0, 16)}:00-05:00`;
}

export function mapStations(features: StationFeature[]): AirStation[] {
  return features.map(({ geometry, properties: p }) => ({
    id: String(p.codigo),
    name: p.nombreEstacion.replace(/^Estación\s+/i, '').trim(),
    municipality: normalizeMunicipality(p.Municipio),
    longitude: geometry.coordinates[0],
    latitude: geometry.coordinates[1],
    pm25: typeof p.PM25_24H_prom === 'number' && p.PM25_24H_prom >= 0 ? p.PM25_24H_prom : null,
    ica: typeof p.ICA_24H_prom === 'number' && p.ICA_24H_prom >= 0 ? Math.round(p.ICA_24H_prom) : null,
    updatedAt: toIso(p.fechaFin),
  }));
}

export interface StationSeries {
  station: string;
  code: string;
  points: Array<{ time: string; pm25: number | null }>;
}

interface SeriesResponse {
  info: { NombreEstacion: string; Codigo: number; Hora_fin: string; Horas: number[]; PM25_72H: Array<number | null> };
}

/** Last 72 hourly PM2.5 readings for one station, oldest first. */
export function mapSeries({ info }: SeriesResponse): StationSeries {
  const end = new Date(`${info.Hora_fin.replace(' ', 'T').slice(0, 16)}:00-05:00`).getTime();
  const count = info.PM25_72H.length;
  return {
    station: info.NombreEstacion.replace(/^Estación\s+/i, '').trim(),
    code: String(info.Codigo),
    points: info.PM25_72H.map((pm25, i) => ({
      time: new Date(end - (count - 1 - i) * 3_600_000).toISOString(),
      pm25: typeof pm25 === 'number' && pm25 >= 0 ? pm25 : null,
    })),
  };
}

export async function fetchSiataStations(fetchImpl: typeof fetch = fetch): Promise<AirStation[]> {
  const response = await fetchImpl(SIATA_STATIONS_URL, { signal: AbortSignal.timeout(15_000), cache: 'no-store' });
  if (!response.ok) throw new Error(`SIATA respondió ${response.status}`);
  const json = (await response.json()) as { features: StationFeature[] };
  return mapStations(json.features);
}

export async function fetchSiataSeries(code: string, fetchImpl: typeof fetch = fetch): Promise<StationSeries> {
  const response = await fetchImpl(siataSeriesUrl(code), { signal: AbortSignal.timeout(15_000), cache: 'no-store' });
  if (!response.ok) throw new Error(`SIATA respondió ${response.status}`);
  return mapSeries((await response.json()) as SeriesResponse);
}
