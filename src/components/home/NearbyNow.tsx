'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Hospital, LocateFixed, Navigation, Pill, Stethoscope } from 'lucide-react';
import { useLocation } from '@/components/location/LocationProvider';
import { directionsUrl, distanceMeters, formatDistance } from '@/lib/geo';
import { isOpenAt } from '@/lib/opening-hours';
import { isEmergencyCapable } from '@/lib/service-search';
import { cn } from '@/lib/utils';
import type { HealthService } from '@/types';

interface Slot {
  key: string;
  label: string;
  icon: typeof Hospital;
  tint: string;
  pick: (s: HealthService) => boolean;
}

const SLOTS: Slot[] = [
  { key: 'urgent', label: 'Urgencias', icon: Hospital, tint: 'bg-red-soft text-red', pick: isEmergencyCapable },
  {
    key: 'pharmacy',
    label: 'Farmacia abierta',
    icon: Pill,
    tint: 'bg-green-soft text-green',
    pick: (s) => s.type === 'pharmacy' && isOpenAt(s.hours) !== false,
  },
  { key: 'public', label: 'Centro de salud público', icon: Stethoscope, tint: 'bg-teal-soft text-teal', pick: (s) => s.type === 'health-center' && Boolean(s.isPublic) },
];

/** "Near you" strip on the home page, driven by the automatic location permission. */
export function NearbyNow() {
  const { position, status, locate } = useLocation();
  const [services, setServices] = useState<HealthService[] | null>(null);

  useEffect(() => {
    if (!position || services) return;
    const controller = new AbortController();
    fetch('/api/services', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { services: HealthService[] }) => setServices(data.services))
      .catch(() => undefined);
    return () => controller.abort();
  }, [position, services]);

  const nearest = useMemo(() => {
    if (!position || !services) return null;
    return SLOTS.map((slot) => {
      let best: (HealthService & { distance: number }) | null = null;
      for (const s of services) {
        if (!slot.pick(s)) continue;
        const distance = distanceMeters(position, s);
        if (!best || distance < best.distance) best = { ...s, distance };
      }
      return { slot, service: best };
    });
  }, [position, services]);

  if (status !== 'granted') {
    return (
      <div className="glass-card flex flex-col items-start gap-4 rounded-tile p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[17px] font-semibold">Encuentra lo más cercano a ti</p>
          <p className="mt-1 text-[15px] text-label-secondary">
            {status === 'denied'
              ? 'La ubicación está bloqueada. Actívala desde el candado junto a la dirección del sitio.'
              : status === 'locating'
                ? 'Buscando tu ubicación…'
                : 'Permite la ubicación y te mostramos urgencias, farmacias y centros de salud a tu alrededor.'}
          </p>
        </div>
        {status !== 'denied' && status !== 'locating' && (
          <button type="button" onClick={locate} className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-medium text-white">
            <LocateFixed className="size-4" /> Usar mi ubicación
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {(nearest ?? SLOTS.map((slot) => ({ slot, service: null }))).map(({ slot, service }) => {
        const Icon = slot.icon;
        return (
          <div key={slot.key} className="glass-card flex flex-col rounded-tile p-5">
            <div className="flex items-center gap-2.5">
              <span className={cn('grid size-9 place-items-center rounded-xl', slot.tint)}>
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="text-[13px] font-medium text-label-secondary">{slot.label}</span>
            </div>
            {service ? (
              <>
                <p className="mt-3 line-clamp-2 text-[17px] leading-snug font-semibold tracking-[-0.01em]">{service.name}</p>
                <p className="mt-1 text-[13px] text-label-secondary">
                  A {formatDistance(service.distance)}
                  {service.transit ? ` · Metro ${service.transit.name}` : ''}
                </p>
                <a
                  href={directionsUrl(service)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex h-8 w-fit items-center gap-1.5 rounded-full bg-accent-soft px-3 text-[13px] font-medium text-accent hover:opacity-80"
                >
                  <Navigation className="size-3.5" aria-hidden="true" /> Cómo llegar
                </a>
              </>
            ) : (
              <div className="mt-3 space-y-2" aria-hidden="true">
                <div className="h-5 w-3/4 animate-pulse rounded-md bg-fill" />
                <div className="h-4 w-1/3 animate-pulse rounded-md bg-fill" />
              </div>
            )}
          </div>
        );
      })}
      <Link href="/mapa" className="inline-flex items-center text-[15px] text-link hover:underline md:col-span-3">
        Ver todo en el mapa <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}
