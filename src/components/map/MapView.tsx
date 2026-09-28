'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { SERVICE_TYPE_META } from '@/lib/services-meta';
import type { LatLng } from '@/lib/geo';
import type { HealthService } from '@/types';

const MEDELLIN: [number, number] = [6.2442, -75.5812];

interface MapViewProps {
  services: HealthService[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userPosition: LatLng | null;
  dark: boolean;
}

/** Flies to a point whenever its coordinates change (primitive deps, so re-renders don't retrigger it). */
function FlyTo({ lat, lng, zoom }: { lat?: number; lng?: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== undefined && lng !== undefined) map.flyTo([lat, lng], Math.max(map.getZoom(), zoom), { duration: 0.6 });
  }, [map, lat, lng, zoom]);
  return null;
}

/** Canvas-rendered map so a few thousand markers stay smooth on phones. */
export default function MapView({ services, selectedId, onSelect, userPosition, dark }: MapViewProps) {
  const selected = services.find((s) => s.id === selectedId) ?? null;
  const target = selected ?? userPosition;

  return (
    <MapContainer center={MEDELLIN} zoom={13} preferCanvas zoomControl className="size-full" aria-label="Mapa de servicios de salud">
      <TileLayer
        key={dark ? 'dark' : 'light'}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        className={dark ? 'map-tiles-dark' : undefined}
      />
      {services.map((service) => {
        const isSelected = service.id === selectedId;
        const color = SERVICE_TYPE_META[service.type].color;
        return (
          <CircleMarker
            key={service.id}
            center={[service.latitude, service.longitude]}
            radius={isSelected ? 10 : 6}
            pathOptions={{ color: '#fff', weight: isSelected ? 3 : 1.5, fillColor: color, fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onSelect(service.id) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {service.name}
            </Tooltip>
          </CircleMarker>
        );
      })}
      {userPosition && (
        <CircleMarker
          center={[userPosition.latitude, userPosition.longitude]}
          radius={8}
          pathOptions={{ color: '#fff', weight: 3, fillColor: '#0a84ff', fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -6]} permanent>
            Tú
          </Tooltip>
        </CircleMarker>
      )}
      <FlyTo lat={target?.latitude} lng={target?.longitude} zoom={selected ? 16 : 14} />
    </MapContainer>
  );
}
