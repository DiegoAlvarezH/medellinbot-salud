import type { Metadata } from 'next';
import { Globe, Mail } from 'lucide-react';
import { PageHero, SectionHeader } from '@/components/ui/section';
import { SITE } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Acerca',
  description: 'Fuentes de datos, metodología, privacidad y aviso legal de MedellínBot Salud.',
};

const SOURCES = [
  {
    name: 'REPS · Ministerio de Salud',
    detail: 'Registro Especial de Prestadores y Sedes de Servicios de Salud, en Datos Abiertos Colombia (c36g-9fc2).',
    use: 'Nombres oficiales, teléfonos y naturaleza pública o privada de 1 549 sedes de IPS del Valle de Aburrá.',
    href: 'https://www.datos.gov.co/d/c36g-9fc2',
  },
  {
    name: 'MEData · Alcaldía de Medellín',
    detail: 'Centros de atención de Metrosalud (1-048-22-000400).',
    use: 'Ubicación de las unidades hospitalarias y centros de salud de la red pública.',
    href: 'https://medata.gov.co',
  },
  {
    name: 'SIATA · Área Metropolitana',
    detail: 'Red de monitoreo de calidad del aire del Valle de Aburrá.',
    use: 'ICA y PM2.5 medidos por estación, cada hora.',
    href: 'https://siata.gov.co',
  },
  {
    name: 'Instituto Nacional de Salud',
    detail: 'Datos de vigilancia en salud pública — SIVIGILA (4hyg-wa9d).',
    use: 'Casos de dengue y eventos de interés en salud pública.',
    href: 'https://www.datos.gov.co/d/4hyg-wa9d',
  },
  {
    name: 'Gobernación de Antioquia',
    detail: 'Cobertura anual de vacunación por municipio (8u7u-645t).',
    use: 'Cobertura del esquema infantil en Medellín.',
    href: 'https://www.datos.gov.co/d/8u7u-645t',
  },
  {
    name: 'Ministerio de Salud · PAI',
    detail: 'Esquema nacional de vacunación, actualización julio 2026.',
    use: 'Vacunas por edad y para gestantes.',
    href: 'https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/ET/afiche-esquema-vacunacion-col-2026.pdf',
  },
  {
    name: 'OpenStreetMap',
    detail: 'Mapa colaborativo (ODbL), vía Overpass API.',
    use: 'Ubicación de hospitales, clínicas, farmacias y estaciones del Metro.',
    href: 'https://www.openstreetmap.org/copyright',
  },
  {
    name: 'Open-Meteo',
    detail: 'Pronóstico meteorológico y modelo CAMS de calidad del aire (CC BY 4.0).',
    use: 'Temperatura, lluvia, índice UV y contaminantes estimados.',
    href: 'https://open-meteo.com',
  },
];

const FAQ = [
  {
    q: '¿Es gratis?',
    a: 'Sí. No necesitas registrarte y no hay publicidad.',
  },
  {
    q: '¿Qué pasa con mis datos?',
    a: 'Tus conversaciones se guardan solo en tu navegador y puedes borrarlas cuando quieras. Tu ubicación solo se usa si activas el botón, para ordenar resultados por cercanía, y no se almacena. Para responder, tu pregunta se envía al modelo de lenguaje de OpenAI junto con los datos públicos consultados.',
  },
  {
    q: '¿Qué tan actualizada está la información?',
    a: 'La calidad del aire y el clima se consultan en vivo (se actualizan cada 15 a 30 minutos). La red de salud se sincroniza con las fuentes oficiales al menos una vez por semana. Los indicadores epidemiológicos dependen de lo que publica cada entidad, que suele tener meses o años de rezago.',
  },
  {
    q: '¿Puedo confiar en las respuestas del asistente?',
    a: 'El asistente solo usa los datos que consultamos para darte nombres, direcciones o teléfonos, y cita la fuente. Aun así puede equivocarse: confirma con la institución antes de desplazarte y nunca lo uses como diagnóstico.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Acerca"
        title="Información pública de salud, al alcance de todos."
        description="MedellínBot Salud reúne en un solo lugar los datos abiertos que ya publican las entidades oficiales y los hace fáciles de consultar, desde cualquier celular."
      />

      <section className="bg-bg-secondary py-14 sm:py-20">
        <div className="container-page">
          <SectionHeader eyebrow="Metodología" title="De dónde vienen los datos." className="mb-8" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {SOURCES.map((source) => (
              <li key={source.name}>
                <a href={source.href} target="_blank" rel="noreferrer" className="block h-full rounded-card bg-bg-elevated p-5 shadow-card transition-transform hover:scale-[1.01]">
                  <p className="text-[17px] font-semibold">{source.name}</p>
                  <p className="mt-1 text-[14px] text-label-secondary">{source.detail}</p>
                  <p className="mt-3 text-[13px] text-label">
                    <span className="text-label-tertiary">Uso: </span>
                    {source.use}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeader eyebrow="Preguntas frecuentes" title="Lo que suelen preguntarnos." />
          <div className="divide-y divide-separator rounded-card bg-bg-secondary">
            {FAQ.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                  {item.q}
                  <span className="text-[21px] font-normal text-label-tertiary transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-label-secondary">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg-secondary py-14 sm:py-20">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <div className="rounded-tile bg-bg-elevated p-6 shadow-card sm:p-8">
            <p className="eyebrow mb-2">Aviso médico y legal</p>
            <p className="text-[17px] leading-relaxed text-label-secondary">
              MedellínBot Salud es un servicio informativo. <strong className="font-semibold text-label">No ofrece diagnósticos, tratamientos ni
              reemplaza la consulta con profesionales de la salud.</strong> Ante una emergencia llama al{' '}
              <a href="tel:123" className="font-semibold text-red">
                123
              </a>
              . Los datos provienen de terceros y pueden contener errores u omisiones.
            </p>
          </div>
          <div className="rounded-tile bg-bg-elevated p-6 shadow-card sm:p-8">
            <p className="eyebrow mb-2">Autor</p>
            <p className="text-[21px] font-semibold tracking-[-0.015em] text-label">{SITE.author}</p>
            <p className="mt-1 text-[17px] leading-relaxed text-label-secondary">
              Proyecto de investigación de la <strong className="font-semibold text-label">{SITE.institution}</strong> en tecnologías
              aplicadas a la salud pública.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-[15px] font-medium text-white hover:bg-accent-hover"
              >
                <Mail className="size-4" aria-hidden="true" />
                {SITE.email}
              </a>
              <a
                href={SITE.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-fill px-4 text-[15px] font-medium text-label hover:bg-fill-strong"
              >
                <Globe className="size-4" aria-hidden="true" />
                {SITE.websiteLabel}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
