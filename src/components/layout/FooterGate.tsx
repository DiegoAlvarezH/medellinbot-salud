'use client';

import { usePathname } from 'next/navigation';

/** Full-height app screens (chat, map) hide the site footer. */
const APP_SCREENS = ['/chat', '/mapa'];

export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return APP_SCREENS.includes(pathname) ? null : <>{children}</>;
}
