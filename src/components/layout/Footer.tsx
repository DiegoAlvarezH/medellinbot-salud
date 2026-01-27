import { Heart, Mail, MapPin, Phone, FileText, Shield } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-secondary-900 dark:text-white">
              MedellínBot Salud
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-300 leading-relaxed mb-4">
              Tu asistente inteligente de salud pública para la ciudad de
              Medellín. Información confiable y actualizada 24/7.
            </p>
            <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-300">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Hecho con amor por UNAD</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-secondary-900 dark:text-white">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="text-sm text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Chat
                </Link>
              </li>
              <li>
                <Link
                  href="/mapa"
                  className="text-sm text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Mapa de Servicios
                </Link>
              </li>
              <li>
                <Link
                  href="/acerca"
                  className="text-sm text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Acerca de Nosotros
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-secondary-900 dark:text-white">
              Contacto
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary-600 dark:text-secondary-400" />
                <a
                  href="mailto:daalvarezherr@unadvirtual.edu.co"
                  className="text-sm text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  daalvarezherr@unadvirtual.edu.co
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary-600 dark:text-secondary-400" />
                <span className="text-sm text-secondary-600 dark:text-secondary-300">
                  Medellín, Colombia
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary-600 dark:text-secondary-400" />
                <span className="text-sm text-secondary-600 dark:text-secondary-300">
                  Emergencias: 123
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-secondary-200 dark:border-secondary-800 pt-8 mb-6">
          <div className="glass-panel rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800/50">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h4 className="font-bold text-sm mb-2 text-secondary-900 dark:text-white">
                  Aviso Médico Importante
                </h4>
                <p className="text-xs text-secondary-700 dark:text-secondary-300 leading-relaxed">
                  Este chatbot NO proporciona diagnósticos médicos ni reemplaza
                  consultas con profesionales de la salud. La información es de
                  carácter general y educativo. En emergencias, llame al 123.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-secondary-200 dark:border-secondary-800">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            © {new Date().getFullYear()} MedellínBot Salud. Todos los derechos
            reservados.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacidad"
              className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
