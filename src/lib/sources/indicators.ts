/**
 * Public-health indicators for Medellín from datos.gov.co (Socrata):
 *  - 8u7u-645t  Cobertura anual de vacunación, municipios de Antioquia (Gobernación de Antioquia)
 *  - 4hyg-wa9d  Datos de vigilancia en salud pública — SIVIGILA (Instituto Nacional de Salud)
 *  - nxt2-39c3  IRCA — índice de riesgo de la calidad del agua (INS / SIVICAP)
 *  - tq4m-hmg2 / d7a5-cnra  Afiliados por EPS, régimen contributivo / subsidiado (ADRES, BDUA)
 *  - db67-sbus / 22wy-39ih / xvyx-dzp4  Mortalidad por suicidio, materna y por desnutrición en < 5 años (Gobernación)
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

export interface WaterQuality {
  year: number;
  irca: number;
  risk: string;
  urban: number | null;
  rural: number | null;
  history: Array<{ year: number; irca: number }>;
}

export interface EpsShare {
  eps: string;
  affiliates: number;
}

export interface MortalitySeries {
  cause: 'suicidio' | 'materna' | 'desnutricion';
  label: string;
  points: Array<{ year: number; cases: number; population: number | null }>;
}

export interface Indicators {
  vaccination: { year: number; items: VaccineCoverage[] };
  dengue: Array<{ year: number; cases: number }>;
  topEvents: { year: number; items: Array<{ event: string; cases: number }> };
  water: WaterQuality | null;
  eps: { contributivo: EpsShare[]; subsidiado: EpsShare[] } | null;
  mortality: MortalitySeries[];
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

  // Newer datasets: each one degrades to null/[] on failure so a single outage never blanks the page.
  const [water, eps, mortality] = await Promise.all([
    fetchWaterQuality(fetchImpl).catch(() => null),
    fetchEpsAffiliation(fetchImpl).catch(() => null),
    fetchMortality(fetchImpl).catch(() => []),
  ]);

  return {
    water,
    eps,
    mortality,
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

/** Medellín's drinking-water risk index (0 = sin riesgo, > 80 = inviable) for the latest reported years. */
export async function fetchWaterQuality(fetchImpl: typeof fetch = fetch): Promise<WaterQuality | null> {
  const rows = await soql<Array<{ a_o: string; irca: string; nivel_de_riesgo: string; ircaurbano?: string; ircarural?: string }>>(
    'https://www.datos.gov.co/resource/nxt2-39c3.json',
    { $where: "municipiocodigo='05001'", $order: 'a_o DESC', $limit: '12' },
    fetchImpl,
  );
  const numeric = (v?: string) => (v && Number.isFinite(Number(v)) ? Number(v) : null);
  const valid = rows.filter((r) => numeric(r.irca) !== null);
  if (!valid.length) return null;
  const [latest] = valid;
  return {
    year: Number(latest.a_o),
    irca: numeric(latest.irca)!,
    risk: latest.nivel_de_riesgo,
    urban: numeric(latest.ircaurbano),
    rural: numeric(latest.ircarural),
    history: valid
      .map((r) => ({ year: Number(r.a_o), irca: numeric(r.irca)! }))
      .sort((a, b) => a.year - b.year),
  };
}

function prettyEps(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim();
  const known: Array<[RegExp, string]> = [
    [/SURA|SURAMERICANA/i, 'EPS SURA'],
    [/SALUD TOTAL/i, 'Salud Total'],
    [/NUEVA EPS/i, 'Nueva EPS'],
    [/SANITAS/i, 'Sanitas'],
    [/SAVIA/i, 'Savia Salud'],
    [/COOSALUD/i, 'Coosalud'],
    [/COMPENSAR/i, 'Compensar'],
    [/FAMISANAR/i, 'Famisanar'],
    [/MUTUAL/i, 'Mutual Ser'],
    [/SOS\b|SERVICIO OCCIDENTAL/i, 'EPS SOS'],
  ];
  return known.find(([re]) => re.test(name))?.[1] ?? name.charAt(0) + name.slice(1).toLowerCase();
}

async function epsFor(dataset: string, fetchImpl: typeof fetch): Promise<EpsShare[]> {
  const rows = await soql<Array<{ ent_nombre: string; afiliados: string }>>(
    `https://www.datos.gov.co/resource/${dataset}.json`,
    {
      $select: 'ent_nombre,sum(cantidad::number) as afiliados',
      $where: "dpr_nombre='ANTIOQUIA' AND mnc_nombre='MEDELLIN' AND tps_est_afl_nombre='Activo'",
      $group: 'ent_nombre',
      $order: 'afiliados DESC',
      $limit: '8',
    },
    fetchImpl,
  );
  const merged = new Map<string, number>();
  for (const row of rows) {
    const eps = prettyEps(row.ent_nombre);
    merged.set(eps, (merged.get(eps) ?? 0) + Math.round(Number(row.afiliados) || 0));
  }
  return [...merged.entries()].map(([eps, affiliates]) => ({ eps, affiliates })).sort((a, b) => b.affiliates - a.affiliates);
}

/** Active affiliates per EPS in Medellín (current monthly BDUA snapshot, no period column). */
export async function fetchEpsAffiliation(fetchImpl: typeof fetch = fetch): Promise<{ contributivo: EpsShare[]; subsidiado: EpsShare[] }> {
  const [contributivo, subsidiado] = await Promise.all([epsFor('tq4m-hmg2', fetchImpl), epsFor('d7a5-cnra', fetchImpl)]);
  return { contributivo, subsidiado };
}

const MORTALITY: Array<{ cause: MortalitySeries['cause']; label: string; dataset: string; yearField: string }> = [
  { cause: 'suicidio', label: 'Suicidios', dataset: 'db67-sbus', yearField: 'anio' },
  { cause: 'materna', label: 'Muertes maternas', dataset: '22wy-39ih', yearField: 'anio' },
  // This dataset spells the year column without the "i".
  { cause: 'desnutricion', label: 'Muertes por desnutrición en menores de 5 años', dataset: 'xvyx-dzp4', yearField: 'ano' },
];

/** Avoidable-mortality series for Medellín, last 12 years (Gobernación de Antioquia). */
export async function fetchMortality(fetchImpl: typeof fetch = fetch): Promise<MortalitySeries[]> {
  const series = await Promise.all(
    MORTALITY.map(async ({ cause, label, dataset, yearField }) => {
      const rows = await soql<Array<Record<string, string>>>(
        `https://www.datos.gov.co/resource/${dataset}.json`,
        { $where: "codigomunicipio='05001'", $order: `${yearField} DESC`, $limit: '12' },
        fetchImpl,
      );
      const points = rows
        .map((r) => ({
          year: Number(r[yearField]),
          cases: Number(r.numerocasos) || 0,
          population: Number(r.numeropoblacionobjetivo) || null,
        }))
        .filter((p) => Number.isFinite(p.year))
        .sort((a, b) => a.year - b.year);
      return { cause, label, points };
    }),
  );
  return series.filter((s) => s.points.length > 0);
}
