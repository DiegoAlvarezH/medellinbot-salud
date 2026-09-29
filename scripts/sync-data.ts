/**
 * Downloads every open-data source into data/snapshots/*.json.
 *
 *   pnpm data:sync            # all sources
 *   pnpm data:sync osm-health # only the named snapshots
 *
 * Snapshots are committed so the app boots instantly and survives upstream outages;
 * at runtime each one is refreshed live once it is older than its max age.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchIndicators } from '@/lib/sources/indicators';
import { fetchMetrosalud } from '@/lib/sources/metrosalud';
import { fetchOsmPlaces, fetchOsmServices, fetchOsmStations } from '@/lib/sources/osm';
import { fetchRepsIps } from '@/lib/sources/reps';

const OUT_DIR = path.join(process.cwd(), 'data', 'snapshots');

const JOBS: Record<string, { source: string; run: () => Promise<unknown[] | object> }> = {
  metrosalud: { source: 'MEData · Centros de atención de Metrosalud (1-048-22-000400)', run: () => fetchMetrosalud() },
  'reps-aburra': { source: 'datos.gov.co · REPS MinSalud (c36g-9fc2)', run: () => fetchRepsIps() },
  'osm-health': { source: 'OpenStreetMap · Overpass API (ODbL)', run: () => fetchOsmServices() },
  'osm-stations': { source: 'OpenStreetMap · Overpass API (ODbL)', run: () => fetchOsmStations() },
  'osm-places': { source: 'OpenStreetMap · Overpass API (ODbL)', run: () => fetchOsmPlaces() },
  indicators: { source: 'datos.gov.co · 8u7u-645t (vacunación) y 4hyg-wa9d (SIVIGILA)', run: () => fetchIndicators() },
};

async function main() {
  const only = process.argv.slice(2);
  const names = only.length ? only : Object.keys(JOBS);
  await fs.mkdir(OUT_DIR, { recursive: true });

  let failed = 0;
  for (const name of names) {
    const job = JOBS[name];
    if (!job) {
      console.error(`✗ ${name}: fuente desconocida (opciones: ${Object.keys(JOBS).join(', ')})`);
      failed += 1;
      continue;
    }
    const started = Date.now();
    try {
      const data = await job.run();
      const snapshot = { source: job.source, generatedAt: new Date().toISOString(), data };
      await fs.writeFile(path.join(OUT_DIR, `${name}.json`), `${JSON.stringify(snapshot)}\n`, 'utf8');
      const size = Array.isArray(data) ? `${data.length} registros` : 'ok';
      console.log(`✓ ${name}: ${size} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${name}: ${(error as Error).message}`);
    }
    // Be polite with Overpass: at most two concurrent slots per IP.
    if (name.startsWith('osm')) await new Promise((r) => setTimeout(r, 2000));
  }
  process.exitCode = failed ? 1 : 0;
}

void main();
