/**
 * Builds the unified health network from the raw sources:
 * MEData/Metrosalud (authoritative public network) + OpenStreetMap (geolocated coverage),
 * enriched with the national REPS registry, GeoMedellín's health sites (vaccination flag) and the
 * nearest Metro station.
 */
import { distanceMeters } from '@/lib/geo';
import type { SedeSalud } from '@/lib/sources/geomedellin';
import type { RepsSede } from '@/lib/sources/reps';
import type { HealthService, TransitStation } from '@/types';

const METROSALUD_PROVIDER = '0500102178';

const STOPWORDS = new Set(
  'de del la las los el y e en sede ips sas s a ltda sa ese empresa social estado unidad hospitalaria hospital clinica centro salud medico medica uh cs sede principal nit servicios'.split(
    ' ',
  ),
);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/manrr/g, 'manr')
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t)),
  );
}

/** Share of `target` tokens found in `candidate` — safe only within a small, known candidate set. */
function containment(target: Set<string>, candidate: Set<string>): number {
  if (!target.size) return 0;
  let shared = 0;
  for (const t of target) if (candidate.has(t)) shared += 1;
  return shared / target.size;
}

/** Sørensen–Dice coefficient; requires at least one shared token of 4+ letters. */
function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  let meaningful = false;
  for (const t of a) {
    if (b.has(t)) {
      shared += 1;
      if (t.length >= 4) meaningful = true;
    }
  }
  return meaningful ? (2 * shared) / (a.size + b.size) : 0;
}

interface RepsIndexEntry {
  sede: RepsSede;
  name: Set<string>;
  provider: Set<string>;
  municipality: string;
}

function indexReps(sedes: RepsSede[]): RepsIndexEntry[] {
  return sedes.map((sede) => ({ sede, name: tokens(sede.name), provider: tokens(sede.provider), municipality: fold(sede.municipality) }));
}

function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function bestRepsMatch(
  service: HealthService,
  index: RepsIndexEntry[],
  score: (target: Set<string>, entry: RepsIndexEntry) => number,
  threshold: number,
): RepsSede | undefined {
  const target = tokens(service.name);
  const city = service.municipality ? fold(service.municipality) : undefined;
  let best: { score: number; sede?: RepsSede } = { score: 0 };
  for (const entry of index) {
    if (city && entry.municipality !== city) continue;
    const value = score(target, entry);
    if (value > best.score) best = { score: value, sede: entry.sede };
  }
  return best.score >= threshold ? best.sede : undefined;
}

function nearestStation(service: HealthService, stations: TransitStation[]) {
  let best: { name: string; distance: number } | undefined;
  for (const station of stations) {
    const distance = distanceMeters(service, station);
    if (distance <= 1200 && (!best || distance < best.distance)) best = { name: station.name, distance };
  }
  return best;
}

export interface NetworkInput {
  metrosalud: HealthService[];
  osm: HealthService[];
  reps: RepsSede[];
  stations: TransitStation[];
  /** GeoMedellín "Sedes Salud"; optional so older snapshots still build. */
  sedes?: SedeSalud[];
}

/** Matches a GeoMedellín site by REPS code first, then by proximity plus a shared distinctive word. */
function findSede(service: HealthService, sedes: SedeSalud[], claimed: Set<SedeSalud>): SedeSalud | undefined {
  if (service.repsCode) {
    const byCode = sedes.find((s) => !claimed.has(s) && s.repsCode === service.repsCode);
    if (byCode) return byCode;
  }
  const target = tokens(service.name);
  return sedes.find(
    (s) => !claimed.has(s) && distanceMeters(s, service) < 200 && [...tokens(s.name)].some((t) => t.length >= 4 && target.has(t)),
  );
}

function classifySede(name: string): HealthService['type'] {
  if (/hospital/i.test(name)) return 'hospital';
  if (/centro de salud|unidad hospitalaria|puesto de salud/i.test(name)) return 'health-center';
  return 'clinic';
}

export function buildNetwork({ metrosalud, osm, reps, stations, sedes = [] }: NetworkInput): HealthService[] {
  const metrosaludReps = indexReps(reps.filter((s) => s.providerCode === METROSALUD_PROVIDER));
  const repsIndex = indexReps(reps);

  const publicNetwork = metrosalud.map((service) => {
    const match = bestRepsMatch(service, metrosaludReps, (target, entry) => containment(target, entry.name), 1);
    return match ? { ...service, phone: match.phone, repsCode: match.code } : service;
  });

  const osmServices = osm
    // OSM often duplicates Metrosalud sites: drop anything within 150 m of an official centre.
    .filter((o) => !(o.type === 'health-center' || o.type === 'clinic' || o.type === 'hospital') || !publicNetwork.some((m) => distanceMeters(m, o) < 150))
    .map((service) => {
      if (service.type === 'pharmacy' || service.type === 'doctor' || service.type === 'other') return service;
      const match = bestRepsMatch(service, repsIndex, (target, entry) => Math.max(dice(target, entry.name), dice(target, entry.provider)), 0.8);
      if (!match) return service;
      return {
        ...service,
        phone: service.phone ?? match.phone,
        address: service.address ?? match.address,
        municipality: service.municipality ?? match.municipality,
        isPublic: match.nature === 'Pública' || match.ese ? true : match.nature === 'Privada' ? false : service.isPublic,
        repsCode: match.code,
      };
    });

  // GeoMedellín: flag vaccination on matching sites and add the official sites nobody else mapped.
  const claimed = new Set<SedeSalud>();
  const merged = [...publicNetwork, ...osmServices].map((service) => {
    if (service.type === 'pharmacy' || service.type === 'dentist') return service;
    const sede = findSede(service, sedes, claimed);
    if (!sede) return service;
    claimed.add(sede);
    return {
      ...service,
      vaccination: sede.vaccination || undefined,
      phone: service.phone ?? sede.phone,
      address: service.address ?? sede.address,
      repsCode: service.repsCode ?? (sede.repsCode || undefined),
      isPublic: service.isPublic ?? (sede.isPublic || undefined),
    };
  });
  const added: HealthService[] = sedes
    .filter((s) => !claimed.has(s))
    .map((s) => ({
      id: `geomedellin-${s.repsCode || `${s.latitude},${s.longitude}`}`,
      name: s.name,
      type: classifySede(s.name),
      latitude: s.latitude,
      longitude: s.longitude,
      address: s.address,
      phone: s.phone,
      municipality: 'Medellín',
      isPublic: s.isPublic || undefined,
      vaccination: s.vaccination || undefined,
      repsCode: s.repsCode || undefined,
      source: 'geomedellin',
    }));

  return [...merged, ...added].map((service) => {
    const transit = nearestStation(service, stations);
    return transit ? { ...service, transit } : service;
  });
}
