'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { HealthService } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapViewProps {
  services: HealthService[];
  selectedService: HealthService | null;
}

function MapController({ selectedService }: { selectedService: HealthService | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedService) {
      map.flyTo([selectedService.latitude, selectedService.longitude], 15, {
        duration: 1,
      });
    }
  }, [selectedService, map]);

  return null;
}

export default function MapView({ services, selectedService }: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const center: [number, number] = selectedService
    ? [selectedService.latitude, selectedService.longitude]
    : [6.2476, -75.5658]; // Medellín center

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {services.map((service) => (
        <Marker
          key={service.id}
          position={[service.latitude, service.longitude]}
          icon={icon}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-sm mb-1">{service.name}</h3>
              <p className="text-xs text-gray-600 mb-1">{service.address}</p>
              <p className="text-xs text-gray-500">{service.hours}</p>
              {service.isOpenNow && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  🟢 Abierto ahora
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      <MapController selectedService={selectedService} />
    </MapContainer>
  );
}
