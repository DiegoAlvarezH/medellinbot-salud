import type { Metadata } from 'next';
import { BarList } from '@/components/charts/BarList';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { PageHero, SectionHeader, SourceNote } from '@/components/ui/section';
import { getIndicators, getProviderStats } from '@/lib/server/indicators';
import { formatDateTime, formatNumber } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Indicadores de salud pública',
  description: 'Vacunación, dengue, mortalidad evitable, calidad del agua, EPS y red de prestadores de Medellín, con datos abiertos oficiales.',
};

export const revalidate = 86400;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-card bg-bg-elevated p-5 shadow-card">
      <p className="text-[34px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
      <p className="mt-2 text-[13px] text-label-secondary">{label}</p>
    </div>
  );
}

export default async function IndicatorsPage() {
  const [indicatorsResult, providersResult] = await Promise.allSettled([getIndicators(), getProviderStats()]);
  const indicators = indicatorsResult.status === 'fulfilled' ? indicatorsResult.value : null;
  const providers = providersResult.status === 'fulfilled' ? providersResult.value : null;

  const infant = indicators?.vaccination.items.filter((v) => v.population === 'menores de 1 año') ?? [];
  const oneYear = indicators?.vaccination.items.filter((v) => v.population === 'un año') ?? [];
  const coverageItems = (items: typeof infant) =>
    items
      .slice()
      .sort((a, b) => a.coverage - b.coverage)
      .map((v) => ({ key: v.vaccine, label: v.vaccine, value: Math.min(v.coverage, 120), display: `${formatNumber(v.coverage, 1)} %` }));

  return (
    <>
      <PageHero
        eyebrow="Indicadores"
        title="La salud de Medellín, en datos."
        description="Cifras publicadas por el Ministerio de Salud, el Instituto Nacional de Salud y la Gobernación de Antioquia en Datos Abiertos Colombia."
      />

      {providers && (
        <section className="container-page pb-14">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat value={formatNumber(providers.medellin.total)} label="Sedes de IPS habilitadas en Medellín" />
            <Stat value={formatNumber(providers.medellin.public)} label="Sedes públicas (ESE)" />
            <Stat value={formatNumber(providers.medellin.private)} label="Sedes privadas" />
            <Stat
              value={formatNumber(providers.byMunicipality.reduce((sum, m) => sum + m.total, 0))}
              label="Sedes de IPS en el Valle de Aburrá"
            />
          </div>
          <SourceNote className="mt-3">REPS · Ministerio de Salud (datos.gov.co c36g-9fc2). Solo Instituciones Prestadoras de Servicios de Salud.</SourceNote>
        </section>
      )}

      {indicators && (
        <>
          <section className="bg-bg-secondary py-14 sm:py-20">
            <div className="container-page">
              <SectionHeader
                eyebrow={`Vacunación ${indicators.vaccination.year}`}
                title="Cobertura del esquema infantil."
                description="Porcentaje de la población objetivo vacunada en Medellín. La meta nacional es 95 % (marca vertical). Puede superar el 100 % porque la ciudad también vacuna a niños de municipios vecinos."
                className="mb-8"
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-card bg-bg-elevated p-5 shadow-card">
                  <h3 className="mb-4 text-[17px] font-semibold">Menores de 1 año</h3>
                  <BarList items={coverageItems(infant)} max={120} target={{ value: 95, label: 'Meta 95 %' }} />
                </div>
                <div className="rounded-card bg-bg-elevated p-5 shadow-card">
                  <h3 className="mb-4 text-[17px] font-semibold">Niños de 1 año</h3>
                  <BarList items={coverageItems(oneYear)} max={120} target={{ value: 95, label: 'Meta 95 %' }} />
                </div>
              </div>
              <SourceNote className="mt-3">
                Gobernación de Antioquia · Consolidado de cobertura anual de vacunación (datos.gov.co 8u7u-645t).
              </SourceNote>
            </div>
          </section>

          <section className="py-14 sm:py-20">
            <div className="container-page grid gap-10 lg:grid-cols-2">
              <div>
                <SectionHeader
                  eyebrow="Vigilancia epidemiológica"
                  title="Dengue por año."
                  description="Casos notificados al SIVIGILA en Medellín. Los picos de 2010 y 2016 fueron epidemias."
                  className="mb-6"
                />
                <div className="rounded-card bg-bg-elevated p-5 shadow-card">
                  <ColumnChart
                    ariaLabel="Casos de dengue notificados en Medellín por año"
                    height={240}
                    data={indicators.dengue.map((d, i, all) => ({
                      key: String(d.year),
                      label: i % 3 === 0 || i === all.length - 1 ? String(d.year) : '',
                      title: String(d.year),
                      value: d.cases,
                      detail: 'casos notificados',
                    }))}
                  />
                </div>
              </div>
              <div>
                <SectionHeader
                  eyebrow={`Eventos ${indicators.topEvents.year}`}
                  title="Lo más notificado."
                  description="Eventos de interés en salud pública con más casos en Medellín en el último año publicado."
                  className="mb-6"
                />
                <div className="rounded-card bg-bg-elevated p-5 shadow-card">
                  <BarList
                    items={indicators.topEvents.items.map((e) => ({
                      key: e.event,
                      label: e.event,
                      value: e.cases,
                      display: formatNumber(e.cases),
                    }))}
                  />
                </div>
              </div>
            </div>
            <div className="container-page">
              <SourceNote className="mt-4">
                Instituto Nacional de Salud · Datos de vigilancia en salud pública (datos.gov.co 4hyg-wa9d). El INS publica con rezago: el último año
                disponible es {indicators.topEvents.year}. Consultado: {formatDateTime(indicators.generatedAt)}
              </SourceNote>
            </div>
          </section>
        </>
      )}

      {indicators && indicators.mortality.length > 0 && (
        <section className="bg-bg-secondary py-14 sm:py-20">
          <div className="container-page">
            <SectionHeader
              eyebrow="Mortalidad evitable"
              title="Vidas que se pueden salvar."
              description="Muertes registradas en Medellín por causas que la salud pública puede prevenir. Si tú o alguien cercano está en crisis, llama a la Línea Amiga 604 444 44 48 o al 106."
              className="mb-8"
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {indicators.mortality.map((series) => {
                const last = series.points[series.points.length - 1];
                return (
                  <div key={series.cause} className="rounded-card bg-bg-elevated p-5 shadow-card">
                    <h3 className="text-[15px] font-semibold">{series.label}</h3>
                    <p className="mt-2 text-[34px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                      {formatNumber(last.cases)}
                      <span className="ml-2 text-[13px] font-normal tracking-normal text-label-secondary">en {last.year}</span>
                    </p>
                    <div className="mt-4">
                      <ColumnChart
                        ariaLabel={`${series.label} en Medellín por año`}
                        height={140}
                        data={series.points.map((point, i, all) => ({
                          key: String(point.year),
                          label: i === 0 || i === all.length - 1 ? String(point.year) : '',
                          title: String(point.year),
                          value: point.cases,
                          detail: 'casos',
                        }))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <SourceNote className="mt-4">
              Gobernación de Antioquia · series anuales de mortalidad por suicidio (db67-sbus), materna (22wy-39ih) y por desnutrición en menores de 5
              años (xvyx-dzp4).
            </SourceNote>
          </div>
        </section>
      )}

      {indicators && (indicators.water || indicators.eps) && (
        <section className="py-14 sm:py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            {indicators.water && (
              <div>
                <SectionHeader eyebrow={`Agua potable ${indicators.water.year}`} title="¿Se puede tomar agua de la llave?" className="mb-6" />
                <div className="rounded-tile bg-bg-elevated p-6 shadow-card">
                  <p className="text-[13px] text-label-secondary">Índice de riesgo de la calidad del agua (IRCA)</p>
                  <p className="mt-2 text-[56px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
                    {formatNumber(indicators.water.irca, 1)}
                  </p>
                  <p className={`mt-2 text-[21px] font-semibold ${indicators.water.irca <= 5 ? 'text-green' : indicators.water.irca <= 14 ? 'text-yellow' : 'text-red'}`}>
                    {indicators.water.risk}
                  </p>
                  <p className="mt-2 text-[15px] text-label-secondary">
                    {indicators.water.irca <= 5
                      ? 'El agua del acueducto de Medellín es apta para el consumo humano.'
                      : 'Hierve el agua antes de tomarla y consulta a tu empresa de acueducto.'}
                    {indicators.water.rural !== null && indicators.water.urban !== null && (
                      <> Zona urbana {formatNumber(indicators.water.urban, 1)} · rural {formatNumber(indicators.water.rural, 1)}.</>
                    )}
                  </p>
                  <p className="mt-3 text-[12px] text-label-tertiary">0–5 sin riesgo · 5,1–14 bajo · 14,1–35 medio · 35,1–80 alto · más de 80 inviable.</p>
                </div>
                <SourceNote className="mt-3">INS · SIVICAP, IRCA por municipio (datos.gov.co nxt2-39c3).</SourceNote>
              </div>
            )}
            {indicators.eps && (
              <div>
                <SectionHeader eyebrow="Aseguramiento" title="¿Quién atiende a Medellín?" className="mb-6" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ['Régimen contributivo', indicators.eps.contributivo],
                      ['Régimen subsidiado', indicators.eps.subsidiado],
                    ] as const
                  ).map(([label, items]) => (
                    <div key={label} className="rounded-card bg-bg-elevated p-5 shadow-card">
                      <h3 className="mb-4 text-[15px] font-semibold">{label}</h3>
                      <BarList
                        items={items.slice(0, 6).map((item) => ({
                          key: item.eps,
                          label: item.eps,
                          value: item.affiliates,
                          display: formatNumber(item.affiliates),
                        }))}
                      />
                    </div>
                  ))}
                </div>
                <SourceNote className="mt-3">
                  ADRES · Base de Datos Única de Afiliados, afiliados activos en Medellín (datos.gov.co tq4m-hmg2 y d7a5-cnra).
                </SourceNote>
              </div>
            )}
          </div>
        </section>
      )}

      {providers && (
        <section className="bg-bg-secondary py-14 sm:py-20">
          <div className="container-page">
            <SectionHeader eyebrow="Red de prestadores" title="IPS por municipio." className="mb-8" />
            <div className="rounded-card bg-bg-elevated p-5 shadow-card">
              <BarList
                items={providers.byMunicipality.map((m) => ({
                  key: m.municipality,
                  label: m.municipality,
                  sublabel: `${m.public} públicas`,
                  value: m.total,
                  display: formatNumber(m.total),
                }))}
              />
            </div>
          </div>
        </section>
      )}

      {!indicators && !providers && (
        <section className="container-page pb-20">
          <p className="rounded-card bg-bg-secondary p-6 text-[17px] text-label-secondary">No pudimos cargar los indicadores. Intenta más tarde.</p>
        </section>
      )}
    </>
  );
}
