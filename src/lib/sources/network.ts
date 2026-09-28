/**
 * Builds the unified health network from the raw sources:
 * MEData/Metrosalud (authoritative public network) + OpenStreetMap (geolocated coverage),
 * enriched with the national REPS registry and the nearest Metro station.
 */
import { distanceMeters } from '@/lib/geo';
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
}

export function buildNetwork({ metrosalud, osm, reps, stations }: NetworkInput): HealthService[] {
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

  return [...publicNetwork, ...osmServices].map((service) => {
    const transit = nearestStation(service, stations);
    return transit ? { ...service, transit } : service;
  });
}
