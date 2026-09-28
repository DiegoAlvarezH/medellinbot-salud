import * as React from 'react';
import { cn } from '@/lib/utils';

/** Rounded, elevated surface. `grouped` renders on the secondary background like an iOS inset list. */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { grouped?: boolean }>(
  ({ className, grouped = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-card',
        grouped ? 'bg-bg-secondary' : 'bg-bg-elevated shadow-card',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export { Card };
