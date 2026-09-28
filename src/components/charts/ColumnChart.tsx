'use client';

import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ColumnDatum {
  key: string;
  /** Short axis label; empty string hides the tick. */
  label: string;
  value: number | null;
  /** Tooltip title (defaults to label). */
  title?: string;
  /** Extra tooltip line, e.g. a category name. */
  detail?: string;
  /** CSS color for this column; defaults to the accent. */
  color?: string;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  height?: number;
  /** Serializable formatting (the chart is a client component rendered from server pages). */
  decimals?: number;
  unit?: string;
  ariaLabel: string;
  /** Optional horizontal reference line (e.g. a target). */
  reference?: { value: number; label: string };
  className?: string;
}

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= max / 4) ?? 10;
  return Math.ceil(max / (step * magnitude)) * step * magnitude;
}

/**
 * Minimal single-series column chart: thin columns with rounded tops anchored to the
 * baseline, recessive grid, and a per-column hover/focus tooltip.
 */
export function ColumnChart({ data, height = 220, decimals = 0, unit, ariaLabel, reference, className }: ColumnChartProps) {
  const formatValue = (v: number) =>
    `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: decimals }).format(v)}${unit ? ` ${unit}` : ''}`;
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const values = data.map((d) => d.value ?? 0);
  const max = useMemo(() => niceMax(Math.max(...values, reference?.value ?? 0)), [values, reference?.value]);
  const ticks = [0, max / 2, max];

  const width = 100; // percentage-based x axis
  const slot = width / Math.max(1, data.length);
  const barWidth = Math.max(0.6, Math.min(slot * 0.62, 6));
  const plotTop = 8;
  const plotBottom = height - 24;
  const plotHeight = plotBottom - plotTop;
  const y = (v: number) => plotBottom - (v / max) * plotHeight;

  const current = active !== null ? data[active] : null;

  return (
    <figure className={cn('relative', className)}>
      <span id={titleId} className="sr-only">
        {ariaLabel}
      </span>
      <div className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" role="img" aria-labelledby={titleId}>
          {ticks.map((tick) => (
            <line key={tick} x1={0} x2={width} y1={y(tick)} y2={y(tick)} stroke="var(--separator)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {reference && (
            <line
              x1={0}
              x2={width}
              y1={y(reference.value)}
              y2={y(reference.value)}
              stroke="var(--label-secondary)"
              strokeDasharray="4 4"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {data.map((d, i) => {
            if (d.value === null) return null;
            const x = slot * i + (slot - barWidth) / 2;
            const top = y(d.value);
            const h = Math.max(0, plotBottom - top);
            return (
              <rect
                key={d.key}
                x={x}
                y={top}
                width={barWidth}
                height={h}
                rx={Math.min(barWidth / 2, 1.2)}
                fill={d.color ?? 'var(--accent)'}
                opacity={active === null || active === i ? 1 : 0.45}
              />
            );
          })}
        </svg>

        {/* Y-axis labels, rendered in HTML so they keep their size. */}
        {ticks.slice(1).map((tick) => (
          <span
            key={tick}
            className="pointer-events-none absolute right-0 -translate-y-full pb-0.5 text-[11px] text-label-tertiary tabular-nums"
            style={{ top: y(tick) }}
          >
            {formatValue(tick)}
          </span>
        ))}
        {reference && (
          <span
            className="pointer-events-none absolute left-0 -translate-y-full pb-0.5 text-[11px] font-medium text-label-secondary"
            style={{ top: y(reference.value) }}
          >
            {reference.label}
          </span>
        )}

        {/* Hit targets wider than the marks. */}
        <div className="absolute inset-x-0 top-0 flex" style={{ height: plotBottom }}>
          {data.map((d, i) => (
            <button
              key={d.key}
              type="button"
              className="h-full min-w-0 flex-1 cursor-default outline-none focus-visible:bg-fill"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${d.title ?? d.label}: ${d.value === null ? 'sin dato' : formatValue(d.value)}${d.detail ? `, ${d.detail}` : ''}`}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex" style={{ top: plotBottom + 6 }}>
          {data.map((d) => (
            <span key={d.key} className="flex min-w-0 flex-1 justify-center overflow-visible text-[11px] whitespace-nowrap text-label-tertiary">
              {d.label}
            </span>
          ))}
        </div>

        {current && active !== null && (
          <div
            className="pointer-events-none absolute z-10 min-w-28 -translate-x-1/2 rounded-xl bg-bg-elevated px-3 py-2 text-[12px] shadow-float"
            style={{
              left: `clamp(56px, ${((active + 0.5) / data.length) * 100}%, calc(100% - 56px))`,
              top: Math.max(0, y(current.value ?? 0) - 64),
            }}
          >
            <p className="font-medium text-label-secondary">{current.title ?? current.label}</p>
            <p className="text-[15px] font-semibold text-label tabular-nums">{current.value === null ? 'Sin dato' : formatValue(current.value)}</p>
            {current.detail && <p className="text-label-secondary">{current.detail}</p>}
          </div>
        )}
      </div>
    </figure>
  );
}
