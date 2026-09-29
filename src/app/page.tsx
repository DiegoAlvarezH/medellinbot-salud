import Link from 'next/link';
import {
  Brain,
  ChevronRight,
  Database,
  HeartPulse,
  MapPinned,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sun,
  Syringe,
  Wind,
} from 'lucide-react';
import { AskBar } from '@/components/home/AskBar';
import { NearbyNow } from '@/components/home/NearbyNow';
import { Aurora } from '@/components/ui/aurora';
import { SectionHeader } from '@/components/ui/section';
import { toneDot, toneText } from '@/components/environment/AqiIndicator';
import { aqiCategory, uvCategory } from '@/lib/air-quality';
import { getAirQuality } from '@/lib/server/environment';
import { getWeather } from '@/lib/server/sources/open-meteo';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export const revalidate = 900;

const FEATURES = [
  {
    href: '/chat',
    icon: MessageCircle,
    tint: 'bg-accent-soft text-accent',
    title: 'Asistente con IA',
    body: 'Pregunta como le hablarías a una persona. Te responde con datos oficiales y te dice a dónde ir.',
  },
  {
    href: '/mapa',
    icon: MapPinned,
    tint: 'bg-green-soft text-green',
    title: 'Mapa de salud',
    body: 'Hospitales, centros de salud y farmacias ordenados por cercanía, con horario y cómo llegar.',
  },
  {
    href: '/aire',
    icon: Wind,
    tint: 'bg-teal-soft text-teal',
    title: 'Aire y clima',
    body: 'Calidad del aire por estación del SIATA, índice UV y qué hacer según tu condición.',
  },
  {
    href: '/vacunacion',
    icon: Syringe,
    tint: 'bg-purple-soft text-purple',
    title: 'Vacunación',
    body: 'El esquema nacional gratuito según tu edad o la de tus hijos, en un solo lugar.',
  },
  {
    href: '/emergencias',
    icon: Brain,
    tint: 'bg-orange-soft text-orange',
    title: 'Líneas de ayuda',
    body: 'Emergencias, salud mental, violencia y protección infantil. Un toque para llamar.',
  },
  {
    href: '/indicadores',
    icon: Database,
    tint: 'bg-yellow-soft text-yellow',
    title: 'Indicadores',
    body: 'Casos de eventos de interés en salud pública en Medellín, directo de datos abiertos.',
  },
];

async function TodayTiles() {
  const [air, weather] = await Promise.allSettled([getAirQuality(), getWeather()]);

  const airValue = air.status === 'fulfilled' ? air.value : null;
  const weatherValue = weather.status === 'fulfilled' ? weather.value : null;
  const airCategory = airValue ? aqiCategory(airValue.ica) : null;
  const uv = weatherValue ? uvCategory(weatherValue.uvMax) : null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Link href="/aire" className="group glass-card rounded-tile p-5 transition-transform hover:-translate-y-0.5">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-label-secondary">
          <Wind className="size-4" aria-hidden="true" /> Calidad del aire
        </p>
        {airValue && airCategory ? (
          <>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-[36px] leading-none font-semibold sm:text-[44px] tracking-[-0.03em] tabular-nums">{airValue.ica}</span>
              <span className="text-[13px] text-label-tertiary">ICA</span>
            </p>
            <p className={cn('mt-1 flex items-center gap-1.5 text-[15px] font-semibold', toneText(airCategory.tone))}>
              <span className={cn('size-2 rounded-full', toneDot(airCategory.tone))} />
              {airCategory.label}
            </p>
            <p className="mt-1 line-clamp-3 text-[12px] text-label-secondary sm:text-[13px]">{airCategory.general}</p>
          </>
        ) : (
          <p className="mt-3 text-[15px] text-label-secondary">No disponible en este momento.</p>
        )}
      </Link>

      <Link href="/aire#uv" className="glass-card rounded-tile p-5 transition-transform hover:-translate-y-0.5">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-label-secondary">
          <Sun className="size-4" aria-hidden="true" /> Índice UV máximo hoy
        </p>
        {weatherValue && uv ? (
          <>
            <p className="mt-3 text-[36px] leading-none font-semibold sm:text-[44px] tracking-[-0.03em] tabular-nums">{weatherValue.uvMax}</p>
            <p className={cn('mt-1 text-[15px] font-semibold', toneText(uv.tone))}>{uv.label}</p>
            <p className="mt-1 line-clamp-3 text-[12px] text-label-secondary sm:text-[13px]">{uv.advice}</p>
          </>
        ) : (
          <p className="mt-3 text-[15px] text-label-secondary">No disponible en este momento.</p>
        )}
      </Link>

      <Link href="/aire#clima" className="glass-card rounded-tile p-5 transition-transform hover:-translate-y-0.5">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-label-secondary">
          <HeartPulse className="size-4" aria-hidden="true" /> Clima ahora
        </p>
        {weatherValue ? (
          <>
            <p className="mt-3 text-[36px] leading-none font-semibold sm:text-[44px] tracking-[-0.03em] tabular-nums">
              {weatherValue.temperature}°
            </p>
            <p className="mt-1 text-[15px] font-semibold">{weatherValue.description}</p>
            <p className="mt-1 line-clamp-3 text-[12px] text-label-secondary sm:text-[13px]">
              Máx. {weatherValue.tempMax}° · Mín. {weatherValue.tempMin}° · Lluvia {weatherValue.rainProbability}%
            </p>
          </>
        ) : (
          <p className="mt-3 text-[15px] text-label-secondary">No disponible en este momento.</p>
        )}
      </Link>

      <a href="tel:123" className="rounded-tile bg-red p-5 text-white shadow-[0_10px_30px_rgba(255,59,48,0.3)] transition-transform hover:-translate-y-0.5">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-white/85">
          <Phone className="size-4" aria-hidden="true" /> Emergencias
        </p>
        <p className="mt-3 text-[36px] leading-none font-semibold sm:text-[44px] tracking-[-0.03em]">123</p>
        <p className="mt-1 text-[15px] font-semibold">Toca para llamar</p>
        <p className="mt-1 text-[13px] text-white/85">Gratis, las 24 horas, desde cualquier teléfono.</p>
      </a>

      <p className="col-span-2 text-[12px] text-label-tertiary lg:col-span-4">
        {[
          airValue && `Aire: ${airValue.source} · ${formatTime(airValue.updatedAt)}`,
          weatherValue && `Clima: Open-Meteo · ${formatTime(weatherValue.updatedAt)}`,
        ]
          .filter(Boolean)
          .join('  ·  ')}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <Aurora />
        <div className="container-page relative flex flex-col items-center pt-16 pb-12 text-center sm:pt-24 sm:pb-16">
          <p className="glass-card mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-label-secondary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-green" />
            </span>
            Datos oficiales de Medellín, en vivo
          </p>
          <h1 className="headline max-w-[15ch]">
            Tu salud en Medellín,{' '}
            <span className="bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent">más clara.</span>
          </h1>
          <p className="lede mt-5 max-w-[34ch] sm:max-w-[44ch]">
            Encuentra dónde atenderte, cómo está el aire que respiras y qué vacunas te tocan. Gratis y sin registro.
          </p>
          <div className="mt-10 w-full">
            <AskBar />
          </div>
        </div>

        <div className="container-page relative pb-16 sm:pb-24">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">Hoy en Medellín</h2>
            <Link href="/aire" className="inline-flex shrink-0 items-center text-[15px] text-link hover:underline">
              Ver detalle <ChevronRight className="size-4" />
            </Link>
          </div>
          <TodayTiles />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page">
          <SectionHeader eyebrow="Cerca de ti" title="Lo más cercano, ahora." className="mb-8" />
          <NearbyNow />
        </div>
      </section>

      <section className="bg-bg-secondary py-16 sm:py-24">
        <div className="container-page">
          <SectionHeader
            title="Todo lo que necesitas. En un solo lugar."
            description="Pensado para cualquier persona: sin registro, sin publicidad y funciona en tu celular."
            className="mb-10"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {FEATURES.map(({ href, icon: Icon, tint, title, body }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col rounded-tile bg-bg-elevated p-4 shadow-card sm:p-6 transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-float"
              >
                <span className={cn('grid size-11 place-items-center rounded-2xl transition-transform group-hover:scale-110', tint)}>
                  <Icon className="size-[22px]" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[17px] leading-snug font-semibold tracking-[-0.015em] sm:mt-5 sm:text-[21px]">{title}</h3>
                <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-label-secondary sm:line-clamp-none sm:text-[15px]">{body}</p>
                <span className="mt-4 hidden items-center text-[15px] text-link sm:inline-flex">
                  Abrir <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden py-16 sm:py-24">
        <Aurora className="opacity-60" />
        <div className="container-page relative grid items-center gap-10 lg:grid-cols-2">
          <SectionHeader
            eyebrow="Transparencia"
            title="Datos abiertos. Verificables."
            description="Cada respuesta se apoya en fuentes públicas: el Registro de Prestadores de Salud (REPS), SIATA, MEData, Datos Abiertos Colombia, Open-Meteo y OpenStreetMap. Siempre te decimos de dónde viene la información."
          />
          <ul className="grid gap-3">
            {[
              { icon: ShieldCheck, title: 'Privado por diseño', body: 'Tu historial se queda en tu dispositivo y tu ubicación nunca se guarda.' },
              { icon: Database, title: 'Fuentes oficiales', body: 'Consultamos directamente las APIs públicas y citamos la fuente y la hora.' },
              { icon: HeartPulse, title: 'Responsable', body: 'No damos diagnósticos. Ante señales de alarma te llevamos al 123.' },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="glass-card flex gap-4 rounded-card p-5">
                <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-[17px] font-semibold">{title}</p>
                  <p className="mt-0.5 text-[15px] text-label-secondary">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
