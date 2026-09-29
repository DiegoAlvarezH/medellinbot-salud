'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { toneDot } from '@/components/environment/AqiIndicator';
import { aqiCategory, icaFromPm25 } from '@/lib/air-quality';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AirStation } from '@/types';

const TONE_COLOR: Record<string, string> = {
  green: 'var(--green)',
  yellow: 'var(--yellow)',
  orange: 'var(--orange)',
  red: 'var(--red)',
  purple: 'var(--purple)',
};

interface Series {
  station: string;
  points: Array<{ time: string; pm25: number | null }>;
}

const hourFormatter = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: 'numeric' });

export function StationExplorer({ stations }: { stations: AirStation[] }) {
  const [selected, setSelected] = useState<string | null>(stations[0]?.id ?? null);
  const [series, setSeries] = useState<Series | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the fetch started below
    setState('loading');
    fetch(`/api/air/series/${selected}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Series) => {
        setSeries(data);
        setState('idle');
      })
      .catch((e: Error) => e.name !== 'AbortError' && setState('error'));
    return () => controller.abort();
  }, [selected]);

  const current = stations.find((s) => s.id === selected);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <ul className="scrollbar-thin max-h-[520px] overflow-y-auto rounded-card bg-bg-elevated shadow-card">
        {stations.map((station) => {
          const category = station.ica !== null ? aqiCategory(station.ica) : null;
          return (
            <li key={station.id} className="border-b border-separator last:border-0">
              <button
                type="button"
                onClick={() => setSelected(station.id)}
                aria-pressed={station.id === selected}
                className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors', station.id === selected ? 'bg-accent-soft' : 'hover:bg-fill')}
              >
                <span className={cn('size-2.5 shrink-0 rounded-full', category ? toneDot(category.tone) : 'bg-label-tertiary')} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{station.name}</span>
                  <span className="block text-[12px] text-label-secondary">
                    {station.municipality} · {category?.label ?? 'Sin dato'}
                  </span>
                </span>
                <span className="text-[17px] font-semibold tabular-nums">{station.ica ?? '—'}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="rounded-card bg-bg-elevated p-5 shadow-card">
        <p className="text-[13px] text-label-secondary">PM2.5 hora a hora · últimas 72 horas</p>
        <h3 className="mt-0.5 text-[21px] font-semibold tracking-[-0.015em]">{current?.name ?? 'Selecciona una estación'}</h3>
        {current?.updatedAt && <p className="text-[12px] text-label-tertiary">Promedio 24 h hasta {formatDateTime(current.updatedAt)}</p>}
        <div className="mt-5 min-h-[240px]">
          {state === 'loading' && (
            <p className="flex items-center gap-2 text-[15px] text-label-secondary">
              <Loader2 className="size-4 animate-spin" /> Consultando SIATA…
            </p>
          )}
          {state === 'error' && <p className="text-[15px] text-label-secondary">SIATA no respondió. Intenta de nuevo más tarde.</p>}
          {state === 'idle' && series && (
            <ColumnChart
              ariaLabel={`Concentración horaria de PM2.5 en ${series.station}, últimas 72 horas`}
              height={240}
              unit="µg/m³"
              reference={{ value: 37, label: 'Límite "aceptable"' }}
              data={series.points.map((p, i) => {
                const category = p.pm25 !== null ? aqiCategory(icaFromPm25(p.pm25)) : null;
                const date = new Date(p.time);
                return {
                  key: p.time,
                  label: i % 12 === 0 ? hourFormatter.format(date) : '',
                  title: formatDateTime(p.time),
                  value: p.pm25,
                  detail: category ? `Calidad ${category.label.toLowerCase()}` : undefined,
                  color: category ? TONE_COLOR[category.tone] : undefined,
                };
              })}
            />
          )}
        </div>
        <p className="mt-3 text-[12px] text-label-tertiary">
          Cada barra es una hora; el color indica la categoría del ICA para esa concentración. Fuente: SIATA · Área Metropolitana del Valle de Aburrá.
        </p>
      </div>
    </div>
  );
}
