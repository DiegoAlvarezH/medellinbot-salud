'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Menu, X, Sparkles, Activity } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AirQualityBadge } from '@/components/shared/AirQualityBadge';
import { mockAirQualityData } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/chat', label: 'Chat' },
    { href: '/mapa', label: 'Mapa' },
    { href: '/acerca', label: 'Acerca' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300 border-b border-transparent',
        scrolled
          ? 'glass-panel shadow-sm border-secondary-200/50 dark:border-secondary-800/50'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto">
        <div className="flex h-20 items-center justify-between px-4">
          {/* Logo - Enhanced */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/30 transition-all duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white dark:border-secondary-900"></div>
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-2xl leading-none tracking-tight text-secondary-900 dark:text-white">
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 bg-clip-text text-transparent">
                  Medellín
                </span>
                Bot
              </h1>
              <div className="text-xs font-medium text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-primary-500" />
                Salud Pública
              </div>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-white/50 dark:bg-secondary-900/50 backdrop-blur-sm p-1.5 rounded-full border border-secondary-200/50 dark:border-secondary-700/50 shadow-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-5 py-2.5 text-sm font-medium transition-colors group"
              >
                <span
                  className={cn(
                    'relative z-10 transition-colors duration-300',
                    pathname === link.href
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-secondary-600 dark:text-secondary-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                  )}
                >
                  {link.label}
                </span>
                {pathname === link.href && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-white dark:bg-secondary-800 rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Air Quality Badge */}
            {(pathname === '/chat' || pathname === '/mapa') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden lg:block"
              >
                <AirQualityBadge data={mockAirQualityData} />
              </motion.div>
            )}

            {/* Theme Toggle - Enhanced */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative rounded-full w-10 h-10 bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
              >
                <Sun className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-amber-500" />
                <Moon className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-blue-600" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full w-10 h-10 bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full Screen Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-0 top-[80px] p-4 z-40"
          >
            <div className="glass-panel rounded-3xl p-4 shadow-2xl border border-secondary-200/50 dark:border-secondary-700/50">
              <nav className="space-y-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-6 py-4 rounded-2xl text-base font-semibold transition-all',
                        pathname === link.href
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm'
                          : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                      )}
                    >
                      {link.label}
                      {pathname === link.href && (
                        <motion.div
                          layoutId="mobile-indicator"
                          className="w-2 h-2 rounded-full bg-primary-500"
                        />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              
              <div className="mt-6 pt-6 border-t border-secondary-100 dark:border-secondary-800">
                <div className="flex items-center justify-center gap-4 text-sm text-secondary-500">
                  <span>© 2024 MedellínBot</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
