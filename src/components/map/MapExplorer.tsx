'use client';

import dynamic from 'next/dynamic';
import { useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Loader2, LocateFixed, Search, X } from 'lucide-react';
import { ChipScroller } from '@/components/ui/chip-scroller';
import { Segmented } from '@/components/ui/segmented';
import { ServiceCard } from '@/components/services/ServiceCard';
import { useLocation } from '@/components/location/LocationProvider';
import { distanceMeters } from '@/lib/geo';
import { isOpenAt } from '@/lib/opening-hours';
import { isEmergencyCapable } from '@/lib/service-search';
import { SERVICE_TYPE_META } from '@/lib/services-meta';
import { cn } from '@/lib/utils';
import type { HealthService, ServiceType } from '@/types';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center bg-bg-secondary">
      <Loader2 className="size-6 animate-spin text-label-tertiary" aria-label="Cargando mapa" />
    </div>
  ),
});

type Filter = 'all' | 'urgent' | 'vaccination' | ServiceType;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'urgent', label: 'Urgencias' },
  { value: 'vaccination', label: 'Vacunación' },
  { value: 'hospital', label: 'Hospitales' },
  { value: 'health-center', label: 'Centros de salud' },
  { value: 'clinic', label: 'Clínicas' },
  { value: 'pharmacy', label: 'Farmacias' },
  { value: 'dentist', label: 'Odontología' },
  { value: 'laboratory', label: 'Laboratorios' },
];

const PAGE = 60;

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const subscribeNoop = () => () => {};

export function MapExplorer() {
  const [services, setServices] = useState<HealthService[]>([]);
  const [meta, setMeta] = useState<{ sources: string[]; updatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openNow, setOpenNow] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [limit, setLimit] = useState(PAGE);
  const geo = useLocation();
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/services', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { services: HealthService[]; sources: string[]; updatedAt: string }) => {
        setServices(data.services);
        setMeta({ sources: data.sources, updatedAt: data.updatedAt });
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    const list = services
      .filter((s) => {
        if (filter === 'urgent' && !isEmergencyCapable(s)) return false;
        if (filter === 'vaccination' && !s.vaccination) return false;
        if (filter !== 'all' && filter !== 'urgent' && filter !== 'vaccination' && s.type !== filter) return false;
        if (openNow && isOpenAt(s.hours) !== true) return false;
        if (q && !normalize(`${s.name} ${s.address ?? ''} ${s.neighborhood ?? ''} ${s.municipality ?? ''}`).includes(q)) return false;
        return true;
      })
      .map((s) => (geo.position ? { ...s, distance: distanceMeters(geo.position, s) } : s));
    if (geo.position) list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    return list;
  }, [services, deferredQuery, filter, openNow, geo.position]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination whenever the result set changes
    setLimit(PAGE);
  }, [deferredQuery, filter, openNow, geo.position]);

  const select = (id: string) => {
    setSelectedId(id);
    document.getElementById(`service-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const list = (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-separator p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-label-tertiary" />
          <label htmlFor="map-search" className="sr-only">
            Buscar
          </label>
          <input
            id="map-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, barrio o dirección"
            className="h-10 w-full rounded-xl bg-fill pr-3 pl-9 text-[15px] outline-none placeholder:text-label-tertiary focus:ring-4 focus:ring-accent-soft"
          />
        </div>
        <ChipScroller ariaLabel="Filtrar por tipo de servicio" className="-mx-4">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                'h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors',
                filter === f.value ? 'bg-label text-bg' : 'bg-fill text-label hover:bg-fill-strong',
              )}
            >
              {f.label}
            </button>
          ))}
        </ChipScroller>
        <div className="flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-label">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Abierto ahora
          </label>
          <button
            type="button"
            onClick={() => (geo.position ? geo.pause() : geo.locate())}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium',
              geo.position ? 'bg-accent text-white' : 'bg-accent-soft text-accent',
            )}
          >
            <LocateFixed className={cn('size-3.5', geo.status === 'locating' && 'animate-pulse')} />
            {geo.position ? 'Ordenado por cercanía' : geo.status === 'locating' ? 'Ubicando…' : 'Cerca de mí'}
          </button>
        </div>
        {geo.status === 'denied' && (
          <p className="text-[12px] text-orange">
            Bloqueaste la ubicación. Actívala desde el candado junto a la dirección del sitio para ordenar por cercanía.
          </p>
        )}
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="flex items-center gap-2 text-[15px] text-label-secondary">
            <Loader2 className="size-4 animate-spin" /> Cargando la red de salud…
          </p>
        ) : error ? (
          <p className="text-[15px] text-label-secondary">No pudimos cargar los servicios. Intenta recargar la página.</p>
        ) : (
          <>
            <p className="mb-3 text-[13px] text-label-secondary">
              {filtered.length.toLocaleString('es-CO')} resultados
              {filter !== 'all' && filter !== 'urgent' && filter !== 'vaccination' ? ` · ${SERVICE_TYPE_META[filter].plural}` : ''}
            </p>
            <ul className="space-y-3">
              {filtered.slice(0, limit).map((service) => (
                <li key={service.id} id={`service-${service.id}`}>
                  <ServiceCard
                    service={service}
                    selected={service.id === selectedId}
                    onSelect={() => {
                      setSelectedId(service.id);
                      setView('map');
                    }}
                  />
                </li>
              ))}
            </ul>
            {filtered.length > limit && (
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="mt-4 w-full rounded-xl bg-fill py-2.5 text-[15px] font-medium text-accent hover:bg-fill-strong"
              >
                Mostrar más
              </button>
            )}
            {meta && (
              <p className="mt-6 text-[11px] leading-relaxed text-label-tertiary">
                Fuentes: {meta.sources.join(' · ')}. Horarios y teléfonos pueden cambiar: confirma antes de ir.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative flex h-[calc(100dvh-3rem)] flex-col md:flex-row">
      <div className="flex justify-center border-b border-separator p-2 md:hidden">
        <Segmented
          ariaLabel="Vista"
          value={view}
          onChange={setView}
          options={[
            { value: 'map', label: 'Mapa' },
            { value: 'list', label: `Lista${filtered.length ? ` (${filtered.length})` : ''}` },
          ]}
          className="w-full max-w-xs"
        />
      </div>

      <aside
        className={cn(
          'min-h-0 flex-1 border-separator bg-bg md:block md:w-[400px] md:flex-none md:border-r',
          view === 'list' ? 'block' : 'hidden',
        )}
      >
        {list}
      </aside>

      <div className={cn('relative min-h-0 flex-1', view === 'map' ? 'block' : 'hidden md:block')}>
        <MapView
          services={filtered}
          selectedId={selectedId}
          onSelect={(id) => select(id)}
          userPosition={geo.position}
          dark={hydrated && resolvedTheme === 'dark'}
        />
        {selectedId && view === 'map' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] p-3 md:hidden">
            {filtered
              .filter((s) => s.id === selectedId)
              .map((s) => (
                <div key={s.id} className="pointer-events-auto relative">
                  <ServiceCard service={s} className="shadow-float" />
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-fill text-label-secondary hover:bg-fill-strong"
                    aria-label="Cerrar"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
