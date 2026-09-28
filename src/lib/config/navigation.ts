export interface NavItem {
  href: string;
  label: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/chat', label: 'Asistente', description: 'Pregunta en lenguaje natural' },
  { href: '/mapa', label: 'Mapa', description: 'Centros de salud y farmacias cerca de ti' },
  { href: '/aire', label: 'Aire y clima', description: 'Calidad del aire, UV y recomendaciones' },
  { href: '/vacunacion', label: 'Vacunación', description: 'Esquema nacional por edad' },
  { href: '/indicadores', label: 'Indicadores', description: 'Datos abiertos de salud pública' },
  { href: '/acerca', label: 'Acerca', description: 'Fuentes, metodología y aviso legal' },
];
