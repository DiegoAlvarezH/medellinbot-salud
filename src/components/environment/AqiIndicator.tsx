import { aqiCategory } from '@/lib/air-quality';
import { cn } from '@/lib/utils';

const DOT: Record<string, string> = {
  green: 'bg-green',
  yellow: 'bg-yellow',
  orange: 'bg-orange',
  red: 'bg-red',
  purple: 'bg-purple',
};

const TEXT: Record<string, string> = {
  green: 'text-green',
  yellow: 'text-yellow',
  orange: 'text-orange',
  red: 'text-red',
  purple: 'text-purple',
};

export function toneDot(tone: string) {
  return DOT[tone] ?? 'bg-label-tertiary';
}

export function toneText(tone: string) {
  return TEXT[tone] ?? 'text-label';
}

/** Compact "● 42 · Buena" indicator. */
export function AqiIndicator({ ica, className }: { ica: number; className?: string }) {
  const category = aqiCategory(ica);
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] font-medium', className)}>
      <span className={cn('size-2 rounded-full', toneDot(category.tone))} aria-hidden="true" />
      <span className="tabular-nums">{ica}</span>
      <span className="text-label-secondary">· {category.label}</span>
    </span>
  );
}
