import { cn } from '@/lib/utils';

interface LoadingStateProps {
  className?: string;
  lines?: number;
}

export function LoadingState({ className, lines = 3 }: LoadingStateProps) {
  return (
    <div className={cn('space-y-3 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
      <div className="flex gap-2 mt-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
      </div>
    </div>
  );
}
