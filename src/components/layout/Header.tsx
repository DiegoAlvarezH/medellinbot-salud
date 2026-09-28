'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Phone, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { NAV_ITEMS } from '@/lib/config/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/Logo';

const subscribeNoop = () => () => {};

/** True only after hydration, so theme-dependent UI never mismatches the server render. */
function useHydrated() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const isDark = hydrated && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="grid size-8 place-items-center rounded-full text-label-secondary transition-colors hover:bg-fill hover:text-label"
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

const MOBILE_ITEMS = [{ href: '/', label: 'Inicio', description: '' }, ...NAV_ITEMS];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="glass sticky top-0 z-[1000] border-b border-separator">
      <div className="container-page flex h-12 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-label" onClick={() => setOpen(false)}>
          <Logo className="size-6" />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">MedellínBot</span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-0.5 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'rounded-full px-3 py-1 text-[13px] transition-colors',
                isActive(item.href) ? 'font-medium text-label' : 'text-label-secondary hover:text-label',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/emergencias"
            className="flex h-8 items-center gap-1.5 rounded-full bg-red px-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Phone className="size-3.5" aria-hidden="true" />
            Emergencias
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full text-label hover:bg-fill md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-movil"
            aria-label="Menú móvil"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'calc(100dvh - 3rem)' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-y-auto bg-bg md:hidden"
          >
            <ul className="container-page pt-2 pb-10">
              {MOBILE_ITEMS.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * index }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block border-b border-separator py-3.5 text-[24px] font-semibold tracking-[-0.02em]',
                      isActive(item.href) ? 'text-accent' : 'text-label',
                    )}
                  >
                    {item.label}
                    {item.description && (
                      <span className="block text-[14px] font-normal tracking-normal text-label-secondary">
                        {item.description}
                      </span>
                    )}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
