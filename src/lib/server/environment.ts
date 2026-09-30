import 'server-only';
import { cached } from '@/lib/server/cache';
import { aqiCategory, icaFromPm25 } from '@/lib/air-quality';
import { getModelledAir } from '@/lib/server/sources/open-meteo';
import { fetchSiataSeries, fetchSiataStations, type StationSeries } from '@/lib/sources/siata';
import { fetchHydrology, type Hydrology } from '@/lib/sources/siata-hydrology';
import type { AirQualitySnapshot, AirStation } from '@/types';

const AIR_TTL = 20 * 60 * 1000;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * City-wide air quality. SIATA's measured 24 h averages are the primary source; the
 * CAMS model from Open-Meteo only fills pollutants SIATA lacks, or everything if SIATA is down
 * (the model is known to underestimate PM2.5 inside the valley, so it is labelled as an estimate).
 */
export function getAirQuality(): Promise<AirQualitySnapshot> {
  return cached('air-quality', AIR_TTL, async () => {
    const [siata, model] = await Promise.allSettled([fetchSiataStations(), getModelledAir()]);
    const stations: AirStation[] = siata.status === 'fulfilled' ? siata.value : [];
    const modelled = model.status === 'fulfilled' ? model.value : null;

    const medellin = stations.filter((s) => s.municipality === 'Medellín' && s.ica !== null);
    const reference = medellin.length ? medellin : stations.filter((s) => s.ica !== null);

    if (reference.length) {
      const ica = median(reference.map((s) => s.ica!));
      const pm25Values = reference.map((s) => s.pm25).filter((v): v is number => v !== null);
      const category = aqiCategory(ica);
      const updatedAt = reference.map((s) => s.updatedAt).filter(Boolean).sort().at(-1) ?? new Date().toISOString();
      return {
        ica,
        level: category.level,
        label: category.label,
        pm25: pm25Values.length ? median(pm25Values) : null,
        pm10: modelled?.pm10 ?? null,
        ozone: modelled?.ozone ?? null,
        no2: modelled?.no2 ?? null,
        updatedAt,
        source: `SIATA (mediana de ${reference.length} estaciones, promedio 24 h)`,
        stations: stations.sort((a, b) => (b.ica ?? -1) - (a.ica ?? -1)),
        forecast: modelled?.forecast ?? [],
      };
    }

    if (!modelled || modelled.pm25 === null) throw new Error('Sin datos de calidad del aire');
    const ica = icaFromPm25(modelled.pm25);
    const category = aqiCategory(ica);
    return {
      ica,
      level: category.level,
      label: category.label,
      pm25: modelled.pm25,
      pm10: modelled.pm10,
      ozone: modelled.ozone,
      no2: modelled.no2,
      updatedAt: modelled.updatedAt,
      source: 'Open-Meteo (modelo CAMS, estimado)',
      stations: [],
      forecast: modelled.forecast,
    };
  });
}

export function getStationSeries(code: string): Promise<StationSeries> {
  return cached(`air-series:${code}`, AIR_TTL, () => fetchSiataSeries(code));
}

/** Rain in the last 15 minutes and stream levels from SIATA's hydro-meteorological network. */
export function getHydrology(): Promise<Hydrology> {
  return cached('hydrology', 5 * 60 * 1000, () => fetchHydrology());
}
