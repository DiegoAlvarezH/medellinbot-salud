import type { Metadata } from 'next';
import { Baby, Bike, Droplets, HeartPulse, Sun, Thermometer, Umbrella, Users } from 'lucide-react';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { HydrologyPanel } from '@/components/environment/HydrologyPanel';
import { StationExplorer } from '@/components/environment/StationExplorer';
import { toneDot, toneText } from '@/components/environment/AqiIndicator';
import { PageHero, SectionHeader, SourceNote } from '@/components/ui/section';
import { AQI_SCALE, aqiCategory, uvCategory } from '@/lib/air-quality';
import { getAirQuality, getHydrology } from '@/lib/server/environment';
import { getWeather } from '@/lib/server/sources/open-meteo';
import { formatDateTime, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Aire y clima',
  description: 'Calidad del aire en tiempo real en las estaciones del SIATA, índice UV y recomendaciones de salud para Medellín.',
};

export const revalidate = 900;

const UV_COLOR: Record<string, string> = {
  green: 'var(--green)',
  yellow: 'var(--yellow)',
  orange: 'var(--orange)',
  red: 'var(--red)',
  purple: 'var(--purple)',
};

const hourFormatter = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: 'numeric' });

export default async function AirPage() {
  const [airResult, weatherResult, hydrologyResult] = await Promise.allSettled([getAirQuality(), getWeather(), getHydrology()]);
  const hydrology = hydrologyResult.status === 'fulfilled' ? hydrologyResult.value : null;
  const air = airResult.status === 'fulfilled' ? airResult.value : null;
  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  const category = air ? aqiCategory(air.ica) : null;
  const uv = weather ? uvCategory(weather.uvMax) : null;

  return (
    <>
      <PageHero
        eyebrow="Aire y clima"
        title="El aire que respiras, hoy."
        description="Mediciones reales de la red del SIATA en el Valle de Aburrá, con recomendaciones según quién eres y qué vas a hacer."
      />

      <section className="container-page pb-14">
        {air && category ? (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-tile bg-bg-secondary p-6 sm:p-8">
              <p className="text-[15px] text-label-secondary">Índice de calidad del aire · Medellín</p>
              <p className="mt-2 text-[88px] leading-none font-semibold tracking-[-0.04em] tabular-nums">{air.ica}</p>
              <p className={cn('mt-2 flex items-center gap-2 text-[24px] font-semibold tracking-[-0.015em]', toneText(category.tone))}>
                <span className={cn('size-3 rounded-full', toneDot(category.tone))} aria-hidden="true" />
                {category.label}
              </p>
              <p className="mt-2 max-w-md text-[17px] text-label-secondary">{category.summary}</p>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-separator pt-5">
                {[
                  { term: 'PM2.5', value: air.pm25 },
                  { term: 'PM10', value: air.pm10 },
                  { term: 'Ozono', value: air.ozone },
                ].map(({ term, value }) => (
                  <div key={term}>
                    <dt className="text-[12px] text-label-tertiary">{term}</dt>
                    <dd className="text-[21px] font-semibold tabular-nums">
                      {value === null ? '—' : formatNumber(value, 1)}
                      <span className="ml-1 text-[12px] font-normal text-label-tertiary">µg/m³</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <SourceNote className="mt-4">
                {air.source} · {formatDateTime(air.updatedAt)} · PM10 y ozono estimados por Open-Meteo (CAMS)
              </SourceNote>
            </div>

            <div className="grid gap-4">
              {[
                { icon: Users, title: 'Población general', body: category.general },
                { icon: Baby, title: 'Niños, adultos mayores y gestantes', body: category.sensitive },
                {
                  icon: HeartPulse,
                  title: 'Asma, EPOC o enfermedad cardíaca',
                  body:
                    category.level === 'good'
                      ? 'Sin restricciones. Mantén tu tratamiento habitual.'
                      : 'Ten tu inhalador o medicamentos a mano y consulta si aparecen tos, silbido en el pecho o ahogo.',
                },
                {
                  icon: Bike,
                  title: 'Ejercicio al aire libre',
                  body:
                    category.level === 'good' || category.level === 'acceptable'
                      ? 'Adelante. Prefiere parques y ciclorrutas lejos de vías con alto tráfico.'
                      : 'Mejor en interiores o en horas de menor tráfico, y a menor intensidad.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4 rounded-card bg-bg-elevated p-5 shadow-card">
                  <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <p className="text-[15px] font-semibold">{title}</p>
                    <p className="mt-0.5 text-[15px] text-label-secondary">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-card bg-bg-secondary p-6 text-[17px] text-label-secondary">
            No pudimos consultar la calidad del aire en este momento. Revisa siata.gov.co.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2" aria-label="Escala del ICA">
          {AQI_SCALE.map((step) => (
            <span key={step.label} className="flex items-center gap-1.5 text-[12px] text-label-secondary">
              <span className={cn('size-2 rounded-full', toneDot(step.tone))} aria-hidden="true" />
              {step.label} <span className="text-label-tertiary tabular-nums">{step.range}</span>
            </span>
          ))}
        </div>
      </section>

      {air && air.stations.length > 0 && (
        <section className="bg-bg-secondary py-14 sm:py-20">
          <div className="container-page">
            <SectionHeader
              eyebrow="Por estación"
              title="Cómo está tu zona."
              description={`${air.stations.length} estaciones de monitoreo del SIATA, ordenadas de peor a mejor calidad del aire (promedio de las últimas 24 horas).`}
              className="mb-8"
            />
            <StationExplorer stations={air.stations} />
          </div>
        </section>
      )}

      {hydrology && (
        <section id="lluvia" className="scroll-mt-16 py-14 sm:py-20">
          <div className="container-page">
            <SectionHeader
              eyebrow="Lluvia y quebradas"
              title="¿Está lloviendo?"
              description="Pluviómetros y sensores de nivel del SIATA en tiempo real. Útil para decidir si salir y para estar atento a crecientes."
              className="mb-8"
            />
            <HydrologyPanel data={hydrology} />
          </div>
        </section>
      )}

      {weather && uv && (
        <section id="uv" className="scroll-mt-16 py-14 sm:py-20">
          <div className="container-page">
            <SectionHeader
              eyebrow="Sol y clima"
              title="Protégete del sol."
              description="Por su altitud y cercanía al ecuador, Medellín alcanza índices UV muy altos cerca del mediodía, incluso con el cielo nublado."
              className="mb-8"
            />
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-card bg-bg-elevated p-5 shadow-card">
                <p className="text-[13px] text-label-secondary">Índice UV por hora · hoy</p>
                <p className="mt-0.5 text-[21px] font-semibold">
                  Máximo {weather.uvMax} · <span className={toneText(uv.tone)}>{uv.label}</span>
                </p>
                <div className="mt-5">
                  <ColumnChart
                    ariaLabel="Índice UV por hora para hoy en Medellín"
                    height={200}
                    decimals={1}
                    data={weather.hourlyUv
                      .filter((_, i) => i >= 6 && i <= 18)
                      .map((p, i) => {
                        const cat = uvCategory(p.uv);
                        const date = new Date(`${p.time}:00-05:00`);
                        return {
                          key: p.time,
                          label: i % 2 === 0 ? hourFormatter.format(date) : '',
                          title: hourFormatter.format(date),
                          value: p.uv,
                          detail: cat.label,
                          color: UV_COLOR[cat.tone],
                        };
                      })}
                  />
                </div>
                <p className="mt-3 text-[15px] text-label-secondary">{uv.advice}</p>
              </div>

              <div id="clima" className="grid scroll-mt-16 grid-cols-2 gap-4">
                {[
                  { icon: Thermometer, label: 'Temperatura', value: `${weather.temperature}°`, sub: `Sensación ${weather.apparentTemperature}°` },
                  { icon: Sun, label: 'Cielo', value: weather.description, sub: `Máx. ${weather.tempMax}° · Mín. ${weather.tempMin}°` },
                  { icon: Umbrella, label: 'Lluvia', value: `${weather.rainProbability}%`, sub: 'Probabilidad hoy' },
                  { icon: Droplets, label: 'Humedad', value: `${weather.humidity}%`, sub: 'Relativa' },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="rounded-card bg-bg-secondary p-4">
                    <p className="flex items-center gap-1.5 text-[12px] text-label-secondary">
                      <Icon className="size-3.5" aria-hidden="true" /> {label}
                    </p>
                    <p className="mt-2 text-[21px] leading-tight font-semibold">{value}</p>
                    <p className="text-[12px] text-label-tertiary">{sub}</p>
                  </div>
                ))}
                <SourceNote className="col-span-2">Pronóstico: Open-Meteo · {formatDateTime(weather.updatedAt)}</SourceNote>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
