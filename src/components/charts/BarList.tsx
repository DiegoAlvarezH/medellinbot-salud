import { cn } from '@/lib/utils';

export interface BarListItem {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  display: string;
}

interface BarListProps {
  items: BarListItem[];
  /** Value that maps to a full-width bar. Defaults to the largest item. */
  max?: number;
  /** Optional marker (e.g. a 95 % target) drawn on every track. */
  target?: { value: number; label: string };
  className?: string;
}

/** Horizontal single-series bars with the value as a direct label (readable without hover). */
export function BarList({ items, max, target, className }: BarListProps) {
  const scale = max ?? Math.max(...items.map((i) => i.value), target?.value ?? 0, 1);
  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((item) => {
        const width = Math.min(100, (item.value / scale) * 100);
        return (
          <li key={item.key} title={`${item.label}: ${item.display}`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate text-label">
                {item.label}
                {item.sublabel && <span className="text-label-tertiary"> · {item.sublabel}</span>}
              </span>
              <span className="shrink-0 font-semibold text-label tabular-nums">{item.display}</span>
            </div>
            <div className="relative h-2 rounded-full bg-fill">
              <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
              {target && (
                <span
                  className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-label-secondary"
                  style={{ left: `${Math.min(100, (target.value / scale) * 100)}%` }}
                  aria-hidden="true"
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
