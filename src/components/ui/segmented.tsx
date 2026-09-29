'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel: string;
}

/** iOS-style segmented control with a sliding selection pill. */
export function Segmented<T extends string>({ options, value, onChange, className, ariaLabel }: SegmentedProps<T>) {
  const layoutId = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex rounded-[10px] bg-fill p-0.5', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex-1 whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors',
              selected ? 'text-label' : 'text-label-secondary hover:text-label',
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[8px] bg-bg-elevated shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)] dark:bg-fill-strong"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
