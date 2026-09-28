/**
 * REPS — Registro Especial de Prestadores y Sedes de Servicios de Salud (MinSalud),
 * published on datos.gov.co as dataset c36g-9fc2 (CC BY-SA 4.0, refreshed ~quarterly).
 * It has no coordinates, so it is used to enrich geolocated sources and as a searchable directory.
 */

export const REPS_DATASET_URL = 'https://www.datos.gov.co/resource/c36g-9fc2.json';

/** DANE codes of the ten Valle de Aburrá municipalities. */
export const ABURRA_DANE: Record<string, string> = {
  '05001': 'Medellín',
  '05088': 'Bello',
  '05266': 'Envigado',
  '05360': 'Itagüí',
  '05631': 'Sabaneta',
  '05380': 'La Estrella',
  '05129': 'Caldas',
  '05212': 'Copacabana',
  '05308': 'Girardota',
  '05079': 'Barbosa',
};

export interface RepsSede {
  code: string;
  providerCode: string;
  provider: string;
  name: string;
  municipality: string;
  address: string;
  phone?: string;
  email?: string;
  nature: string;
  ese: boolean;
}

interface RepsRow {
  codigoprestador: string;
  nombreprestador: string;
  codigohabilitacionsede: string;
  nombresede: string;
  naturalezajuridica: string;
  ese: string;
  municipiosede: string;
  direcci_nsede?: string;
  t_lefonosede?: string;
  email_sede?: string;
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|[\s(/-])([a-záéíóúñü])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/\b(De|Del|La|Las|Los|Y|E|En|Para|Por|El)\b/g, (w) => w.toLowerCase())
    .replace(/\b(Ips|Ese|Sas|S\.a\.s|Ltda|Uci|Eps)\b/gi, (w) => w.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase());
}

export async function fetchRepsIps(fetchImpl: typeof fetch = fetch): Promise<RepsSede[]> {
  const codes = Object.keys(ABURRA_DANE)
    .map((c) => `'${c}'`)
    .join(',');
  const params = new URLSearchParams({
    $select:
      'codigoprestador,nombreprestador,codigohabilitacionsede,nombresede,naturalezajuridica,ese,municipiosede,direcci_nsede,t_lefonosede,email_sede',
    $where: `municipiosede in(${codes}) AND claseprestador like 'Instituciones%'`,
    $order: 'codigohabilitacionsede',
    $limit: '5000',
  });
  const response = await fetchImpl(`${REPS_DATASET_URL}?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`datos.gov.co (REPS) respondió ${response.status}`);
  const rows = (await response.json()) as RepsRow[];
  return rows.map((row) => ({
    code: row.codigohabilitacionsede,
    providerCode: row.codigoprestador,
    provider: titleCase(row.nombreprestador),
    name: titleCase(row.nombresede || row.nombreprestador),
    municipality: ABURRA_DANE[row.municipiosede] ?? row.municipiosede,
    address: (row.direcci_nsede ?? '').replace(/\s+/g, ' ').trim(),
    phone: row.t_lefonosede?.trim() || undefined,
    email: row.email_sede?.trim().toLowerCase() || undefined,
    nature: row.naturalezajuridica,
    ese: row.ese === 'SI',
  }));
}
