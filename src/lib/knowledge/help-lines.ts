/**
 * Help lines verified on official pages on 2026-09-28. Update `verifiedAt` whenever they are re-checked.
 */

export type HelpLineCategory = 'emergencia' | 'salud-mental' | 'violencia' | 'ninez' | 'citas';

export interface HelpLine {
  id: string;
  name: string;
  number: string;
  /** Value for the tel: / wa.me link. */
  dial: string;
  kind?: 'phone' | 'whatsapp';
  category: HelpLineCategory;
  description: string;
  hours: string;
  source: string;
}

export const HELP_LINES_VERIFIED_AT = '2026-09-28';

export const HELP_LINES: HelpLine[] = [
  {
    id: '123',
    name: 'Línea única de emergencias',
    number: '123',
    dial: '123',
    category: 'emergencia',
    description: 'Ambulancias, bomberos y policía. Llama si hay riesgo para la vida.',
    hours: '24 horas · gratuita',
    source: 'https://www.medellin.gov.co/es/secretaria-de-salud/salud-mental/',
  },
  {
    id: 'linea-amiga',
    name: 'Línea Amiga Saludable',
    number: '604 444 44 48',
    dial: '+576044444448',
    category: 'salud-mental',
    description: 'Apoyo psicológico de la Alcaldía de Medellín: ansiedad, depresión, crisis, consumo de sustancias.',
    hours: '24 horas',
    source:
      'https://www.medellin.gov.co/es/secretaria-juventud/sistema-de-alertas-tempranas-de-medellin-satmed/rutas-de-atencion-en-caso-de-vulneracion-de-derechos/',
  },
  {
    id: '106',
    name: 'Línea 106 · Salud mental',
    number: '106',
    dial: '106',
    category: 'salud-mental',
    description: 'Línea nacional del Ministerio de Salud para escucha y orientación en salud mental.',
    hours: '24 horas · gratuita desde fijo o celular',
    source: 'https://www.minsalud.gov.co/salud/publica/salud-mental/Paginas/linea-106.aspx',
  },
  {
    id: '155',
    name: 'Línea 155 · Mujeres',
    number: '155',
    dial: '155',
    category: 'violencia',
    description: 'Orientación a mujeres víctimas de violencia (Policía Nacional). En Medellín también: 123 Mujer.',
    hours: '24 horas · gratuita',
    source:
      'https://www.medellin.gov.co/es/secretaria-juventud/sistema-de-alertas-tempranas-de-medellin-satmed/rutas-de-atencion-en-caso-de-vulneracion-de-derechos/',
  },
  {
    id: '141',
    name: 'Línea 141 · ICBF',
    number: '141',
    dial: '141',
    category: 'ninez',
    description: 'Denuncia y orientación si un niño, niña o adolescente está en riesgo.',
    hours: '24 horas · gratuita',
    source: 'https://www.icbf.gov.co/linea-141',
  },
  {
    id: '122',
    name: 'Fiscalía · Línea 122',
    number: '122',
    dial: '122',
    category: 'violencia',
    description: 'Denuncias. Opción 1: violencia de género o intrafamiliar. Opción 7: personas desaparecidas.',
    hours: '24 horas · gratuita',
    source:
      'https://www.medellin.gov.co/es/secretaria-juventud/sistema-de-alertas-tempranas-de-medellin-satmed/rutas-de-atencion-en-caso-de-vulneracion-de-derechos/',
  },
  {
    id: 'metrosalud-whatsapp',
    name: 'Metrosalud · Citas por WhatsApp',
    number: '304 238 0460',
    dial: '573042380460',
    kind: 'whatsapp',
    category: 'citas',
    description: 'Asignación de citas en la red pública de Medellín.',
    hours: 'Horario de atención de Metrosalud',
    source: 'https://metrosalud.gov.co/asignacion-de-citas/',
  },
  {
    id: 'metrosalud-citas',
    name: 'Metrosalud · Citas telefónicas',
    number: '604 445 6002',
    dial: '+576044456002',
    category: 'citas',
    description: 'Línea de citas de Metrosalud (indicada para afiliados a Savia Salud).',
    hours: 'Horario de atención de Metrosalud',
    source: 'https://metrosalud.gov.co/asignacion-de-citas/',
  },
  {
    id: 'metrosalud-gratuita',
    name: 'Metrosalud · Línea gratuita',
    number: '01 8000 513 123',
    dial: '018000513123',
    category: 'citas',
    description: 'Información y atención al usuario de Metrosalud. Conmutador: 604 511 7505.',
    hours: 'Horario de atención de Metrosalud',
    source: 'https://metrosalud.gov.co/asignacion-de-citas/',
  },
];

export const HELP_CATEGORY_LABELS: Record<HelpLineCategory, string> = {
  emergencia: 'Emergencias',
  'salud-mental': 'Salud mental',
  violencia: 'Violencia y denuncias',
  ninez: 'Niñez y adolescencia',
  citas: 'Citas en la red pública',
};

export function helpLineHref(line: HelpLine): string {
  return line.kind === 'whatsapp' ? `https://wa.me/${line.dial}` : `tel:${line.dial}`;
}

/** Warning signs that justify going to urgencias or calling 123 (general public guidance, not a diagnosis). */
export const WARNING_SIGNS = [
  { title: 'Dolor en el pecho', body: 'Opresivo, que se irradia al brazo, cuello o mandíbula, o con sudor frío.' },
  { title: 'Dificultad para respirar', body: 'Ahogo en reposo, labios morados o no poder completar frases.' },
  { title: 'Señales de ataque cerebral', body: 'Cara caída, debilidad de un brazo, habla confusa. Cada minuto cuenta.' },
  { title: 'Pérdida de conciencia o convulsiones', body: 'Desmayo, confusión súbita o convulsión que no cede.' },
  { title: 'Sangrado abundante', body: 'Que no se detiene con presión, o vómito o heces con sangre.' },
  { title: 'Fiebre en bebés', body: 'Menores de 3 meses con fiebre, o niños decaídos que no reciben líquidos.' },
  { title: 'Alarma por dengue', body: 'Dolor abdominal fuerte, vómito persistente, sangrado de encías o somnolencia.' },
  { title: 'Riesgo de hacerse daño', body: 'Pensamientos de suicidio o de hacer daño a otros: llama al 123 o al 106.' },
];
