import type { Metadata } from 'next';
import { AlertTriangle, MessageCircle, Phone } from 'lucide-react';
import { PageHero, SectionHeader, SourceNote } from '@/components/ui/section';
import {
  HELP_CATEGORY_LABELS,
  HELP_LINES,
  HELP_LINES_VERIFIED_AT,
  WARNING_SIGNS,
  helpLineHref,
  type HelpLineCategory,
} from '@/lib/knowledge/help-lines';

export const metadata: Metadata = {
  title: 'Emergencias y líneas de ayuda',
  description: 'Líneas de emergencia, salud mental, violencia y citas en Medellín, verificadas en fuentes oficiales. Un toque para llamar.',
};

const ORDER: HelpLineCategory[] = ['salud-mental', 'violencia', 'ninez', 'citas'];

export default function EmergencyPage() {
  return (
    <>
      <PageHero
        eyebrow="Emergencias"
        title="Ayuda, a un toque."
        description="Líneas oficiales y gratuitas para Medellín. Si hay riesgo para la vida, no esperes: llama al 123."
      />

      <section className="container-page pb-14">
        <a
          href="tel:123"
          className="flex flex-col gap-6 rounded-tile bg-red p-6 text-white transition-transform hover:scale-[1.005] sm:flex-row sm:items-center sm:justify-between sm:p-10"
        >
          <div>
            <p className="text-[17px] text-white/85">Línea única de emergencias</p>
            <p className="text-[96px] leading-none font-semibold tracking-[-0.04em]">123</p>
            <p className="mt-2 max-w-md text-[17px] text-white/90">Ambulancias, bomberos y policía. Gratis, las 24 horas, desde cualquier teléfono.</p>
          </div>
          <span className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-[19px] font-semibold text-red">
            <Phone className="size-5" aria-hidden="true" /> Llamar ahora
          </span>
        </a>
      </section>

      <section className="bg-bg-secondary py-14 sm:py-20">
        <div className="container-page">
          <SectionHeader
            eyebrow="¿Urgencias o cita?"
            title="Señales de alarma."
            description="Si notas alguna de estas señales, ve a urgencias o llama al 123. Para síntomas leves y estables, pide una cita prioritaria con tu EPS."
            className="mb-8"
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WARNING_SIGNS.map((sign) => (
              <li key={sign.title} className="rounded-card bg-bg-elevated p-5 shadow-card">
                <AlertTriangle className="size-5 text-orange" aria-hidden="true" />
                <p className="mt-3 text-[17px] font-semibold tracking-[-0.01em]">{sign.title}</p>
                <p className="mt-1 text-[14px] text-label-secondary">{sign.body}</p>
              </li>
            ))}
          </ul>
          <SourceNote className="mt-6">Orientación general, no reemplaza la valoración médica. En urgencias te clasificarán por prioridad (triage).</SourceNote>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page space-y-12">
          {ORDER.map((category) => (
            <div key={category}>
              <h2 className="mb-4 text-[24px] font-semibold tracking-[-0.02em]">{HELP_CATEGORY_LABELS[category]}</h2>
              <ul className="divide-y divide-separator overflow-hidden rounded-card bg-bg-secondary">
                {HELP_LINES.filter((line) => line.category === category).map((line) => (
                  <li key={line.id}>
                    <a href={helpLineHref(line)} className="flex items-center gap-4 p-4 transition-colors hover:bg-fill sm:p-5">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-green text-white">
                        {line.kind === 'whatsapp' ? <MessageCircle className="size-5" aria-hidden="true" /> : <Phone className="size-5" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px] font-semibold">{line.name}</span>
                        <span className="block text-[14px] text-label-secondary">{line.description}</span>
                        <span className="block text-[12px] text-label-tertiary">{line.hours}</span>
                      </span>
                      <span className="shrink-0 text-right text-[17px] font-semibold text-accent tabular-nums">{line.number}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <SourceNote>
            Números verificados en medellin.gov.co, minsalud.gov.co, icbf.gov.co y metrosalud.gov.co el {HELP_LINES_VERIFIED_AT}. Si alguno cambió,
            escríbenos para actualizarlo.
          </SourceNote>
        </div>
      </section>
    </>
  );
}
