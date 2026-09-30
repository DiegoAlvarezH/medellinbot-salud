/**
 * Ranking of health services for a free-text question.
 * Pure (no I/O) so it can be exercised against the data snapshots outside Next.js.
 */
import { distanceMeters, type LatLng } from '@/lib/geo';
import { isOpenAt } from '@/lib/opening-hours';
import type { HealthService, Place, ServiceType } from '@/types';

export function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface Specialty {
  id: string;
  label: string;
  /** Matches the question. */
  query: RegExp;
  /** Matches facility names that clearly offer it. */
  name: RegExp;
  types: ServiceType[];
}

const CARE: ServiceType[] = ['hospital', 'clinic', 'health-center'];

const SPECIALTIES: Specialty[] = [
  { id: 'pediatrics', label: 'pediatría', query: /pediatr|\bnin[oa]s?\b|\bbebe|infantil|mi hij[oa]/, name: /infantil|pediatr|\bnin[oa]s?\b|materno/, types: CARE },
  {
    id: 'mental',
    label: 'salud mental',
    query: /psicolog|psiquiatr|salud mental|ansiedad|depresi|adiccion|consumo de (drogas|sustancias)/,
    name: /mental|psic|psiqui|conducta|adiccion|samein|homo\b/,
    types: [...CARE, 'doctor'],
  },
  { id: 'womens', label: 'ginecología y obstetricia', query: /ginec|obstetr|embaraz|parto|prenatal|gestante/, name: /mujer|materno|ginec|obstet|fertil|perinat/, types: CARE },
  { id: 'oncology', label: 'oncología', query: /oncolog|cancer|quimio/, name: /oncolog|cancer/, types: CARE },
  { id: 'cardiology', label: 'cardiología', query: /cardio|corazon|infarto/, name: /cardio|corazon/, types: CARE },
  { id: 'eyes', label: 'oftalmología', query: /oftalm|\bojos?\b|\bvista\b|optometr/, name: /oftalm|\bojos?\b|vision|optic|optometr/, types: [...CARE, 'doctor', 'other'] },
  { id: 'skin', label: 'dermatología', query: /dermat|\bpiel\b|lunar/, name: /dermat|piel/, types: [...CARE, 'doctor'] },
  { id: 'kidney', label: 'nefrología', query: /rinon|renal|dialisis/, name: /renal|rinon|dialisis/, types: CARE },
  { id: 'rehab', label: 'rehabilitación', query: /fisioterap|rehabilit|terapia fisica/, name: /fisio|rehabilit/, types: [...CARE, 'doctor', 'other'] },
];

/** Sites that are not general medical care: never used as filler for general or other-specialty questions. */
const NON_GENERAL = /estetic|dermo|laser|\bspa\b|belleza|odonto|dental|dentix|sonrisa|optica|veterin|cirugia plastica|hospitalari[ao]s\b/;
/** Names that signal an emergency department (whole words: "Líneas Hospitalarias" is a shop). */
const EMERGENCY_NAME = /\burgencias?\b|\bunidad hospitalaria\b|\bhospital\b|\bclinica\b/;

/** Sites that plausibly have an emergency department (explicit tag, hospital, or Metrosalud hospital unit). */
export function isEmergencyCapable(s: HealthService): boolean {
  return Boolean(s.emergency) || ((s.type === 'hospital' || s.type === 'health-center') && EMERGENCY_NAME.test(fold(s.name)) && !NON_GENERAL.test(fold(s.name)));
}

export interface SearchPlan {
  types: ServiceType[];
  specialty?: Specialty;
  urgent: boolean;
  openNow: boolean;
  /** True when the question itself said what to look for (vs. inherited or default). */
  explicit: boolean;
}

function typesFor(q: string): { types: ServiceType[]; explicit: boolean; urgent: boolean } | null {
  const urgent = /urgencia|emergencia|urgente|grave|accidente/.test(q);
  if (/farmacia|droguer|medicamento/.test(q)) return { types: ['pharmacy'], explicit: true, urgent };
  if (/odont|dentist|muela|diente|ortodonc/.test(q)) return { types: ['dentist'], explicit: true, urgent };
  if (/laborator|examen(es)? (de sangre|de laboratorio)|prueba de sangre|toma de muestras/.test(q)) return { types: ['laboratory'], explicit: true, urgent };
  if (urgent || /hospital|clinica/.test(q)) return { types: ['hospital', 'clinic', 'health-center'], explicit: true, urgent };
  if (/centro de salud|metrosalud|vacunator|vacun|puesto de salud|medico general|consulta/.test(q)) {
    return { types: ['health-center', 'clinic', 'hospital'], explicit: true, urgent };
  }
  return null;
}

/** Builds the search plan, inheriting the topic from earlier questions for follow-ups ("¿y en Envigado?"). */
export function planSearch(query: string, previousQueries: string[] = []): SearchPlan {
  const q = fold(query);
  const openNow = /abiert|ahora mismo|24 ?h|de noche|madrugada/.test(q);
  for (const [index, text] of [q, ...previousQueries.map(fold).reverse()].entries()) {
    const specialty = SPECIALTIES.find((s) => s.query.test(text));
    const base = typesFor(text);
    if (specialty || base) {
      return {
        types: specialty && !base ? specialty.types : base!.types,
        specialty,
        urgent: base?.urgent ?? false,
        openNow,
        explicit: index === 0,
      };
    }
  }
  return { types: CARE, urgent: false, openNow, explicit: false };
}

/** Names too generic to be read as a place ("centro de salud" is not the Centro barrio). */
const AMBIGUOUS_PLACES = new Set(['centro', 'la salud', 'hospital', 'el hospital', 'la iguana', 'popular', 'la clinica', 'san vicente']);

const asWords = (text: string) => ` ${fold(text).replace(/[^a-z0-9]+/g, ' ').trim()} `;

/** Longest barrio / comuna / municipality named in the text, compared on whole words. */
export function resolvePlace(text: string, places: Place[]): Place | undefined {
  const haystack = asWords(text);
  let best: { place: Place; length: number } | undefined;
  for (const place of places) {
    const name = asWords(place.name);
    if (name.length < 6 || AMBIGUOUS_PLACES.has(name.trim())) continue;
    if (haystack.includes(name) && (!best || name.length > best.length)) best = { place, length: name.length };
  }
  return best?.place;
}

const GENERIC_NAME_WORDS = new Set(
  'drogueria droguerias farmacia farmacias laboratorio laboratorios clinico clinica medico medica sede la el los las de del y centro salud ips sas'.split(' '),
);

/** Chains (pharmacies, labs) repeat the same brand on every corner: keep one per brand. */
function brandKey(service: HealthService): string | null {
  if (service.type !== 'pharmacy' && service.type !== 'laboratory') return null;
  const token = fold(service.name)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .find((w) => w.length >= 4 && !GENERIC_NAME_WORDS.has(w));
  return token ? `${service.type}:${token}` : null;
}

function quality(service: HealthService, plan: SearchPlan, specialtyMatch: boolean): number {
  let score = 0;
  if (specialtyMatch) score += 3;
  if (plan.urgent && service.type === 'hospital') score += 2;
  if (plan.urgent && service.emergency) score += 1.5;
  if (service.phone) score += 1;
  if (service.repsCode) score += 1;
  if (service.hours) score += 0.5;
  if (service.isPublic) score += 0.5;
  if (service.address) score += 0.5;
  return score;
}

export interface SearchResult {
  services: HealthService[];
  plan: SearchPlan;
  place?: Place;
  /** How the list was ordered, for the model prompt. */
  ordering: 'user-location' | 'place' | 'city-wide';
}

interface SearchInput {
  services: HealthService[];
  places: Place[];
  query: string;
  previousQueries?: string[];
  location?: LatLng;
  limit?: number;
}

export function searchServices({ services, places, query, previousQueries = [], location, limit = 6 }: SearchInput): SearchResult {
  const plan = planSearch(query, previousQueries);
  const general = (s: HealthService) => !NON_GENERAL.test(fold(s.name));
  let pool = services.filter((s) => plan.types.includes(s.type));
  if (plan.types.includes('hospital') || plan.types.includes('health-center')) {
    pool = pool.filter((s) => general(s) || plan.specialty?.name.test(fold(s.name)));
  }
  if (plan.urgent) {
    // Urgencias: hospitals, sites tagged emergency=yes and Metrosalud's hospital units — not every clinic.
    const emergency = pool.filter(
      (s) => s.emergency || ((s.type === 'hospital' || s.type === 'health-center') && EMERGENCY_NAME.test(fold(s.name))),
    );
    if (emergency.length >= 3) pool = emergency;
  }

  if (plan.openNow) {
    const open = pool.filter((s) => isOpenAt(s.hours) === true);
    if (open.length >= 3) pool = open;
  }

  const matchesSpecialty = (s: HealthService) => Boolean(plan.specialty?.name.test(fold(s.name)));
  if (plan.specialty) {
    const specialised = pool.filter(matchesSpecialty);
    // Keep specialised sites plus general care as a fallback (general practice also refers to specialists).
    const otherSpecialty = (s: HealthService) => SPECIALTIES.some((sp) => sp.id !== plan.specialty!.id && sp.name.test(fold(s.name)));
    pool = [...specialised, ...pool.filter((s) => !matchesSpecialty(s) && !otherSpecialty(s) && s.type !== 'doctor')];
  }

  // Place: explicit in this question, otherwise inherited from the conversation when there is no GPS.
  const place = resolvePlace(query, places) ?? (location ? undefined : previousQueries.map((t) => resolvePlace(t, places)).filter(Boolean).at(-1));
  const origin = place ?? location;

  const scored = pool.map((service) => ({
    service,
    quality: quality(service, plan, matchesSpecialty(service)),
    distance: origin ? distanceMeters(origin, service) : undefined,
  }));

  let ordered: typeof scored;
  if (origin && plan.specialty) {
    // Specialised sites within a reasonable trip come first, then general care by distance.
    const byDistance = (a: (typeof scored)[number], b: (typeof scored)[number]) => a.distance! - b.distance!;
    const specialisedNear = scored.filter((x) => matchesSpecialty(x.service) && x.distance! < 8000).sort(byDistance).slice(0, 3);
    // General care as filler: stay near the named place, and list documented sites (phone, REPS…) before bare map pins.
    const radius = place ? 3500 : 8000;
    const general = scored.filter((x) => !specialisedNear.includes(x) && x.distance! <= radius).sort(byDistance);
    const documented = general.filter((x) => x.quality >= 1);
    ordered = [...specialisedNear, ...documented, ...general.filter((x) => x.quality < 1)];
    if (ordered.length < limit) ordered.push(...scored.filter((x) => !ordered.includes(x)).sort(byDistance));
  } else if (origin) {
    // Distance first, nudged by data quality: a well-documented hospital 1.2 km away beats an unnamed one at 1 km.
    const radius = place ? 3500 : Number.POSITIVE_INFINITY;
    const near = scored.filter((x) => x.distance! <= radius);
    ordered = (near.length >= 3 ? near : scored).sort(
      (a, b) => a.distance! * (1 - Math.min(a.quality, 6) * 0.08) - b.distance! * (1 - Math.min(b.quality, 6) * 0.08),
    );
  } else {
    // No location at all: best-documented sites, spread across the valley instead of one corner of it.
    const top = scored.sort((a, b) => b.quality - a.quality).slice(0, 60);
    ordered = [];
    while (ordered.length < Math.min(limit, top.length)) {
      let best = top[0];
      let bestScore = Number.NEGATIVE_INFINITY;
      for (const candidate of top) {
        if (ordered.includes(candidate)) continue;
        const spread = ordered.length ? Math.min(...ordered.map((o) => distanceMeters(o.service, candidate.service))) / 1000 : 0;
        // Mild spread bonus, capped so remote rural sites don't win just for being far away.
        const value = candidate.quality + Math.min(spread, 3) * 0.5;
        if (value > bestScore) {
          bestScore = value;
          best = candidate;
        }
      }
      ordered.push(best);
    }
  }

  const seenBrands = new Set<string>();
  const seenNames = new Set<string>();
  const result: HealthService[] = [];
  for (const { service, distance } of ordered) {
    const brand = brandKey(service);
    const name = fold(service.name);
    if ((brand && seenBrands.has(brand)) || seenNames.has(name)) continue;
    // The same facility mapped twice under slightly different names ("Hospital X" / "X").
    const nameTokens = name
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !GENERIC_NAME_WORDS.has(t) && t !== 'hospital');
    const duplicate = result.some((r) => {
      const shared = nameTokens.filter((t) => fold(r.name).includes(t)).length;
      const meters = distanceMeters(r, service);
      return (shared >= 1 && meters < 250) || (shared >= 2 && meters < 1500);
    });
    if (duplicate) continue;
    if (brand) seenBrands.add(brand);
    seenNames.add(name);
    result.push(location && distance !== undefined && !place ? { ...service, distance } : location ? { ...service, distance: distanceMeters(location, service) } : service);
    if (result.length >= limit) break;
  }

  return { services: result, plan, place, ordering: place ? 'place' : location ? 'user-location' : 'city-wide' };
}
