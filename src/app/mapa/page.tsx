'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Hospital, Syringe, Building2, Pill, MapPin, Menu, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockHealthServices } from '@/lib/mock-data';
import { HealthService } from '@/types';

// Dynamic import for Leaflet
const MapComponent = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-pulse" />
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">Cargando mapa...</p>
      </div>
    </div>
  ),
});

const typeFilters = [
  { value: 'all', label: 'Todos', icon: Filter },
  { value: 'hospital', label: 'Hospitales', icon: Hospital },
  { value: 'clinic', label: 'Clínicas', icon: Building2 },
  { value: 'vaccination-center', label: 'Vacunación', icon: Syringe },
  { value: 'pharmacy', label: 'Farmacias', icon: Pill },
];

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<HealthService | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredServices = useMemo(() => {
    return mockHealthServices.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(normalizedSearch) ||
        service.address.toLowerCase().includes(normalizedSearch);
      const matchesType = selectedType === 'all' || service.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [normalizedSearch, selectedType]);

  const servicesPanel = (
    <>
      <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-white/95 dark:bg-secondary-900/95 backdrop-blur-sm">
        <h1 className="text-xl lg:text-2xl font-bold text-secondary-900 dark:text-white">Servicios de Salud</h1>
      </div>

      <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-white/95 dark:bg-secondary-900/95">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o direccion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-white/95 dark:bg-secondary-900/95">
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.value}
                onClick={() => setSelectedType(filter.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedType === filter.value
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white dark:bg-secondary-900">
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 font-medium">
          {filteredServices.length} servicios encontrados
        </p>
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedService?.id === service.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="font-semibold text-sm text-secondary-900 dark:text-white">{service.name}</h3>
                {service.isOpenNow && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                    Abierto
                  </Badge>
                )}
              </div>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">{service.address}</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">{service.hours}</p>
              {service.distance && (
                <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-2">
                  {service.distance < 1000 ? `${service.distance}m` : `${(service.distance / 1000).toFixed(1)}km`}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-secondary-50 dark:bg-secondary-950 relative overflow-hidden">
      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Responsive */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed z-50 w-full sm:w-96 h-full border-r border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 flex flex-col shadow-2xl lg:hidden"
          >
            <div className="p-3 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between lg:hidden">
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Panel</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
            {servicesPanel}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-96 h-full border-r border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 flex-col">
        {servicesPanel}
      </aside>

      {/* Map with Toggle Button */}
      <div className="flex-1 relative">
        {/* Toggle Button - FIXED POSITION */}
        <div className="lg:hidden absolute top-4 left-4 z-50">
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            size="lg"
            className="bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white shadow-2xl hover:shadow-xl border-2 border-secondary-300 dark:border-secondary-600 font-semibold"
          >
            <Menu className="w-5 h-5 mr-2" />
            Ver Servicios
            <span className="ml-2 bg-primary-600 text-white rounded-full px-2.5 py-0.5 text-xs font-bold">
              {filteredServices.length}
            </span>
          </Button>
        </div>

        {/* Map */}
        <MapComponent services={filteredServices} selectedService={selectedService} />
      </div>
    </div>
  );
}
