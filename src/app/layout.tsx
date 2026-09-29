import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FooterGate } from '@/components/layout/FooterGate';
import { LocationProvider } from '@/components/location/LocationProvider';
import './globals.css';

// Inter is only a fallback: Apple devices render SF Pro through the system font stack.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'MedellínBot Salud',
    template: '%s · MedellínBot Salud',
  },
  description:
    'Asistente de salud pública para Medellín: centros de salud cercanos, calidad del aire, vacunación, líneas de emergencia y datos abiertos oficiales.',
  keywords: ['salud', 'Medellín', 'Valle de Aburrá', 'IPS', 'vacunación', 'calidad del aire', 'SIATA', 'datos abiertos'],
  manifest: '/manifest.json',
  applicationName: 'MedellínBot Salud',
  appleWebApp: { capable: true, title: 'MedellínBot', statusBarStyle: 'default' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Mobile keyboards shrink the layout instead of covering the chat composer.
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
          >
            Saltar al contenido
          </a>
          <LocationProvider>
          <div className="flex min-h-dvh flex-col">
            <Header />
            <main id="contenido" className="flex-1">
              {children}
            </main>
            <FooterGate>
              <Footer />
            </FooterGate>
          </div>
          </LocationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
