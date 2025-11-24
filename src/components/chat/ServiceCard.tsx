'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Navigation, Star } from 'lucide-react';
import { HealthService } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ServiceCardProps {
  service: HealthService;
}

const serviceTypeLabels = {
  hospital: 'Hospital',
  clinic: 'Clínica',
  'vaccination-center': 'Centro de Vacunación',
  pharmacy: 'Farmacia',
};

const serviceTypeColors = {
  hospital: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  clinic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'vaccination-center': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  pharmacy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

export function ServiceCard({ service }: ServiceCardProps) {
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass dark:glass-dark rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {service.name}
            </h3>
            {service.isOpenNow && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </motion.div>
            )}
          </div>
          <Badge className={serviceTypeLabels[service.type]}>
            {serviceTypeLabels[service.type]}
          </Badge>
        </div>
        {service.distance && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
              <MapPin className="w-4 h-4" />
              <span>{formatDistance(service.distance)}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">{service.address}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">{service.hours}</span>
            {service.isOpenNow && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                Abierto ahora
              </Badge>
            )}
          </div>
        </div>

        {service.specialties && service.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
            {service.specialties.map((specialty, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700" size="sm">
          <Navigation className="w-4 h-4 mr-2" />
          Ver ruta
        </Button>
        {service.phone && (
          <Button variant="outline" size="sm" asChild className="border-2">
            <a href={`tel:${service.phone}`}>
              <Phone className="w-4 h-4 mr-2" />
              Llamar
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
