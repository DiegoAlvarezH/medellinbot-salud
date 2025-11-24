'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, Coins, Navigation, Footprints, Bus, Train } from 'lucide-react';
import { RouteInfo } from '@/types';
import { Button } from '@/components/ui/button';

interface RouteCardProps {
  route: RouteInfo;
}

const modeIcons = {
  walk: Footprints,
  bus: Bus,
  metro: Train,
  metrocable: Train,
};

export function RouteCard({ route }: RouteCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass dark:glass-dark rounded-2xl p-5 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary-600" />
          <span className="font-medium">{route.origin}</span>
          <span className="text-gray-400">→</span>
          <span className="font-medium">{route.destination}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="font-semibold">{route.totalTime} min</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Coins className="w-4 h-4 text-gray-500" />
          <span className="font-semibold">{formatCurrency(route.totalCost)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="font-semibold">{formatDistance(route.distance)}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-4">
        {route.steps.map((step, index) => {
          const Icon = modeIcons[step.mode];
          return (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                {index < route.steps.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700 my-1" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium">{step.instruction}</p>
                {step.line && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.line}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{step.duration} min</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action */}
      <Button className="w-full" size="sm">
        <Navigation className="w-4 h-4 mr-2" />
        Iniciar navegación
      </Button>
    </motion.div>
  );
}
