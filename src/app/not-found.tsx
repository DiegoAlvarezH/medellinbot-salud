import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[60dvh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-3">Error 404</p>
      <h1 className="headline">Esta página no existe.</h1>
      <p className="lede mt-4">Puede que el enlace esté roto o que la página se haya movido.</p>
      <Link href="/" className="mt-8 inline-flex items-center text-[17px] text-link hover:underline">
        Volver al inicio <ChevronRight className="size-4" />
      </Link>
    </section>
  );
}
