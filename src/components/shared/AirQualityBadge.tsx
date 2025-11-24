'use client';

import { Wind } from 'lucide-react';
import { AirQualityData } from '@/types';
import { cn } from '@/lib/utils';

interface AirQualityBadgeProps {
  data: AirQualityData;
  className?: string;
}

const statusColors = {
  good: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  moderate: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  unhealthy: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  'very-unhealthy': {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  hazardous: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
};

export function AirQualityBadge({ data, className }: AirQualityBadgeProps) {
  const colors = statusColors[data.status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-full border transition-all',
        colors.bg,
        colors.border,
        className
      )}
    >
      <Wind className={cn('w-4 h-4', colors.iconColor)} />
      <div className="flex flex-col">
        <span className={cn('text-xs font-medium', colors.text)}>
          Calidad del aire
        </span>
        <span className={cn('text-sm font-bold', colors.text)}>
          {data.statusText} (ICA: {data.ica})
        </span>
      </div>
    </div>
  );
}
