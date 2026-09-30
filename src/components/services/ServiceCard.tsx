import { Clock, MapPin, Navigation, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SERVICE_TYPE_META } from '@/lib/services-meta';
import { formatHours, isOpenAt } from '@/lib/opening-hours';
import { directionsUrl, formatDistance } from '@/lib/geo';
import { formatPhone, telHref } from '@/lib/phone';
import { cn } from '@/lib/utils';
import type { HealthService } from '@/types';

interface ServiceCardProps {
  service: HealthService;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
  className?: string;
}

export function OpenBadge({ hours }: { hours?: string }) {
  const open = isOpenAt(hours);
  if (open === undefined) return null;
  return <Badge tone={open ? 'green' : 'neutral'}>{open ? 'Abierto ahora' : 'Cerrado'}</Badge>;
}

export function ServiceCard({ service, selected, onSelect, compact, className }: ServiceCardProps) {
  const meta = SERVICE_TYPE_META[service.type];
  const hours = formatHours(service.hours);
  const distance = formatDistance(service.distance);
  const dial = telHref(service.phone);
  const Wrapper = onSelect ? 'button' : 'div';

  return (
    <div
      className={cn(
        'rounded-card bg-bg-elevated shadow-card transition-shadow',
        selected && 'ring-2 ring-accent',
        className,
      )}
    >
      <Wrapper
        {...(onSelect ? { type: 'button' as const, onClick: onSelect } : {})}
        className={cn('block w-full p-4 text-left', onSelect && 'cursor-pointer')}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {service.emergency && <Badge tone="red">Urgencias</Badge>}
          {service.vaccination && <Badge tone="purple">Vacunación</Badge>}
          {service.isPublic && <Badge tone="teal">Red pública</Badge>}
          <OpenBadge hours={service.hours} />
        </div>
        <h3 className="mt-2 text-[17px] leading-snug font-semibold tracking-[-0.01em] text-label">{service.name}</h3>
        {service.address && (
          <p className="mt-1 flex gap-1.5 text-[13px] text-label-secondary">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {service.address}
              {service.municipality && service.municipality !== 'Medellín' ? `, ${service.municipality}` : ''}
            </span>
          </p>
        )}
        {hours && !compact && (
          <p className="mt-1 flex gap-1.5 text-[13px] text-label-secondary">
            <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{hours}</span>
          </p>
        )}
        {distance && <p className="mt-2 text-[13px] font-medium text-accent">A {distance}</p>}
      </Wrapper>

      <div className="flex gap-2 border-t border-separator px-4 py-2.5">
        <a
          href={directionsUrl(service)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-[13px] font-medium text-accent hover:opacity-80"
        >
          <Navigation className="size-3.5" aria-hidden="true" />
          Cómo llegar
        </a>
        {dial && (
          <a
            href={dial}
            title={formatPhone(service.phone)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-fill px-3 text-[13px] font-medium text-label hover:bg-fill-strong"
          >
            <Phone className="size-3.5" aria-hidden="true" />
            Llamar
          </a>
        )}
      </div>
    </div>
  );
}
