/**
 * OpenStreetMap health facilities for the Valle de Aburrá via the Overpass API.
 * Shared by the Next.js server and scripts/sync-data.ts, so it must not import server-only code.
 */
import { USER_AGENT } from '@/lib/config/site';
import { isInAburra } from '@/lib/geo';
import type { HealthService, Place, ServiceType, TransitStation } from '@/types';

/** Main instance first, then public mirrors (the main one often answers 504 under load). */
export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/** south, west, north, east — Caldas to Barbosa. */
const BBOX = '6.05,-75.72,6.45,-75.30';

export const OVERPASS_QUERY = `[out:json][timeout:90];
(
  nwr["amenity"~"^(hospital|clinic|pharmacy|dentist|doctors)$"](${BBOX});
  nwr["healthcare"~"^(hospital|clinic|centre|laboratory|pharmacy|dentist|doctor)$"](${BBOX});
);
out center tags;`;

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const PUBLIC_NETWORK = /metrosalud|\bE\.?\s?S\.?\s?E\.?\b|empresa social del estado|hospital general de medell|unidad hospitalaria|centro de salud|puesto de salud/i;

function classify(tags: Record<string, string>, name: string): ServiceType {
  const amenity = tags.amenity;
  const healthcare = tags.healthcare;
  // The name is more reliable than the tag: many drugstores and labs are mapped as clinics or hospitals.
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/\b(droguer|drogeria|farmacia|pharma)/.test(n)) return 'pharmacy';
  if (/\blaboratorio\b/.test(n) && !/\b(hospital|clinica)\b/.test(n)) return 'laboratory';
  if (/\b(odontolog|dental|dentix|ortodonc)/.test(n)) return 'dentist';
  if (amenity === 'hospital' || healthcare === 'hospital') return 'hospital';
  if (amenity === 'pharmacy' || healthcare === 'pharmacy') return 'pharmacy';
  if (amenity === 'dentist' || healthcare === 'dentist') return 'dentist';
  if (healthcare === 'laboratory') return 'laboratory';
  if (/centro de salud|puesto de salud|unidad (hospitalaria|intermedia)|metrosalud/i.test(name) || healthcare === 'centre') {
    return 'health-center';
  }
  if (amenity === 'clinic' || healthcare === 'clinic') return 'clinic';
  if (amenity === 'doctors' || healthcare === 'doctor') return 'doctor';
  return 'other';
}

function address(tags: Record<string, string>): string | undefined {
  if (tags['addr:full']) return tags['addr:full'];
  const street = tags['addr:street'];
  const number = tags['addr:housenumber'];
  if (street && number) return `${street} # ${number}`;
  return street;
}

export function mapOverpass(elements: OverpassElement[]): HealthService[] {
  const seen = new Set<string>();
  const services: HealthService[] = [];

  for (const element of elements) {
    const tags = element.tags ?? {};
    const name = (tags.name ?? tags['name:es'] ?? tags.brand ?? '').trim();
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (!name || latitude === undefined || longitude === undefined) continue;
    if (!isInAburra({ latitude, longitude })) continue;

    // The same facility is often mapped as a node and as a building outline.
    const dedupeKey = `${name.toLowerCase()}@${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const type = classify(tags, name);
    services.push({
      id: `osm-${element.type[0]}${element.id}`,
      name,
      type,
      latitude,
      longitude,
      address: address(tags),
      neighborhood: tags['addr:suburb'] ?? tags['addr:neighbourhood'],
      municipality: tags['addr:city'],
      phone: tags.phone ?? tags['contact:phone'],
      website: tags.website ?? tags['contact:website'],
      hours: tags.opening_hours,
      // Only an explicit tag counts: many "hospitals" in OSM are outpatient sites without urgencias.
      emergency: tags.emergency === 'yes' || undefined,
      isPublic: tags.operator_type === 'public' || tags['operator:type'] === 'public' || PUBLIC_NETWORK.test(`${name} ${tags.operator ?? ''}`) || undefined,
      source: 'osm',
    });
  }

  return services;
}

export const OVERPASS_STATIONS_QUERY = `[out:json][timeout:60];
(
  nwr["railway"~"^(station|halt|tram_stop)$"]["network"~"Metro de Medell",i](${BBOX});
  nwr["aerialway"="station"](${BBOX});
  nwr["public_transport"="station"]["network"~"Metro de Medell",i](${BBOX});
);
out center tags;`;

async function overpass(query: string, fetchImpl: typeof fetch): Promise<OverpassElement[]> {
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(100_000),
      });
      if (!response.ok) throw new Error(`${new URL(endpoint).host} respondió ${response.status}`);
      return ((await response.json()) as { elements: OverpassElement[] }).elements;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Overpass no respondió');
}

export async function fetchOsmStations(fetchImpl: typeof fetch = fetch): Promise<TransitStation[]> {
  const elements = await overpass(OVERPASS_STATIONS_QUERY, fetchImpl);
  const byName = new Map<string, TransitStation>();
  for (const element of elements) {
    const name = element.tags?.name?.trim();
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (!name || latitude === undefined || longitude === undefined) continue;
    const clean = name.replace(/^Estaci[oó]n\s+/i, '');
    if (!byName.has(clean.toLowerCase())) {
      byName.set(clean.toLowerCase(), { id: `osm-${element.type[0]}${element.id}`, name: clean, latitude, longitude });
    }
  }
  return [...byName.values()];
}

export const OVERPASS_PLACES_QUERY = `[out:json][timeout:60];
(
  nwr["place"~"^(suburb|neighbourhood|quarter|town|city|village)$"]["name"](${BBOX});
);
out center tags;`;

/** Barrios, comunas and towns of the valley, so questions like "farmacia en Laureles" can be located. */
export async function fetchOsmPlaces(fetchImpl: typeof fetch = fetch): Promise<Place[]> {
  const elements = await overpass(OVERPASS_PLACES_QUERY, fetchImpl);
  const places: Place[] = [];
  const seen = new Set<string>();
  for (const element of elements) {
    const name = element.tags?.name?.trim();
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (!name || latitude === undefined || longitude === undefined || !isInAburra({ latitude, longitude })) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    places.push({ name, kind: element.tags?.place ?? 'place', latitude, longitude });
  }
  return places;
}

export async function fetchOsmServices(fetchImpl: typeof fetch = fetch): Promise<HealthService[]> {
  return mapOverpass(await overpass(OVERPASS_QUERY, fetchImpl));
}
