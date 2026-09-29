/**
 * Colombia's Programa Ampliado de Inmunizaciones (PAI) — free national schedule.
 * Source: MinSalud, "Esquema de vacunación Colombia", actualización julio 2026.
 */

export const PAI_SOURCE_URL =
  'https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/ET/afiche-esquema-vacunacion-col-2026.pdf';

export interface VaccineDose {
  vaccine: string;
  dose: string;
  note?: string;
}

export interface VaccinationStage {
  id: string;
  label: string;
  /** Age window in months used by the age finder; `null` for non-age groups (pregnancy). */
  fromMonths: number | null;
  toMonths: number | null;
  doses: VaccineDose[];
}

export const VACCINATION_STAGES: VaccinationStage[] = [
  {
    id: 'rn',
    label: 'Recién nacido',
    fromMonths: 0,
    toMonths: 1,
    doses: [
      { vaccine: 'BCG (tuberculosis)', dose: 'Única' },
      { vaccine: 'Hepatitis B', dose: 'Recién nacido', note: 'Idealmente en las primeras 12 horas.' },
    ],
  },
  {
    id: '2m',
    label: '2 meses',
    fromMonths: 2,
    toMonths: 3,
    doses: [
      { vaccine: 'Pentavalente (DPT, Hib, hepatitis B)', dose: '1.ª dosis' },
      { vaccine: 'Polio inyectable (VIP)', dose: '1.ª dosis' },
      { vaccine: 'Rotavirus', dose: '1.ª dosis', note: 'Máximo hasta los 3 meses y 21 días.' },
      { vaccine: 'Neumococo', dose: '1.ª dosis' },
    ],
  },
  {
    id: '4m',
    label: '4 meses',
    fromMonths: 4,
    toMonths: 5,
    doses: [
      { vaccine: 'Pentavalente', dose: '2.ª dosis' },
      { vaccine: 'Polio inyectable (VIP)', dose: '2.ª dosis' },
      { vaccine: 'Rotavirus', dose: '2.ª dosis', note: 'Máximo hasta los 11 meses y 29 días.' },
      { vaccine: 'Neumococo', dose: '2.ª dosis' },
    ],
  },
  {
    id: '6m',
    label: '6 meses',
    fromMonths: 6,
    toMonths: 6,
    doses: [
      { vaccine: 'Pentavalente', dose: '3.ª dosis' },
      { vaccine: 'Polio inyectable (VIP)', dose: '3.ª dosis' },
      { vaccine: 'Influenza', dose: '1.ª dosis' },
    ],
  },
  {
    id: '7m',
    label: '7 meses',
    fromMonths: 7,
    toMonths: 8,
    doses: [{ vaccine: 'Influenza', dose: '2.ª dosis', note: 'Luego una dosis cada año hasta los 5 años.' }],
  },
  {
    id: '9m',
    label: '9 meses',
    fromMonths: 9,
    toMonths: 11,
    doses: [{ vaccine: 'Fiebre amarilla', dose: 'Única', note: 'En todo el país, por la emergencia sanitaria vigente.' }],
  },
  {
    id: '12m',
    label: '12 meses',
    fromMonths: 12,
    toMonths: 17,
    doses: [
      { vaccine: 'Triple viral (sarampión, rubéola, paperas)', dose: '1.ª dosis' },
      { vaccine: 'Varicela', dose: '1.ª dosis' },
      { vaccine: 'Neumococo', dose: 'Refuerzo' },
      { vaccine: 'Hepatitis A', dose: 'Única' },
    ],
  },
  {
    id: '18m',
    label: '18 meses',
    fromMonths: 18,
    toMonths: 59,
    doses: [
      { vaccine: 'Pentavalente', dose: '1.er refuerzo' },
      { vaccine: 'Polio inyectable (VIP)', dose: '1.er refuerzo' },
      { vaccine: 'Triple viral', dose: '2.ª dosis' },
    ],
  },
  {
    id: '5a',
    label: '5 años',
    fromMonths: 60,
    toMonths: 107,
    doses: [
      { vaccine: 'DPT', dose: '2.º refuerzo' },
      { vaccine: 'Polio inyectable (VIP)', dose: '2.º refuerzo' },
      { vaccine: 'Varicela', dose: 'Refuerzo' },
    ],
  },
  {
    id: '9a',
    label: '9 a 17 años',
    fromMonths: 108,
    toMonths: 215,
    doses: [
      { vaccine: 'VPH (virus del papiloma humano)', dose: 'Única', note: 'Niñas y niños. Dos dosis si hay inmunosupresión.' },
      { vaccine: 'Dengue', dose: '2 dosis', note: 'A los 9 años, solo en municipios priorizados.' },
    ],
  },
  {
    id: 'mujeres',
    label: 'Mujeres de 10 a 49 años',
    fromMonths: 120,
    toMonths: 599,
    doses: [{ vaccine: 'Td (tétanos y difteria)', dose: '5 dosis', note: '0, 1 mes, 6 meses, 1 año y 1 año; luego cada 10 años.' }],
  },
  {
    id: 'gestantes',
    label: 'Gestantes',
    fromMonths: null,
    toMonths: null,
    doses: [
      { vaccine: 'COVID-19', dose: 'Desde la semana 12' },
      { vaccine: 'Influenza', dose: 'Desde la semana 14' },
      { vaccine: 'Tdap (tétanos, difteria, tos ferina)', dose: 'Desde la semana 20', note: 'En cada embarazo.' },
      { vaccine: 'Virus sincitial respiratorio (VSR)', dose: 'Semanas 28 a 36' },
    ],
  },
  {
    id: '60',
    label: '60 años o más',
    fromMonths: 720,
    toMonths: 1500,
    doses: [
      { vaccine: 'Influenza', dose: 'Anual' },
      { vaccine: 'Fiebre amarilla', dose: 'Única', note: 'Si vives o viajas a zonas de alto riesgo.' },
    ],
  },
];

export const VACCINATION_NOTES = [
  'Las vacunas del esquema nacional son gratuitas en cualquier IPS vacunadora, sin importar tu EPS o tu situación migratoria.',
  'Si se atrasó una dosis, no se reinicia el esquema: lleva el carné y el personal de salud completa lo que falte.',
  'La hexavalente puede reemplazar la pentavalente según los lineamientos del Ministerio de Salud.',
  'Hay esquemas de recuperación para niños de 1 a 5 años que no se vacunaron a tiempo.',
];

/** Stages that apply to someone of the given age, in months (pregnancy is handled separately). */
export function stagesForAge(months: number): VaccinationStage[] {
  return VACCINATION_STAGES.filter(
    (stage) => stage.fromMonths !== null && stage.toMonths !== null && months >= stage.fromMonths && months <= stage.toMonths,
  );
}
