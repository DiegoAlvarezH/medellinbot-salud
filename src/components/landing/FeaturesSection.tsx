'use client';

import { motion } from 'framer-motion';
import { Hospital, Syringe, Wind, Bus } from 'lucide-react';

const features = [
  {
    icon: Hospital,
    title: 'Servicios de Salud',
    description:
      'Encuentra hospitales, clínicas y centros de salud cercanos con información actualizada de horarios y especialidades.',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    icon: Syringe,
    title: 'Información de Vacunación',
    description:
      'Consulta puntos de vacunación, horarios disponibles y requisitos para diferentes tipos de vacunas.',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    icon: Wind,
    title: 'Calidad del Aire',
    description:
      'Monitorea en tiempo real la calidad del aire en Medellín con recomendaciones personalizadas para tu salud.',
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    icon: Bus,
    title: 'Rutas de Transporte',
    description:
      'Obtén las mejores rutas en transporte público para llegar a cualquier servicio de salud de la ciudad.',
    gradient: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
];

export function FeaturesSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-24 px-4 bg-secondary-100 dark:bg-secondary-900">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-secondary-900 dark:text-white">
            Todo lo que necesitas en{' '}
            <span className="text-primary-600 dark:text-primary-500">un solo lugar</span>
          </h2>
          <p className="text-xl md:text-2xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto leading-relaxed">
            Accede fácilmente a información de salud pública mediante
            conversación natural
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -8 }}
              className={`group glass-panel rounded-3xl p-8 hover:border-primary-500/50 transition-all border border-transparent`}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-secondary-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-base text-secondary-600 dark:text-secondary-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
