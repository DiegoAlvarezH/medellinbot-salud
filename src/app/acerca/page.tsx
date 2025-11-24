'use client';

import { motion } from 'framer-motion';
import { Database, Cloud, Users, ShieldCheck, HelpCircle, Sparkles, Heart, Target, Zap, Award, Activity, DollarSign, RefreshCw, Smartphone, Check, CircleHelp } from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: Target,
      title: 'Nuestra Misión',
      description: 'Democratizar el acceso a información de salud pública en Medellín mediante tecnología de IA.',
      gradient: 'from-primary-500 to-emerald-500',
    },
    {
      icon: Zap,
      title: 'Innovación',
      description: 'Utilizamos las últimas tecnologías en inteligencia artificial y procesamiento de lenguaje natural.',
      gradient: 'from-secondary-500 to-blue-500',
    },
    {
      icon: Heart,
      title: 'Impacto Social',
      description: 'Ayudamos a miles de ciudadanos a encontrar servicios de salud de manera rápida y efectiva.',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: Award,
      title: 'Calidad',
      description: 'Información verificada y actualizada constantemente de fuentes oficiales confiables.',
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Consultas Diarias', icon: Activity },
    { number: '150+', label: 'Servicios de Salud', icon: Target },
    { number: '99.9%', label: 'Disponibilidad', icon: Zap },
    { number: '4.9/5', label: 'Satisfacción', icon: Heart },
  ];

  const faqItems = [
    {
      q: '¿Es gratis usar MedellínBot Salud?',
      a: 'Sí, completamente gratuito para todos los ciudadanos de Medellín. Nuestro objetivo es democratizar el acceso a información de salud pública sin ningún costo.',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
      color: 'emerald',
    },
    {
      q: '¿Cómo se mantiene actualizada la información?',
      a: 'Nos conectamos en tiempo real con fuentes oficiales como MEData y SIATA que actualizan sus datos constantemente. Nuestra información se sincroniza automáticamente cada hora.',
      icon: RefreshCw,
      gradient: 'from-blue-500 to-cyan-500',
      color: 'blue',
    },
    {
      q: '¿Puedo confiar en la información médica?',
      a: 'Proporcionamos información general de salud pública de fuentes oficiales verificadas. Para diagnósticos o tratamientos específicos, siempre consulte con un profesional de la salud calificado.',
      icon: ShieldCheck,
      gradient: 'from-purple-500 to-pink-500',
      color: 'purple',
    },
    {
      q: '¿Funciona en dispositivos móviles?',
      a: 'Sí, MedellínBot Salud está completamente optimizado para funcionar perfectamente en smartphones, tablets y computadores con diseño responsive y PWA.',
      icon: Smartphone,
      gradient: 'from-orange-500 to-red-500',
      color: 'orange',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-subtle">
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-10 w-96 h-96 bg-primary-300/20 dark:bg-primary-600/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-300/20 dark:bg-secondary-600/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-3 px-6 py-3 glass dark:glass rounded-full mb-8 border border-primary-200 dark:border-primary-800 shadow-lg"
            >
              <div className="relative">
                <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 bg-clip-text text-transparent">
                Proyecto de Innovación en Salud Pública
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight">
              Acerca de{' '}
              <span className="gradient-text block md:inline">MedellínBot Salud</span>
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto font-medium">
              Tu asistente inteligente que transforma la forma en que los ciudadanos
              acceden a información vital de{' '}
              <span className="font-bold text-primary-600 dark:text-primary-400">
                salud pública en Medellín
              </span>
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-4 mt-12"
            >
              {[Target, Heart, Zap].map((Icon, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 dark:from-primary-600 dark:to-secondary-600 flex items-center justify-center shadow-lg"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-700 dark:to-secondary-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      delay: index * 0.5,
                    }}
                  >
                    <Icon className="w-10 h-10 mx-auto mb-3 text-white/80" />
                  </motion.div>
                  <div className="text-4xl md:text-5xl font-black text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm md:text-base text-white/90 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 section-bg-light">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              ¿Por qué <span className="gradient-text">MedellínBot</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Combinamos tecnología de punta con un enfoque humano para mejorar el acceso a la salud
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="glass dark:glass rounded-3xl p-8 card-hover border border-gray-100 dark:border-gray-800"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Fuentes de <span className="gradient-text">Datos Oficiales</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Información confiable y actualizada constantemente
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass dark:glass rounded-3xl p-8 border-2 border-primary-200 dark:border-primary-800/50 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center mb-6 shadow-xl">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">MEData</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Plataforma de datos abiertos de Medellín con información actualizada sobre servicios de salud,
                ubicaciones, horarios y especialidades médicas disponibles en la ciudad.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass dark:glass rounded-3xl p-8 border-2 border-secondary-200 dark:border-secondary-800/50 hover:border-secondary-300 dark:hover:border-secondary-700 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary-500 to-blue-500 flex items-center justify-center mb-6 shadow-xl">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">SIATA</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Sistema de Alerta Temprana de Medellín y el Valle de Aburrá. Datos en tiempo real sobre
                calidad del aire, ICA y recomendaciones de salud personalizadas.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 section-bg-light">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto glass dark:glass rounded-3xl p-10 md:p-12 text-center border border-gray-100 dark:border-gray-800">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-xl">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-gray-900 dark:text-white">Equipo Desarrollador</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Este proyecto fue desarrollado por estudiantes de la{' '}
              <span className="font-bold text-primary-600 dark:text-primary-400">
                Universidad Nacional Abierta y a Distancia (UNAD)
              </span>{' '}
              como parte de un proyecto de investigación en tecnologías aplicadas a la salud pública.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contacto:{' '}
              <a href="mailto:info@medellinbot.co" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                info@medellinbot.co
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto glass dark:glass rounded-3xl p-8 border-2 border-yellow-200 dark:border-yellow-800/50"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Aviso Legal y Médico</h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <p className="leading-relaxed">
                    <strong className="text-gray-900 dark:text-white">⚠️ Importante:</strong> MedellínBot Salud es un asistente informativo
                    que proporciona información general sobre servicios de salud pública. NO proporciona diagnósticos médicos
                    ni reemplaza la consulta con profesionales de la salud.
                  </p>
                  <p className="leading-relaxed">
                    En caso de emergencia médica, llame inmediatamente al{' '}
                    <strong className="text-red-600 dark:text-red-400 text-xl">123</strong>.
                  </p>
                  <p className="leading-relaxed text-sm">
                    La información proporcionada se actualiza periódicamente, pero puede no reflejar cambios recientes.
                    Siempre verifique directamente con las instituciones de salud.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ - MEJORADO */}
      <section className="py-24 section-bg-light">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-6 shadow-lg">
              <CircleHelp className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Preguntas <span className="gradient-text">Frecuentes</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Encuentra respuestas rápidas a las dudas más comunes
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto grid gap-6">
            {faqItems.map((faq, i) => {
              const Icon = faq.icon;
              return (
                <motion.details
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass dark:glass rounded-2xl overflow-hidden cursor-pointer group border-2 border-${faq.color}-200 dark:border-${faq.color}-800/50 hover:border-${faq.color}-300 dark:hover:border-${faq.color}-700 transition-all hover:shadow-2xl`}
                >
                  <summary className="p-6 list-none flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${faq.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-lg flex-1 text-gray-900 dark:text-white">
                      {faq.q}
                    </span>
                    <div className={`w-8 h-8 rounded-full bg-${faq.color}-100 dark:bg-${faq.color}-900/30 flex items-center justify-center group-open:rotate-180 transition-transform flex-shrink-0`}>
                      <span className={`text-${faq.color}-600 dark:text-${faq.color}-400 text-xl font-bold`}>
                        ▼
                      </span>
                    </div>
                  </summary>
                  <div className="px-6 pb-6 pt-2">
                    <div className={`flex items-start gap-3 p-4 rounded-xl bg-${faq.color}-50 dark:bg-${faq.color}-950/20 border-l-4 border-${faq.color}-500`}>
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 text-${faq.color}-600 dark:text-${faq.color}-400`} />
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </motion.details>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
