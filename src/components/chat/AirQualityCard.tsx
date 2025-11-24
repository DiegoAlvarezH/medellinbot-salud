'use client';

import { motion } from 'framer-motion';
import { Wind, AlertCircle, CheckCircle } from 'lucide-react';
import { AirQualityData } from '@/types';
import { cn } from '@/lib/utils';

interface AirQualityCardProps {
  data: AirQualityData;
}

const statusConfig = {
  good: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    ring: 'stroke-green-500',
    icon: CheckCircle,
  },
  moderate: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    ring: 'stroke-yellow-500',
    icon: AlertCircle,
  },
  unhealthy: {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    ring: 'stroke-orange-500',
    icon: AlertCircle,
  },
  'very-unhealthy': {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    ring: 'stroke-red-500',
    icon: AlertCircle,
  },
  hazardous: {
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    ring: 'stroke-purple-500',
    icon: AlertCircle,
  },
};

export function AirQualityCard({ data }: AirQualityCardProps) {
  const config = statusConfig[data.status];
  const Icon = config.icon;
  const percentage = Math.min((data.ica / 150) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass dark:glass-dark rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <Wind className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h3 className="font-bold text-lg">Calidad del Aire</h3>
      </div>

      <div className="flex items-center gap-6 mb-4">
        {/* ICA Gauge */}
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${percentage * 2.51} 251`}
              className={cn(config.ring, 'transition-all duration-1000')}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-2xl font-bold', config.color)}>{data.ica}</span>
            <span className="text-xs text-gray-500">ICA</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex-1">
          <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2', config.bg)}>
            <Icon className={cn('w-4 h-4', config.color)} />
            <span className={cn('font-semibold text-sm', config.color)}>{data.statusText}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Última actualización: {data.lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{data.station}</p>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-2">Recomendaciones:</h4>
          <ul className="space-y-1">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pollutants */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">PM2.5</p>
          <p className="font-bold text-sm">{data.pollutants.pm25}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">PM10</p>
          <p className="font-bold text-sm">{data.pollutants.pm10}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">O₃</p>
          <p className="font-bold text-sm">{data.pollutants.o3}</p>
        </div>
      </div>
    </motion.div>
  );
}
