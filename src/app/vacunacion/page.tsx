import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Info } from 'lucide-react';
import { AgeFinder, ScheduleTimeline } from '@/components/vaccination/AgeFinder';
import { PageHero, SectionHeader, SourceNote } from '@/components/ui/section';
import { PAI_SOURCE_URL, VACCINATION_NOTES } from '@/lib/knowledge/vaccination';

export const metadata: Metadata = {
  title: 'Vacunación',
  description: 'Esquema nacional de vacunación gratuito (PAI) por edad: bebés, niños, adolescentes, gestantes y adultos mayores.',
};

export default function VaccinationPage() {
  return (
    <>
      <PageHero
        eyebrow="Vacunación"
        title="Vacunas gratis, para toda la familia."
        description="El Programa Ampliado de Inmunizaciones (PAI) cubre sin costo las vacunas del esquema nacional. Aquí está, explicado por edad."
      >
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[17px]">
          <Link href="/mapa" className="inline-flex items-center text-link hover:underline">
            Buscar un centro de salud <ChevronRight className="size-4" />
          </Link>
          <Link href="/chat?q=%C2%BFD%C3%B3nde%20puedo%20vacunarme%20en%20Medell%C3%ADn%3F" className="inline-flex items-center text-link hover:underline">
            Preguntar al asistente <ChevronRight className="size-4" />
          </Link>
        </div>
      </PageHero>

      <section className="container-page pb-14">
        <AgeFinder />
      </section>

      <section className="bg-bg-secondary py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeader eyebrow="Esquema completo" title="De recién nacido a adulto mayor." />
            <ul className="mt-8 space-y-3">
              {VACCINATION_NOTES.map((note) => (
                <li key={note} className="flex gap-3 rounded-card bg-bg-elevated p-4 shadow-card">
                  <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span className="text-[15px] text-label-secondary">{note}</span>
                </li>
              ))}
            </ul>
            <SourceNote className="mt-6">
              Fuente:{' '}
              <a href={PAI_SOURCE_URL} target="_blank" rel="noreferrer" className="text-link hover:underline">
                Ministerio de Salud, esquema de vacunación Colombia (actualización julio 2026)
              </a>
              . Confirma siempre con tu IPS vacunadora.
            </SourceNote>
          </div>
          <ScheduleTimeline />
        </div>
      </section>
    </>
  );
}
