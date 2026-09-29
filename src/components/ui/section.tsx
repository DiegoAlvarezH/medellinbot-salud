import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeader({ eyebrow, title, description, align = 'left', className }: SectionHeaderProps) {
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="title-section">{title}</h2>
      {description && <p className="lede mt-3">{description}</p>}
    </div>
  );
}

/** Standard page hero used by every secondary page. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="container-page pt-12 pb-8 sm:pt-20 sm:pb-12">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="headline max-w-3xl">{title}</h1>
      {description && <p className="lede mt-4 max-w-2xl">{description}</p>}
      {children}
    </section>
  );
}

export function SourceNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-[12px] leading-relaxed text-label-tertiary', className)}>{children}</p>;
}
