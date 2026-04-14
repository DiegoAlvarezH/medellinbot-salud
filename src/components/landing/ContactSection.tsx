'use client';

import { motion } from 'framer-motion';
import { Send, Mail, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Link from 'next/link';

export function ContactSection() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formState);
  };

  return (
    <section className="py-24 relative overflow-hidden bg-secondary-50 dark:bg-secondary-950">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-secondary-900 dark:text-white">
              Contáctanos
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              ¿Tienes preguntas o sugerencias? Estamos aquí para ayudarte a mejorar tu experiencia con MedellínBot.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-primary-500/50 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Mail className="w-24 h-24 text-secondary-900 dark:text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-secondary-900 dark:text-white">Envíanos un mensaje</h3>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  Respondemos usualmente en menos de 24 horas.
                </p>
                <a href="mailto:daalvarezherr@unadvirtual.edu.co" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                  daalvarezherr@unadvirtual.edu.co
                </a>
              </div>

              <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-primary-500/50 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageSquare className="w-24 h-24 text-secondary-900 dark:text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-secondary-900 dark:text-white">Chat en Vivo</h3>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  Usa nuestro asistente virtual para respuestas inmediatas.
                </p>
                <Button asChild className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25">
                  <Link href="/chat">Iniciar Chat</Link>
                </Button>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-8 rounded-3xl shadow-xl"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-secondary-700 dark:text-secondary-300 ml-1">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-secondary-400" />
                    <input
                      type="text"
                      id="name"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-secondary-900/50 border border-secondary-200 dark:border-secondary-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-secondary-900 dark:text-white placeholder:text-secondary-400"
                      placeholder="Juan Pérez"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-secondary-700 dark:text-secondary-300 ml-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-secondary-400" />
                    <input
                      type="email"
                      id="email"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-secondary-900/50 border border-secondary-200 dark:border-secondary-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-secondary-900 dark:text-white placeholder:text-secondary-400"
                      placeholder="juan@ejemplo.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-secondary-700 dark:text-secondary-300 ml-1">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full p-4 rounded-xl bg-white/50 dark:bg-secondary-900/50 border border-secondary-200 dark:border-secondary-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none text-secondary-900 dark:text-white placeholder:text-secondary-400"
                    placeholder="¿Cómo podemos ayudarte?"
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full py-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Enviar Mensaje
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
