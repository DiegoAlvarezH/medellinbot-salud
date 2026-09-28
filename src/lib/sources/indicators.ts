/**
 * Public-health indicators for Medellín from datos.gov.co (Socrata):
 *  - 8u7u-645t  Cobertura anual de vacunación, municipios de Antioquia (Gobernación de Antioquia)
 *  - 4hyg-wa9d  Datos de vigilancia en salud pública — SIVIGILA (Instituto Nacional de Salud)
 * DANE codes in these datasets have no leading zero (Medellín = "5001").
 */

const VACCINATION_URL = 'https://www.datos.gov.co/resource/8u7u-645t.json';
const SIVIGILA_URL = 'https://www.datos.gov.co/resource/4hyg-wa9d.json';

export interface VaccineCoverage {
  vaccine: string;
  population: string;
  target: number;
  vaccinated: number;
  /** vaccinated / target × 100. Can exceed 100 % because Medellín also vaccinates children from nearby towns. */
  coverage: number;
}

export interface Indicators {
  vaccination: { year: number; items: VaccineCoverage[] };
  dengue: Array<{ year: number; cases: number }>;
  topEvents: { year: number; items: Array<{ event: string; cases: number }> };
}

async function soql<T>(base: string, params: Record<string, string>, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(`${base}?${new URLSearchParams(params)}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`datos.gov.co respondió ${response.status}`);
  return (await response.json()) as T;
}

const EVENT_LABELS: Record<string, string> = {
  'VCM VIF VSX': 'Violencia de género e intrafamiliar',
  'INFECCION RESPIRATORIA AGUDA GRAVE IRAG INUSITADA': 'Infección respiratoria aguda grave (IRAG)',
  'AGRESIONES POR ANIMALES POTENCIALMENTE TRANSMISORES DE RABIA': 'Agresiones por animales (riesgo de rabia)',
  'VIH/SIDA/MORTALIDAD POR SIDA': 'VIH / sida',
  'ESI - IRAG (VIGILANCIA CENTINELA)': 'ESI-IRAG (vigilancia centinela)',
  'DESNUTRICIÓN AGUDA EN MENORES DE 5 AÑOS': 'Desnutrición aguda en menores de 5 años',
};

function prettyEvent(raw: string): string {
  if (EVENT_LABELS[raw]) return EVENT_LABELS[raw];
  const lower = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function prettyVaccine(raw: string): string {
  return raw
    .replace(/\s*\(Antigripal\)/i, '')
    .replace(/\(Difteria, Tos ferina, Tétanos\)/i, '(difteria, tos ferina, tétanos)')
    .replace(/\(Sarampión Rubeola Parotiditis - SRP\)/i, '(sarampión, rubéola, paperas)')
    .trim();
}

export async function fetchIndicators(fetchImpl: typeof fetch = fetch): Promise<Indicators> {
  const [vaccYearRow] = await soql<Array<{ max_a_o: string }>>(
    VACCINATION_URL,
    { $select: 'max(a_o)', $where: "codigomunicipio='5001'" },
    fetchImpl,
  );
  const vaccYear = Number(vaccYearRow.max_a_o);

  const [vaccRows, dengueRows, [eventYearRow]] = await Promise.all([
    soql<Array<{ tipopoblacionobjetivo: string; numeropoblacionobjetivo: string; nombrevacuna: string; numerovacunados: string }>>(
      VACCINATION_URL,
      {
        $select: 'tipopoblacionobjetivo,numeropoblacionobjetivo,nombrevacuna,numerovacunados',
        $where: `codigomunicipio='5001' AND a_o='${vaccYear}'`,
        $limit: '200',
      },
      fetchImpl,
    ),
    soql<Array<{ ano: string; sum_conteo: string }>>(
      SIVIGILA_URL,
      { $select: 'ano,sum(conteo)', $where: "cod_mun_o='5001' AND nombre_evento='DENGUE'", $group: 'ano', $order: 'ano' },
      fetchImpl,
    ),
    soql<Array<{ max_ano: string }>>(SIVIGILA_URL, { $select: 'max(ano)', $where: "cod_mun_o='5001'" }, fetchImpl),
  ]);

  const eventYear = Number(eventYearRow.max_ano);
  const eventRows = await soql<Array<{ nombre_evento: string; total: string }>>(
    SIVIGILA_URL,
    {
      $select: 'nombre_evento,sum(conteo) as total',
      $where: `cod_mun_o='5001' AND ano='${eventYear}'`,
      $group: 'nombre_evento',
      $order: 'total DESC',
      $limit: '10',
    },
    fetchImpl,
  );

  return {
    vaccination: {
      year: vaccYear,
      items: vaccRows
        .map((row) => {
          const target = Number(row.numeropoblacionobjetivo);
          const vaccinated = Number(row.numerovacunados);
          return {
            vaccine: prettyVaccine(row.nombrevacuna),
            population: row.tipopoblacionobjetivo,
            target,
            vaccinated,
            coverage: target > 0 ? Math.round((vaccinated / target) * 1000) / 10 : 0,
          };
        })
        .filter((item) => item.target > 0),
    },
    dengue: dengueRows.map((row) => ({ year: Number(row.ano), cases: Number(row.sum_conteo) })),
    topEvents: {
      year: eventYear,
      items: eventRows.map((row) => ({ event: prettyEvent(row.nombre_evento), cases: Number(row.total) })),
    },
  };
}
