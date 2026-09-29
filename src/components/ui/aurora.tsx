import { cn } from '@/lib/utils';

/** Slow-moving, heavily blurred colour field used behind heroes and the empty chat. */
export function Aurora({ className }: { className?: string }) {
  return (
    <div className={cn('aurora', className)} aria-hidden="true">
      <span className="aurora-blob top-[-12%] left-[8%] size-[46vmax] max-h-[620px] max-w-[620px] bg-[#0a84ff]" />
      <span
        className="aurora-blob top-[4%] right-[-6%] size-[40vmax] max-h-[560px] max-w-[560px] bg-[#bf5af2]"
        style={{ animationDelay: '-7s', animationDuration: '26s' }}
      />
      <span
        className="aurora-blob top-[30%] left-[30%] size-[34vmax] max-h-[480px] max-w-[480px] bg-[#30d158]"
        style={{ animationDelay: '-13s', animationDuration: '30s', opacity: 0.35 }}
      />
      <span
        className="aurora-blob top-[18%] left-[-10%] size-[28vmax] max-h-[420px] max-w-[420px] bg-[#64d2ff]"
        style={{ animationDelay: '-4s', animationDuration: '24s' }}
      />
    </div>
  );
}
