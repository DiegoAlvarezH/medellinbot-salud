import type { BadgeTone } from '@/components/ui/badge';
import type { ServiceType } from '@/types';

export const SERVICE_TYPE_META: Record<ServiceType, { label: string; plural: string; tone: BadgeTone; color: string }> = {
  hospital: { label: 'Hospital', plural: 'Hospitales', tone: 'red', color: '#ff3b30' },
  clinic: { label: 'Clínica', plural: 'Clínicas', tone: 'accent', color: '#0a84ff' },
  'health-center': { label: 'Centro de salud', plural: 'Centros de salud', tone: 'teal', color: '#30b0c7' },
  pharmacy: { label: 'Farmacia', plural: 'Farmacias', tone: 'green', color: '#34c759' },
  dentist: { label: 'Odontología', plural: 'Odontología', tone: 'purple', color: '#af52de' },
  laboratory: { label: 'Laboratorio', plural: 'Laboratorios', tone: 'orange', color: '#ff9500' },
  doctor: { label: 'Consultorio', plural: 'Consultorios', tone: 'neutral', color: '#8e8e93' },
  other: { label: 'Servicio de salud', plural: 'Otros', tone: 'neutral', color: '#8e8e93' },
};
