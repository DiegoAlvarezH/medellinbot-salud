import 'server-only';
import { cached } from '@/lib/server/cache';
import { snapshotFirst } from '@/lib/server/snapshots';
import { getReps } from '@/lib/server/health-network';
import { fetchIndicators, type Indicators } from '@/lib/sources/indicators';
import { ABURRA_DANE } from '@/lib/sources/reps';

const DAY = 24 * 60 * 60 * 1000;

export interface ProviderStats {
  byMunicipality: Array<{ municipality: string; total: number; public: number }>;
  medellin: { total: number; public: number; private: number; mixed: number };
}

export async function getIndicators(): Promise<Indicators & { generatedAt: string }> {
  return cached('indicators', DAY, async () => {
    const { data, generatedAt } = await snapshotFirst('indicators', 7 * DAY, () => fetchIndicators());
    // Older snapshots predate the water/EPS/mortality datasets: default them so the page still renders.
    const partial = data as Omit<Indicators, 'water' | 'eps' | 'mortality'> & Partial<Indicators>;
    return { ...partial, water: partial.water ?? null, eps: partial.eps ?? null, mortality: partial.mortality ?? [], generatedAt };
  });
}

/** IPS counts by municipality and legal nature, derived from REPS. */
export async function getProviderStats(): Promise<ProviderStats> {
  const reps = await getReps();
  const byMunicipality = Object.values(ABURRA_DANE)
    .map((municipality) => {
      const rows = reps.filter((r) => r.municipality === municipality);
      return { municipality, total: rows.length, public: rows.filter((r) => r.nature === 'Pública').length };
    })
    .sort((a, b) => b.total - a.total);
  const medellin = reps.filter((r) => r.municipality === 'Medellín');
  return {
    byMunicipality,
    medellin: {
      total: medellin.length,
      public: medellin.filter((r) => r.nature === 'Pública').length,
      private: medellin.filter((r) => r.nature === 'Privada').length,
      mixed: medellin.filter((r) => r.nature === 'Mixta').length,
    },
  };
}
