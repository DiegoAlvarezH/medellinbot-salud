/**
 * SIATA hydro-meteorological network (geoportal.siata.gov.co, undocumented but public):
 *  - geodataJson/3/pluvios_v2  rain gauges, rain in the last 15 minutes
 *  - geodataJson/2/niveles     stream and river level stations with a status colour
 * Timestamps are Colombian local time without offset.
 */

export const RAIN_URL = 'https://geoportal.siata.gov.co/fastgeoapi/geodata/geodataJson/3/pluvios_v2';
export const LEVELS_URL = 'https://geoportal.siata.gov.co/fastgeoapi/geodata/geodataJson/2/niveles';

export interface RainGauge {
  id: string;
  name: string;
  municipality: string;
  latitude: number;
  longitude: number;
  /** Millimetres in the last 15 minutes. */
  last15min: number;
  raining: boolean;
  updatedAt: string | null;
}

export type LevelStatus = 'normal' | 'precaucion' | 'alerta' | 'sin-dato';

export interface LevelStation {
  id: string;
  name: string;
  municipality: string;
  latitude: number;
  longitude: number;
  status: LevelStatus;
  updatedAt: string | null;
}

export interface Hydrology {
  rain: { gauges: number; raining: RainGauge[]; heaviest: RainGauge[]; updatedAt: string | null };
  levels: { stations: number; watch: LevelStation[]; alert: LevelStation[]; updatedAt: string | null };
}

interface Feature {
  geometry: { coordinates: [number, number] } | null;
  properties: Record<string, unknown>;
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

function municipality(raw: unknown): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  const key = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return MUNICIPALITIES[key] ?? text;
}

/** "2026-09-30 00:58:02" or "2026-09-30T01:10:00" (local time) → ISO with the -05:00 offset. */
export function localToIso(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(value)) return null;
  return `${value.replace(' ', 'T').slice(0, 16)}:00-05:00`;
}

/** SIATA paints level stations by status; the palette is fixed on the geoportal. */
export function levelStatus(color: unknown): LevelStatus {
  const hex = typeof color === 'string' ? color.trim().toLowerCase() : '';
  if (hex === '#79c454') return 'normal';
  if (hex === '#f9da41' || hex === '#fce65e') return 'precaucion';
  if (hex === '#fc3a3a' || hex === '#ff0000' || hex === '#f5a623' || hex === '#ff8c00') return 'alerta';
  return 'sin-dato';
}

export function mapRain(features: Feature[]): RainGauge[] {
  return features
    .filter((f) => f.geometry)
    .map(({ geometry, properties: p }) => {
      const mm = Number(p.acumulado_15min);
      return {
        id: String(p.codigo),
        name: String(p.nombre ?? '').trim(),
        municipality: municipality(p.ubicacion),
        longitude: geometry!.coordinates[0],
        latitude: geometry!.coordinates[1],
        last15min: Number.isFinite(mm) && mm >= 0 ? Math.round(mm * 10) / 10 : 0,
        raining: p.flag_precipitacion === 'si' || (Number.isFinite(mm) && mm > 0),
        updatedAt: localToIso(p.fecha_ultima_actualizacion),
      };
    });
}

export function mapLevels(features: Feature[]): LevelStation[] {
  return features
    .filter((f) => f.geometry)
    .map(({ geometry, properties: p }) => ({
      id: String(p.codigo),
      name: String(p.nombreEstacion ?? '').trim(),
      municipality: municipality(p.municipio),
      longitude: geometry!.coordinates[0],
      latitude: geometry!.coordinates[1],
      status: levelStatus(p.color),
      updatedAt: localToIso(p.fechaUltimoDato),
    }));
}

const latest = (values: Array<string | null>) => values.filter((v): v is string => Boolean(v)).sort().at(-1) ?? null;

export function summarizeHydrology(gauges: RainGauge[], levels: LevelStation[]): Hydrology {
  const raining = gauges.filter((g) => g.raining);
  return {
    rain: {
      gauges: gauges.length,
      raining,
      heaviest: [...raining].sort((a, b) => b.last15min - a.last15min).slice(0, 5),
      updatedAt: latest(gauges.map((g) => g.updatedAt)),
    },
    levels: {
      stations: levels.length,
      watch: levels.filter((l) => l.status === 'precaucion'),
      alert: levels.filter((l) => l.status === 'alerta'),
      updatedAt: latest(levels.map((l) => l.updatedAt)),
    },
  };
}

async function getFeatures(url: string, fetchImpl: typeof fetch): Promise<Feature[]> {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(15_000), cache: 'no-store' });
  if (!response.ok) throw new Error(`SIATA respondió ${response.status}`);
  return ((await response.json()) as { features?: Feature[] }).features ?? [];
}

export async function fetchHydrology(fetchImpl: typeof fetch = fetch): Promise<Hydrology> {
  const [rain, levels] = await Promise.all([getFeatures(RAIN_URL, fetchImpl), getFeatures(LEVELS_URL, fetchImpl)]);
  return summarizeHydrology(mapRain(rain), mapLevels(levels));
}
