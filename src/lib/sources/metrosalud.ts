/**
 * "Centros de atención de Metrosalud" — MEData (Alcaldía de Medellín), dataset 1-048-22-000400, CC BY-SA 4.0.
 * The only official, geolocated list of the public primary-care network.
 */
import type { HealthService } from '@/types';

export const METROSALUD_CSV_URL =
  'https://medata.gov.co/sites/default/files/distribution/1-048-22-000400/centros_atencion_metrosalud.csv';

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^|\s)([a-záéíóúñü])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/\b(De|Del|La|Las|Los|Y)\b/g, (w) => w.toLowerCase());
}

/** "UH SANTA CRUZ" → "Unidad Hospitalaria Santa Cruz", "CS TRINIDAD" → "Centro de Salud Trinidad". */
function expandName(raw: string): string {
  const name = raw.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const match = name.match(/^(UH|CS|UI)\s+(.*)$/i);
  if (!match) return titleCase(name);
  const prefix = { UH: 'Unidad Hospitalaria', CS: 'Centro de Salud', UI: 'Unidad Intermedia' }[match[1].toUpperCase()]!;
  return `${prefix} ${titleCase(match[2])}`;
}

/** Tiny CSV parser that honours double-quoted fields. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = !quoted;
      } else if (ch === ',' && !quoted) {
        cells.push(cell);
        cell = '';
      } else cell += ch;
    }
    cells.push(cell);
    rows.push(cells.map((c) => c.replace(/\u00a0/g, ' ').trim()));
  }
  return rows;
}

export function parseMetrosalud(csv: string): HealthService[] {
  const [header, ...rows] = parseCsv(csv);
  const col = (name: string) => header.findIndex((h) => h.toLowerCase().startsWith(name));
  const iName = col('centro');
  const iAddress = col('direccion');
  const iComuna = col('comuna');
  const iBarrio = col('barrio');
  const iLng = col('longitud');
  const iLat = col('latitud');

  return rows
    .map((row, index): HealthService | null => {
      const latitude = Number(row[iLat]);
      const longitude = Number(row[iLng]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      const raw = row[iName] ?? '';
      return {
        id: `metrosalud-${index + 1}`,
        name: expandName(raw),
        type: 'health-center',
        latitude,
        longitude,
        address: row[iAddress]?.replace(/\s+/g, ' '),
        neighborhood: [row[iBarrio], row[iComuna] && `Comuna ${titleCase(row[iComuna])}`].filter(Boolean).join(' · ') || undefined,
        municipality: 'Medellín',
        isPublic: true,
        source: 'metrosalud',
      };
    })
    .filter((s): s is HealthService => s !== null);
}

export async function fetchMetrosalud(fetchImpl: typeof fetch = fetch): Promise<HealthService[]> {
  const response = await fetchImpl(METROSALUD_CSV_URL, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`MEData respondió ${response.status}`);
  return parseMetrosalud(await response.text());
}
