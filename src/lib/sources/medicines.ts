/**
 * Medicines from Datos Abiertos Colombia (all CC BY-SA 4.0):
 *  - i7cb-raxc  INVIMA — Código Único de Medicamentos (CUM) vigentes
 *  - nauz-qkjw  MinSalud — precios máximos de venta regulados (circulares CNPMDM)
 *  - xzwx-qpja  INVIMA — medicamentos de venta libre
 * Shared by the Next.js server and scripts/sync-data.ts.
 */
import { USER_AGENT } from '@/lib/config/site';

const BASE = 'https://www.datos.gov.co/resource';

export interface RegisteredProduct {
  file: string;
  product: string;
  holder: string;
  registration: string;
  status: string;
  form: string;
  route: string;
}

export interface RegulatedPrice {
  cum: string;
  medicine: string;
  market: string;
  /** Maximum price for institutional sales (hospitals, EPS), in COP. */
  institutional: number | null;
  /** Maximum price at the pharmacy counter, in COP, when regulated. */
  commercial: number | null;
  circular: string;
  since: string | null;
}

export interface OtcEntry {
  ingredient: string;
  concentration?: string;
  form?: string;
}

export interface MedicineSearch {
  query: string;
  products: RegisteredProduct[];
  prices: RegulatedPrice[];
  otc: OtcEntry[];
}

export function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Turns user input into a safe SoQL LIKE stem. Only letters are kept (so quotes can never reach the query)
 * and the ending is trimmed because the registry spells "ACETAMINOFÉN" with an accent that upper() keeps.
 */
export function medicineStem(input: string): string | null {
  const letters = fold(input).replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  const word = letters.split(' ').sort((a, b) => b.length - a.length)[0] ?? '';
  if (word.length < 4) return null;
  const stem = word.length > 7 ? word.slice(0, word.length - 2) : word;
  return stem.toUpperCase();
}

async function soql<T>(dataset: string, params: Record<string, string>, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(`${BASE}/${dataset}.json?${new URLSearchParams(params)}`, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`datos.gov.co (${dataset}) respondió ${response.status}`);
  return (await response.json()) as T;
}

function toPrice(value: string | undefined): number | null {
  if (!value) return null;
  const number = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

export async function fetchOtcList(fetchImpl: typeof fetch = fetch): Promise<OtcEntry[]> {
  const rows = await soql<Array<{ principioactivo?: string; concentracion?: string; formafarmaceutica?: string }>>(
    'xzwx-qpja',
    { $limit: '5000' },
    fetchImpl,
  );
  return rows
    .filter((r) => r.principioactivo)
    .map((r) => ({ ingredient: r.principioactivo!.replace(/\s+/g, ' ').trim(), concentration: r.concentracion?.trim(), form: r.formafarmaceutica?.trim() }));
}

export async function searchRegisteredProducts(stem: string, fetchImpl: typeof fetch = fetch): Promise<RegisteredProduct[]> {
  const rows = await soql<
    Array<{ expediente: string; producto: string; titular: string; registrosanitario: string; estadoregistro: string; formafarmaceutica: string; viaadministracion: string; n: string }>
  >(
    'i7cb-raxc',
    {
      $select: 'expediente,producto,titular,registrosanitario,estadoregistro,formafarmaceutica,viaadministracion,count(*) as n',
      $where: `(upper(principioactivo) like '%${stem}%' OR upper(producto) like '%${stem}%') AND estadocum='Activo'`,
      $group: 'expediente,producto,titular,registrosanitario,estadoregistro,formafarmaceutica,viaadministracion',
      $order: 'n DESC',
      $limit: '12',
    },
    fetchImpl,
  );
  return rows.map((r) => ({
    file: r.expediente,
    product: r.producto.replace(/\s+/g, ' ').trim(),
    holder: r.titular.replace(/\s+/g, ' ').trim(),
    registration: r.registrosanitario,
    status: r.estadoregistro,
    form: r.formafarmaceutica,
    route: r.viaadministracion,
  }));
}

export async function searchRegulatedPrices(stem: string, fetchImpl: typeof fetch = fetch): Promise<RegulatedPrice[]> {
  const rows = await soql<Array<Record<string, string>>>(
    'nauz-qkjw',
    {
      $where: `upper(medicamento) like '%${stem}%'`,
      $order: 'fecha_de_inicio_vigencia_precio_maximo_de_venta DESC',
      $limit: '60',
    },
    fetchImpl,
  );
  if (!rows.length) return [];
  // Only the circular currently in force: older circulars linger in the dataset.
  const current = rows[0].circular_cnpmdm;
  return rows
    .filter((r) => r.circular_cnpmdm === current)
    .map((r) => ({
      cum: r.cum,
      medicine: r.medicamento?.replace(/\s+/g, ' ').trim() ?? '',
      market: r.mercado_relevante ?? '',
      institutional: toPrice(r.precio_maximo_de_venta_transaccion_primaria_secundaria_y_final_institucional),
      commercial: toPrice(
        r.precio_maximo_de_venta_transaccion_final_comercial ?? r.precio_maximo_de_venta_transaccion_primaria_y_secundaria_comercial,
      ),
      circular: current,
      since: r.fecha_de_inicio_vigencia_precio_maximo_de_venta?.slice(0, 10) ?? null,
    }))
    .filter((p) => p.institutional !== null || p.commercial !== null)
    // Single-ingredient markets first ("LOSARTAN - Sólido - Oral" before "AMLODIPINO + LOSARTAN …").
    .sort((a, b) => Number(!fold(a.market).startsWith(fold(stem))) - Number(!fold(b.market).startsWith(fold(stem))))
    .slice(0, 10);
}

export function matchOtc(stem: string, otc: OtcEntry[]): OtcEntry[] {
  const needle = fold(stem);
  return otc.filter((entry) => fold(entry.ingredient).includes(needle)).slice(0, 8);
}
