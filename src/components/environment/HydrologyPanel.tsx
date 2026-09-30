import { CloudRain, Waves } from 'lucide-react';
import { SourceNote } from '@/components/ui/section';
import { formatDateTime, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Hydrology } from '@/lib/sources/siata-hydrology';

/** Live rain and stream-level summary from SIATA's hydro-meteorological network. */
export function HydrologyPanel({ data }: { data: Hydrology }) {
  const { rain, levels } = data;
  const raining = rain.raining.length;
  const alerts = levels.alert.length;
  const watch = levels.watch.length;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-tile bg-bg-elevated p-6 shadow-card">
        <p className="flex items-center gap-2 text-[13px] font-medium text-label-secondary">
          <CloudRain className="size-4" aria-hidden="true" /> Lluvia en los últimos 15 minutos
        </p>
        <p className="mt-3 text-[36px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
          {raining}
          <span className="ml-2 text-[15px] font-normal tracking-normal text-label-secondary">de {rain.gauges} pluviómetros</span>
        </p>
        <p className="mt-2 text-[15px] text-label-secondary">
          {raining === 0
            ? 'No está lloviendo en el Valle de Aburrá en este momento.'
            : raining < 10
              ? 'Lluvias aisladas. Lleva sombrilla si vas a salir.'
              : 'Lluvias en varias zonas del valle. Precaución en vías y cerca de quebradas.'}
        </p>
        {rain.heaviest.length > 0 && (
          <ul className="mt-4 divide-y divide-separator border-t border-separator">
            {rain.heaviest.map((gauge) => (
              <li key={gauge.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                <span className="min-w-0 truncate">
                  {gauge.name}
                  <span className="text-label-tertiary"> · {gauge.municipality}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{formatNumber(gauge.last15min, 1)} mm</span>
              </li>
            ))}
          </ul>
        )}
        {rain.updatedAt && <SourceNote className="mt-3">SIATA · {formatDateTime(rain.updatedAt)}</SourceNote>}
      </div>

      <div className="rounded-tile bg-bg-elevated p-6 shadow-card">
        <p className="flex items-center gap-2 text-[13px] font-medium text-label-secondary">
          <Waves className="size-4" aria-hidden="true" /> Nivel de quebradas y ríos
        </p>
        <p
          className={cn(
            'mt-3 text-[36px] leading-none font-semibold tracking-[-0.03em] tabular-nums',
            alerts ? 'text-red' : watch ? 'text-orange' : 'text-green',
          )}
        >
          {alerts ? `${alerts} en alerta` : watch ? `${watch} en precaución` : 'Normal'}
        </p>
        <p className="mt-2 text-[15px] text-label-secondary">
          {alerts || watch
            ? 'No cruces quebradas crecidas ni te acerques a sus orillas. Si vives cerca, atiende las alertas del SIATA y del DAGRD, y llama al 123 si hay emergencia.'
            : `Las ${levels.stations} estaciones de nivel del SIATA no reportan crecientes.`}
        </p>
        {[...levels.alert, ...levels.watch].length > 0 && (
          <ul className="mt-4 divide-y divide-separator border-t border-separator">
            {[...levels.alert, ...levels.watch].slice(0, 6).map((station) => (
              <li key={station.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                <span className="min-w-0 truncate">
                  {station.name}
                  <span className="text-label-tertiary"> · {station.municipality}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium',
                    station.status === 'alerta' ? 'bg-red-soft text-red' : 'bg-orange-soft text-orange',
                  )}
                >
                  {station.status === 'alerta' ? 'Alerta' : 'Precaución'}
                </span>
              </li>
            ))}
          </ul>
        )}
        {levels.updatedAt && <SourceNote className="mt-3">SIATA · {formatDateTime(levels.updatedAt)}</SourceNote>}
      </div>
    </div>
  );
}
