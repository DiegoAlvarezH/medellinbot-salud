import type { AqiLevel } from '@/types';

/**
 * Colombian Air Quality Index (ICA) as defined by Resolución 2254 de 2017 (MinAmbiente),
 * the same scale SIATA publishes for the Valle de Aburrá.
 */
interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
  { cLow: 13, cHigh: 37, iLow: 51, iHigh: 100 },
  { cLow: 38, cHigh: 55, iLow: 101, iHigh: 150 },
  { cLow: 56, cHigh: 150, iLow: 151, iHigh: 200 },
  { cLow: 151, cHigh: 250, iLow: 201, iHigh: 300 },
  { cLow: 251, cHigh: 500, iLow: 301, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
];

function interpolate(concentration: number, table: Breakpoint[]): number {
  const c = Math.max(0, concentration);
  const row = table.find((b) => c <= b.cHigh + 0.999) ?? table[table.length - 1];
  const clamped = Math.min(c, row.cHigh);
  return Math.round(((row.iHigh - row.iLow) / (row.cHigh - row.cLow)) * (clamped - row.cLow) + row.iLow);
}

export function icaFromPm25(pm25: number): number {
  return interpolate(pm25, PM25_BREAKPOINTS);
}

export function icaFromPm10(pm10: number): number {
  return interpolate(pm10, PM10_BREAKPOINTS);
}

export interface AqiCategory {
  level: AqiLevel;
  label: string;
  /** Tailwind token used for text / dots. */
  tone: 'green' | 'yellow' | 'orange' | 'red' | 'purple';
  summary: string;
  general: string;
  sensitive: string;
}

const CATEGORIES: Array<AqiCategory & { max: number }> = [
  {
    max: 50,
    level: 'good',
    label: 'Buena',
    tone: 'green',
    summary: 'El aire está limpio.',
    general: 'Disfruta tus actividades al aire libre con normalidad.',
    sensitive: 'Sin restricciones.',
  },
  {
    max: 100,
    level: 'acceptable',
    label: 'Aceptable',
    tone: 'yellow',
    summary: 'Calidad aceptable para la mayoría.',
    general: 'Puedes hacer actividad física al aire libre.',
    sensitive: 'Si eres muy sensible, reduce el ejercicio intenso y prolongado en exteriores.',
  },
  {
    max: 150,
    level: 'sensitive',
    label: 'Dañina para grupos sensibles',
    tone: 'orange',
    summary: 'Riesgo para niños, adultos mayores, gestantes y personas con enfermedades respiratorias o cardíacas.',
    general: 'Reduce el ejercicio intenso al aire libre, sobre todo cerca de vías con alto tráfico.',
    sensitive: 'Evita la actividad física en exteriores y ten a mano tus medicamentos (p. ej. inhaladores).',
  },
  {
    max: 200,
    level: 'unhealthy',
    label: 'Dañina',
    tone: 'red',
    summary: 'Toda la población puede tener efectos en la salud.',
    general: 'Evita el ejercicio al aire libre. Considera usar tapabocas de alta eficiencia en exteriores.',
    sensitive: 'Permanece en interiores con ventanas cerradas y consulta si presentas síntomas.',
  },
  {
    max: Number.POSITIVE_INFINITY,
    level: 'very-unhealthy',
    label: 'Muy dañina',
    tone: 'purple',
    summary: 'Alerta sanitaria: efectos graves en la salud.',
    general: 'Permanece en interiores y sigue las indicaciones de las autoridades.',
    sensitive: 'Busca atención médica ante dificultad para respirar o dolor en el pecho.',
  },
];

export function aqiCategory(ica: number): AqiCategory {
  const { level, label, tone, summary, general, sensitive } =
    CATEGORIES.find((category) => ica <= category.max) ?? CATEGORIES[CATEGORIES.length - 1];
  return { level, label, tone, summary, general, sensitive };
}

export const AQI_SCALE = CATEGORIES.map(({ label, tone, max }, index) => ({
  label,
  tone,
  range: index === CATEGORIES.length - 1 ? '201+' : `${index === 0 ? 0 : CATEGORIES[index - 1].max + 1}–${max}`,
}));

export interface UvCategory {
  label: string;
  tone: 'green' | 'yellow' | 'orange' | 'red' | 'purple';
  advice: string;
}

/** WHO UV index categories. Medellín regularly reaches "muy alto" around noon. */
export function uvCategory(uv: number): UvCategory {
  if (uv < 3) return { label: 'Bajo', tone: 'green', advice: 'No necesitas protección especial.' };
  if (uv < 6) return { label: 'Moderado', tone: 'yellow', advice: 'Usa bloqueador y gafas si vas a estar al sol.' };
  if (uv < 8) return { label: 'Alto', tone: 'orange', advice: 'Bloqueador FPS 30+, sombrero y busca sombra al mediodía.' };
  if (uv < 11) return { label: 'Muy alto', tone: 'red', advice: 'Evita el sol entre 10 a. m. y 3 p. m.; bloqueador cada 2 horas.' };
  return { label: 'Extremo', tone: 'purple', advice: 'Evita exponerte al sol. Protección máxima si debes salir.' };
}
