'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, BadgeCheck, FileText, Loader2, Pill, Search, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SourceNote } from '@/components/ui/section';
import type { MedicineSearch as Result } from '@/lib/sources/medicines';

const EXAMPLES = ['Acetaminofén', 'Ibuprofeno', 'Losartán', 'Metformina', 'Amoxicilina', 'Loratadina'];
const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function MedicineSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [value, setValue] = useState(initial);
  const [result, setResult] = useState<Result | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  const run = useCallback(async (term: string) => {
    if (!term.trim()) return;
    setState('loading');
    try {
      const response = await fetch(`/api/medicines?q=${encodeURIComponent(term.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Error');
      setResult(data as Result);
      setState('idle');
    } catch (e) {
      setError((e as Error).message);
      setState('error');
    }
  }, []);

  useEffect(() => {
    // Deep links (?q=…) run the search on arrival.
    if (initial) void run(initial);
  }, [initial, run]);

  const submit = (term: string) => {
    setValue(term);
    router.replace(`/medicamentos?q=${encodeURIComponent(term)}`, { scroll: false });
    void run(term);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(value);
  };

  const otc = result && result.otc.length > 0;

  return (
    <div>
      <form onSubmit={onSubmit} className="glow-ring rounded-full">
        <div className="glow-surface relative flex items-center gap-2 rounded-full p-1.5 pl-5 shadow-float">
          <Search className="size-5 shrink-0 text-label-tertiary" aria-hidden="true" />
          <label htmlFor="medicine" className="sr-only">
            Medicamento o principio activo
          </label>
          <input
            id="medicine"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nombre comercial o principio activo"
            className="h-12 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-label-tertiary"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button
            type="submit"
            disabled={value.trim().length < 4 || state === 'loading'}
            className="h-12 shrink-0 rounded-full bg-accent px-6 text-[15px] font-medium text-white transition-opacity disabled:opacity-30"
          >
            {state === 'loading' ? <Loader2 className="size-5 animate-spin" aria-label="Buscando" /> : 'Consultar'}
          </button>
        </div>
      </form>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => submit(example)}
            className="shrink-0 rounded-full bg-fill px-3.5 py-1.5 text-[13px] text-label-secondary hover:bg-fill-strong hover:text-label"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="mt-10" aria-live="polite">
        {state === 'error' && <p className="rounded-card bg-orange-soft p-4 text-[15px] text-orange">{error}</p>}

        {result && state !== 'error' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-tile bg-bg-elevated p-6 shadow-card">
                <p className="flex items-center gap-2 text-[13px] font-medium text-label-secondary">
                  <FileText className="size-4" aria-hidden="true" /> ¿Se vende sin fórmula?
                </p>
                {otc ? (
                  <>
                    <p className="mt-3 flex items-center gap-2 text-[24px] font-semibold tracking-[-0.02em] text-green">
                      <BadgeCheck className="size-6" aria-hidden="true" /> Venta libre
                    </p>
                    <ul className="mt-3 space-y-1.5 text-[14px] text-label-secondary">
                      {result.otc.slice(0, 4).map((entry, i) => (
                        <li key={i}>
                          <span className="text-label">{entry.ingredient}</span>
                          {entry.concentration ? ` · ${entry.concentration}` : ''}
                          {entry.form ? ` · ${entry.form}` : ''}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="mt-3 flex items-center gap-2 text-[24px] font-semibold tracking-[-0.02em] text-orange">
                      <AlertTriangle className="size-6" aria-hidden="true" /> Probablemente con fórmula
                    </p>
                    <p className="mt-2 text-[14px] text-label-secondary">
                      No aparece en el listado de venta libre del INVIMA. Pregunta en la farmacia o a tu médico.
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-tile bg-bg-elevated p-6 shadow-card">
                <p className="flex items-center gap-2 text-[13px] font-medium text-label-secondary">
                  <ShieldCheck className="size-4" aria-hidden="true" /> Precio máximo regulado
                </p>
                {result.prices.length ? (
                  <ul className="mt-3 space-y-3">
                    {result.prices.slice(0, 4).map((price) => (
                      <li key={price.cum} className="text-[14px]">
                        <p className="line-clamp-2 text-label">{price.medicine}</p>
                        <p className="text-label-secondary">
                          {price.commercial !== null && (
                            <>
                              En farmacia: <strong className="font-semibold text-label">{cop.format(price.commercial)}</strong>
                              {' · '}
                            </>
                          )}
                          {price.institutional !== null && <>Institucional: {cop.format(price.institutional)}</>}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[15px] text-label-secondary">
                    No tiene precio máximo fijado por el Gobierno: el precio es libre y puede variar entre farmacias.
                  </p>
                )}
                {result.prices[0] && <SourceNote className="mt-3">{result.prices[0].circular} · vigente desde {result.prices[0].since}</SourceNote>}
              </div>
            </div>

            <div className="rounded-tile bg-bg-elevated p-6 shadow-card">
              <p className="flex items-center gap-2 text-[13px] font-medium text-label-secondary">
                <Pill className="size-4" aria-hidden="true" /> Registros sanitarios INVIMA vigentes
              </p>
              {result.products.length ? (
                <ul className="mt-3 divide-y divide-separator">
                  {result.products.map((product) => (
                    <li key={`${product.file}-${product.registration}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium text-label">{product.product}</p>
                        <p className="text-[13px] text-label-secondary">
                          {product.holder} · {product.form.toLowerCase()} · vía {product.route.toLowerCase()}
                        </p>
                      </div>
                      <Badge tone={product.status === 'Vigente' ? 'green' : 'orange'} className="w-fit shrink-0">
                        {product.registration}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[15px] text-label-secondary">
                  No encontramos registros activos con ese nombre. Revisa la ortografía o busca por el principio activo.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
