import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium leading-5 whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-fill text-label-secondary',
        accent: 'bg-accent-soft text-accent',
        green: 'bg-green-soft text-green',
        red: 'bg-red-soft text-red',
        orange: 'bg-orange-soft text-orange',
        yellow: 'bg-yellow-soft text-yellow',
        purple: 'bg-purple-soft text-purple',
        teal: 'bg-teal-soft text-teal',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
