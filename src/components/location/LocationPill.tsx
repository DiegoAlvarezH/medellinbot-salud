'use client';

import { LocateFixed, LocateOff, Loader2 } from 'lucide-react';
import { useLocation } from '@/components/location/LocationProvider';
import { cn } from '@/lib/utils';

/** Compact location status that doubles as an on/off switch. */
export function LocationPill({ className }: { className?: string }) {
  const { status, locate, pause } = useLocation();

  const config = {
    granted: { label: 'Cerca de ti', icon: LocateFixed, tone: 'bg-green-soft text-green', title: 'Usando tu ubicación. Toca para dejar de usarla.' },
    locating: { label: 'Ubicando…', icon: Loader2, tone: 'bg-fill text-label-secondary', title: 'Obteniendo tu ubicación' },
    denied: {
      label: 'Ubicación bloqueada',
      icon: LocateOff,
      tone: 'bg-orange-soft text-orange',
      title: 'Permite la ubicación desde el candado junto a la dirección del sitio y vuelve a tocar aquí.',
    },
    unavailable: { label: 'Sin ubicación', icon: LocateOff, tone: 'bg-fill text-label-secondary', title: 'Tu navegador no pudo obtener la ubicación. Toca para reintentar.' },
    paused: { label: 'Activar ubicación', icon: LocateFixed, tone: 'bg-accent-soft text-accent', title: 'Usar tu ubicación para ordenar por cercanía' },
    idle: { label: 'Activar ubicación', icon: LocateFixed, tone: 'bg-accent-soft text-accent', title: 'Usar tu ubicación para ordenar por cercanía' },
  }[status];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => (status === 'granted' ? pause() : locate())}
      title={config.title}
      aria-label={config.title}
      className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-opacity hover:opacity-80', config.tone, className)}
    >
      {status === 'granted' ? (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-green" />
        </span>
      ) : (
        <Icon className={cn('size-3.5', status === 'locating' && 'animate-spin')} aria-hidden="true" />
      )}
      <span className="whitespace-nowrap">{config.label}</span>
    </button>
  );
}
