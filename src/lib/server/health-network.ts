import 'server-only';
import { cached } from '@/lib/server/cache';
import { snapshotFirst } from '@/lib/server/snapshots';
import { fetchMetrosalud } from '@/lib/sources/metrosalud';
import { buildNetwork } from '@/lib/sources/network';
import { fetchOsmPlaces, fetchOsmServices, fetchOsmStations } from '@/lib/sources/osm';
import { fetchRepsIps, type RepsSede } from '@/lib/sources/reps';
import type { HealthService, Place } from '@/types';

const DAY = 24 * 60 * 60 * 1000;

export interface HealthNetwork {
  services: HealthService[];
  sources: string[];
  updatedAt: string;
}

export function getPlaces(): Promise<Place[]> {
  return cached('places', 7 * DAY, async () => (await snapshotFirst('osm-places', 90 * DAY, () => fetchOsmPlaces())).data);
}

export function getReps(): Promise<RepsSede[]> {
  return cached('reps', DAY, async () => (await snapshotFirst('reps-aburra', 7 * DAY, () => fetchRepsIps())).data);
}

/** Unified, geolocated health network for the Valle de Aburrá (≈1 000 sites). */
export function getHealthNetwork(): Promise<HealthNetwork> {
  return cached('health-network', 6 * 60 * 60 * 1000, async () => {
    const [metrosalud, osm, stations, reps] = await Promise.all([
      snapshotFirst('metrosalud', 30 * DAY, () => fetchMetrosalud()),
      snapshotFirst('osm-health', 7 * DAY, () => fetchOsmServices()),
      snapshotFirst('osm-stations', 30 * DAY, () => fetchOsmStations()),
      snapshotFirst('reps-aburra', 7 * DAY, () => fetchRepsIps()),
    ]);
    const services = buildNetwork({ metrosalud: metrosalud.data, osm: osm.data, reps: reps.data, stations: stations.data });
    const updatedAt = [metrosalud, osm, reps].map((s) => s.generatedAt).sort()[0];
    return {
      services,
      sources: ['MEData · Metrosalud', 'REPS · MinSalud (datos.gov.co)', '© colaboradores de OpenStreetMap'],
      updatedAt,
    };
  });
}
