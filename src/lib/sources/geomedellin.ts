/**
 * GeoMedellín — the Alcaldía's ArcGIS server. Layer "Sedes Salud" (MAP5_Cartobase/MapServer/4) lists
 * 145 geolocated health sites with their REPS code and flags for the programmes they report,
 * including vaccination (`reportavac`). The server rejects generic HTTP clients, so a descriptive
 * User-Agent is required.
 */
import { USER_AGENT } from '@/lib/config/site';
import { isInAburra } from '@/lib/geo';

export const SEDES_SALUD_URL =
  'https://www.medellin.gov.co/servidormapas/rest/services/ServiciosCiudad/MAP5_Cartobase/MapServer/4/query?where=1%3D1&outFields=*&outSR=4326&f=geojson';

export interface SedeSalud {
  repsCode: string;
  name: string;
  address?: string;
  phone?: string;
  isPublic: boolean;
  vaccination: boolean;
  latitude: number;
  longitude: number;
}

interface Feature {
  geometry: { coordinates: [number, number] } | null;
  properties: Record<string, string | number | null>;
}

const clean = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text && !/^ninguna$/i.test(text) ? text : undefined;
};

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-záéíóúñü])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/\b(De|Del|La|Las|Los|Y|E|En)\b/g, (w) => w.toLowerCase())
    .replace(/\b(Ips|Ese|Sas|Uci|Eps)\b/gi, (w) => w.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase());
}

export function mapSedesSalud(features: Feature[]): SedeSalud[] {
  const sedes: SedeSalud[] = [];
  for (const { geometry, properties: p } of features) {
    if (!geometry) continue;
    const [longitude, latitude] = geometry.coordinates;
    const name = clean(p.nombre_centro_salud);
    if (!name || !Number.isFinite(latitude) || !isInAburra({ latitude, longitude })) continue;
    sedes.push({
      repsCode: String(p.codigo_sede ?? '').trim(),
      name: titleCase(name),
      address: clean(p.direccion),
      phone: clean(p.telefono),
      isPublic: clean(p.naturaleza) === 'Pública',
      vaccination: clean(p.reportavac) === 'Si',
      latitude,
      longitude,
    });
  }
  return sedes;
}

export async function fetchSedesSalud(fetchImpl: typeof fetch = fetch): Promise<SedeSalud[]> {
  const response = await fetchImpl(SEDES_SALUD_URL, {
    headers: { Accept: 'application/geo+json, application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`GeoMedellín respondió ${response.status}`);
  const json = (await response.json()) as { features?: Feature[] };
  return mapSedesSalud(json.features ?? []);
}
