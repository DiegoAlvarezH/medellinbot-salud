'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Search, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: MessageCircle,
    title: 'Haz tu pregunta',
    description:
      'Escribe en lenguaje natural lo que necesitas: un hospital cercano, información de vacunas, calidad del aire, etc.',
  },
  {
    number: '02',
    icon: Search,
    title: 'Procesamos tu consulta',
    description:
      'Nuestro asistente con IA entiende tu necesidad y busca la información más relevante y actualizada.',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Recibe respuestas claras',
    description:
      'Obtén información precisa con mapas, rutas, horarios y recomendaciones personalizadas al instante.',
  },
];

export function HowItWorksSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            ¿Cómo <span className="gradient-text">funciona?</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Tres simples pasos para obtener la información que necesitas
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-12"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={item}
              className="flex items-start gap-6"
            >
              {/* Number Badge */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">
                    {step.number}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-primary-500 to-transparent mt-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <div className="glass dark:glass-dark rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
