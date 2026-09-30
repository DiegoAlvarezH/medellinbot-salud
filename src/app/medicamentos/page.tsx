import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MedicineSearch } from '@/components/medicines/MedicineSearch';
import { PageHero, SourceNote } from '@/components/ui/section';

export const metadata: Metadata = {
  title: 'Medicamentos',
  description:
    'Consulta si un medicamento tiene registro sanitario vigente del INVIMA, si es de venta libre y su precio máximo regulado en Colombia.',
};

export default function MedicinesPage() {
  return (
    <>
      <PageHero
        eyebrow="Medicamentos"
        title="Consulta un medicamento."
        description="Verifica en segundos si tiene registro sanitario vigente del INVIMA, si se vende sin fórmula y si el Gobierno le fijó un precio máximo."
      />
      <section className="container-page pb-20">
        <Suspense>
          <MedicineSearch />
        </Suspense>
        <div className="mt-10 rounded-card bg-bg-secondary p-5 text-[14px] leading-relaxed text-label-secondary">
          <strong className="font-semibold text-label">No te automediques.</strong> Esta consulta sirve para verificar un producto, no para
          decidir un tratamiento. Pregunta siempre al químico farmacéutico o a tu médico por la dosis, las interacciones y las
          contraindicaciones. No compres medicamentos sin registro INVIMA ni en canales informales.
        </div>
        <SourceNote className="mt-4">
          Fuentes: INVIMA · Código Único de Medicamentos vigentes (datos.gov.co i7cb-raxc) y listado de venta libre (xzwx-qpja); Ministerio de
          Salud · precios máximos de venta regulados (nauz-qkjw).
        </SourceNote>
      </section>
    </>
  );
}
