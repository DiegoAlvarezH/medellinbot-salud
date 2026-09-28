import type { Metadata } from 'next';
import { MapExplorer } from '@/components/map/MapExplorer';

export const metadata: Metadata = {
  title: 'Mapa de salud',
  description: 'Hospitales, centros de salud, clínicas y farmacias de Medellín y el Valle de Aburrá, con horario y cómo llegar.',
};

export default function MapPage() {
  return <MapExplorer />;
}
