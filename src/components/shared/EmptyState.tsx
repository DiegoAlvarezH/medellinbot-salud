import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        {icon || <FileQuestion className="w-8 h-8 text-gray-400" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
