import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/config/navigation';
import { SITE } from '@/lib/config/site';

const SOURCES = [
  { href: 'https://www.datos.gov.co', label: 'Datos Abiertos Colombia' },
  { href: 'https://medata.gov.co', label: 'MEData · Alcaldía de Medellín' },
  { href: 'https://siata.gov.co', label: 'SIATA · Área Metropolitana' },
  { href: 'https://open-meteo.com', label: 'Open-Meteo' },
  { href: 'https://www.openstreetmap.org/copyright', label: 'OpenStreetMap' },
];

export function Footer() {
  return (
    <footer className="border-t border-separator bg-bg-secondary text-[12px] text-label-secondary">
      <div className="container-page py-8">
        <p className="border-b border-separator pb-4 leading-relaxed">
          MedellínBot Salud ofrece información general de salud pública y{' '}
          <strong className="font-semibold">no reemplaza la consulta médica</strong>. Ante una emergencia llama al{' '}
          <a href="tel:123" className="font-semibold text-red">
            123
          </a>
          . Los datos provienen de fuentes abiertas oficiales y pueden tener retrasos; verifica siempre con la institución.
        </p>

        <div className="grid gap-6 py-6 sm:grid-cols-3">
          <div>
            <h2 className="mb-2 text-[12px] font-semibold text-label">Explorar</h2>
            <ul className="space-y-1.5">
              <li>
                <Link href="/emergencias" className="hover:text-label hover:underline">
                  Emergencias
                </Link>
              </li>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-label hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 text-[12px] font-semibold text-label">Fuentes de datos</h2>
            <ul className="space-y-1.5">
              {SOURCES.map((source) => (
                <li key={source.href}>
                  <a href={source.href} target="_blank" rel="noreferrer" className="hover:text-label hover:underline">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 text-[12px] font-semibold text-label">Proyecto</h2>
            <p className="leading-relaxed">
              Desarrollado por <span className="font-medium text-label">{SITE.author}</span>. Proyecto académico de la {SITE.institution}.
            </p>
            <ul className="mt-1.5 space-y-1.5">
              <li>
                <a href={`mailto:${SITE.email}`} className="text-link hover:underline">
                  {SITE.email}
                </a>
              </li>
              <li>
                <a href={SITE.website} target="_blank" rel="noreferrer" className="text-link hover:underline">
                  {SITE.websiteLabel}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="border-t border-separator pt-4">
          © {new Date().getFullYear()} {SITE.name} · {SITE.author}
        </p>
      </div>
    </footer>
  );
}
