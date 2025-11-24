'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-secondary-200/30 dark:bg-secondary-900/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Floating Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 glass dark:glass rounded-full shadow-lg mb-8"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Disponible 24/7 • IA Avanzada
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight"
        >
          <span className="gradient-text block mb-2">
            Tu asistente de salud
          </span>
          <span className="text-gray-900 dark:text-white">en Medellín</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto font-medium leading-relaxed"
        >
          Encuentra servicios de salud, información de vacunación y calidad del
          aire al instante mediante{' '}
          <span className="font-bold text-primary-600 dark:text-primary-400">
            conversación natural con IA
          </span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            size="lg"
            className="text-lg px-10 py-7 rounded-2xl shadow-2xl hover:shadow-3xl h-auto bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 transform hover:scale-105 transition-all"
            asChild
          >
            <Link href="/chat">
              <Sparkles className="mr-2 w-5 h-5" />
              Comenzar conversación
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-10 py-7 rounded-2xl h-auto border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            asChild
          >
            <Link href="/acerca">
              Conocer más
            </Link>
          </Button>
        </motion.div>

        {/* Demo Chat Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="glass dark:glass rounded-3xl p-8 shadow-2xl">
            {/* Chat messages preview */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-2xl">🤖</span>
              </div>
              <div className="flex-1 message-assistant p-4 text-left animate-slide-up">
                <p className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                  ¡Hola! Soy tu asistente de salud para Medellín. ¿Qué necesitas hoy?
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 justify-end">
              <div className="message-user p-4 max-w-sm text-left">
                <p className="text-sm md:text-base leading-relaxed">
                  ¿Dónde está el hospital más cercano?
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-xl">👤</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
