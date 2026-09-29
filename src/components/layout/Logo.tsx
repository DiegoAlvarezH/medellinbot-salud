import { cn } from '@/lib/utils';

/** App glyph: a rounded square with a cross, drawn with the accent color. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('shrink-0', className)}>
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path d="M13.5 8.5h5v5h5v5h-5v5h-5v-5h-5v-5h5z" fill="#fff" />
    </svg>
  );
}
