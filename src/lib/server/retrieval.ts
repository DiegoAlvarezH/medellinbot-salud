import 'server-only';
import { aqiCategory, uvCategory } from '@/lib/air-quality';
import { distanceMeters, formatDistance, type LatLng } from '@/lib/geo';
import { formatHours, isOpenAt } from '@/lib/opening-hours';
import { formatPhone } from '@/lib/phone';
import { SERVICE_TYPE_META } from '@/lib/services-meta';
import { HELP_LINES, WARNING_SIGNS } from '@/lib/knowledge/help-lines';
import { PAI_SOURCE_URL, VACCINATION_NOTES, VACCINATION_STAGES } from '@/lib/knowledge/vaccination';
import { getAirQuality } from '@/lib/server/environment';
import { getHealthNetwork, getPlaces, getReps } from '@/lib/server/health-network';
import { getIndicators } from '@/lib/server/indicators';
import { getWeather } from '@/lib/server/sources/open-meteo';
import type { ChatCards, HealthService, Place, ServiceType } from '@/types';

export type Intent =
  | 'emergency'
  | 'services'
  | 'air'
  | 'weather'
  | 'vaccination'
  | 'mental-health'
  | 'violence'
  | 'appointments'
  | 'indicators';

const INTENT_PATTERNS: Record<Intent, RegExp> = {
  emergency:
    /\b(emergencia|urgente|infarto|no (puede|puedo) respirar|ahog|convuls|desmay|inconscien|sangr(a|ado) (mucho|abundante)|accidente|derrame|acv|dolor (fuerte )?(en el|de) pecho|envenen|intoxica)/,
  services:
    /\b(hospital|cl[ií]nica|urgencias?|farmacia|droguer[ií]a|centro de salud|ips|metrosalud|odont|dentist|laborator|m[eé]dico|consultorio|d[oó]nde|cerca|cercan|atender|atenci[oó]n|pediatr|ginec|vacunator|abiert)/,
  air: /\b(aire|contamina|pm ?2|pm ?10|ica\b|smog|siata|correr|ejercicio|bicicleta|respirar|asma|tapabocas|pico y placa ambiental)/,
  weather: /\b(clima|lluvia|llover|sol\b|uv|bloqueador|protector solar|calor|temperatura|fr[ií]o)/,
  vaccination: /\b(vacun|esquema|pai\b|refuerzo|dosis|carn[eé])/,
  'mental-health': /\b(ansie|depre|triste|suicid|matarme|salud mental|psic[oó]l|estr[eé]s|p[aá]nico|soledad|angustia|no quiero vivir)/,
  violence: /\b(violencia|maltrat|abus|golpe|agresi|acoso|violaci|denunci)/,
  appointments: /\b(cita|agendar|pedir turno|eps|afiliad|sisb[eé]n|savia)/,
  indicators: /\b(dengue|casos|estad[ií]stic|indicador|cobertura|sivigila|epidemi|brote)/,
};

function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function detectIntents(query: string): Set<Intent> {
  const q = fold(query);
  const intents = new Set<Intent>();
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS) as Array<[Intent, RegExp]>) {
    if (pattern.test(q)) intents.add(intent);
  }
  if (intents.has('emergency')) intents.add('services');
  return intents;
}

function wantedTypes(q: string): ServiceType[] | null {
  if (/farmacia|droguer/.test(q)) return ['pharmacy'];
  if (/odont|dentist|muela|diente/.test(q)) return ['dentist'];
  if (/laborator|examen(es)? de sangre/.test(q)) return ['laboratory'];
  if (/urgencia|emergencia|hospital/.test(q)) return ['hospital', 'health-center', 'clinic'];
  if (/centro de salud|metrosalud|vacunator|vacun/.test(q)) return ['health-center'];
  return null;
}

const PLACE_STOPWORDS = new Set(
  'hola quiero necesito donde cerca cercano cercana cual cuales como para una un el la los las de del en que hay por favor mas salud centro hospital clinica farmacia urgencias ahora abierta abierto hoy barrio comuna medellin'.split(' '),
);

function describeService(s: HealthService): string {
  const parts = [
    `${s.name} (${SERVICE_TYPE_META[s.type].label}${s.isPublic ? ', red pública' : ''})`,
    s.address && `Dirección: ${s.address}${s.municipality ? `, ${s.municipality}` : ''}`,
    s.neighborhood && `Sector: ${s.neighborhood}`,
    s.phone && `Tel: ${formatPhone(s.phone)}`,
    s.hours && `Horario: ${formatHours(s.hours)}${isOpenAt(s.hours) === true ? ' (abierto ahora)' : isOpenAt(s.hours) === false ? ' (cerrado ahora)' : ''}`,
    s.distance !== undefined && `A ${formatDistance(s.distance)} del usuario`,
    s.transit && `Estación de Metro/Metrocable más cercana: ${s.transit.name} (${formatDistance(s.transit.distance)})`,
  ];
  return `- ${parts.filter(Boolean).join(' | ')}`;
}

/** Names too generic to be read as a place ("centro de salud" is not the Centro barrio). */
const AMBIGUOUS_PLACES = new Set(['centro', 'la salud', 'hospital', 'el hospital', 'la iguana', 'popular']);

/** Longest barrio / comuna / municipality name mentioned in the question, if any. */
async function resolvePlace(q: string): Promise<Place | undefined> {
  const places = await getPlaces().catch(() => [] as Place[]);
  // Compare on letters and digits only, padded with spaces, so matches are whole words.
  const words = (text: string) => ` ${fold(text).replace(/[^a-z0-9]+/g, ' ').trim()} `;
  const haystack = words(q);
  let best: { place: Place; length: number } | undefined;
  for (const place of places) {
    const name = words(place.name);
    if (name.length < 6 || AMBIGUOUS_PLACES.has(name.trim())) continue;
    if (haystack.includes(name) && (!best || name.length > best.length)) best = { place, length: name.length };
  }
  return best?.place;
}

async function findServices(query: string, location?: LatLng): Promise<{ services: HealthService[]; place?: Place }> {
  const q = fold(query);
  const { services } = await getHealthNetwork();
  const types = wantedTypes(q);
  let pool = types ? services.filter((s) => types.includes(s.type)) : services.filter((s) => s.type !== 'pharmacy');
  if (/abiert|ahora|24 ?h/.test(q)) {
    const open = pool.filter((s) => isOpenAt(s.hours) === true);
    if (open.length >= 3) pool = open;
  }

  if (location) {
    return {
      services: pool
        .map((s) => ({ ...s, distance: distanceMeters(location, s) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 6),
    };
  }

  // A named barrio or municipality ranks by distance to its centroid.
  const place = await resolvePlace(q);
  if (place) {
    return {
      place,
      services: pool
        .map((s) => ({ s, d: distanceMeters(place, s) }))
        .filter((x) => x.d < 2500)
        .sort((a, b) => a.d - b.d)
        .slice(0, 6)
        .map((x) => x.s),
    };
  }

  // Without GPS, rank by how well the question names a place (barrio, comuna, municipio) or the facility.
  const words = q.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !PLACE_STOPWORDS.has(w));
  if (words.length) {
    const scored = pool
      .map((s) => {
        const haystack = fold(`${s.name} ${s.neighborhood ?? ''} ${s.municipality ?? ''} ${s.address ?? ''}`);
        return { s, score: words.filter((w) => haystack.includes(w)).length };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    if (scored.length) return { services: scored.slice(0, 6).map((x) => x.s) };
  }

  // Generic question: prefer the public network and facilities with a phone number.
  return {
    services: pool
      .filter((s) => s.isPublic || s.phone)
      .sort((a, b) => Number(Boolean(b.isPublic)) - Number(Boolean(a.isPublic)))
      .slice(0, 6),
  };
}

async function searchReps(query: string): Promise<string[]> {
  const words = fold(query)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !PLACE_STOPWORDS.has(w));
  if (!words.length) return [];
  const reps = await getReps();
  return reps
    .map((r) => ({ r, score: words.filter((w) => fold(`${r.name} ${r.provider}`).includes(w)).length }))
    .filter((x) => x.score >= Math.min(2, words.length))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(
      ({ r }) =>
        `- ${r.name} — prestador: ${r.provider} (${r.nature}${r.ese ? ', ESE' : ''}) | ${r.address}, ${r.municipality}${r.phone ? ` | Tel: ${formatPhone(r.phone)}` : ''}`,
    );
}

export interface RetrievedContext {
  intents: Set<Intent>;
  /** Plain-text context injected into the model prompt. */
  context: string;
  /** Human-readable Markdown bullets, used when no model is available. */
  summary: string[];
  cards: ChatCards;
}

export async function retrieveContext(query: string, location?: LatLng): Promise<RetrievedContext> {
  const intents = detectIntents(query);
  const sections: string[] = [];
  const summary: string[] = [];
  const cards: ChatCards = {};

  const now = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'full', timeStyle: 'short' }).format(new Date());
  sections.push(`Fecha y hora en Medellín: ${now}. Ubicación del usuario: ${location ? 'compartida (distancias calculadas)' : 'no compartida'}.`);

  const tasks: Array<Promise<void>> = [];

  if (intents.has('emergency')) {
    cards.emergency = true;
    sections.push(`SEÑALES DE ALARMA (ir a urgencias o llamar al 123):\n${WARNING_SIGNS.map((w) => `- ${w.title}: ${w.body}`).join('\n')}`);
  }

  if (intents.has('services')) {
    tasks.push(
      findServices(query, location).then(({ services, place }) => {
        if (!services.length) return;
        if (place) sections.push(`Lugar mencionado: ${place.name} (resultados ordenados por cercanía a ese sector).`);
        cards.services = services.slice(0, 4);
        summary.push(
          ...services.slice(0, 4).map((s) => {
            const facts = [s.address, s.phone && `Tel. ${formatPhone(s.phone)}`, s.distance !== undefined && `a ${formatDistance(s.distance)}`];
            return `**${s.name}** — ${facts.filter(Boolean).join(' · ')}`;
          }),
        );
        sections.push(`SERVICIOS DE SALUD RELEVANTES (MEData/Metrosalud, REPS y OpenStreetMap):\n${services.map(describeService).join('\n')}`);
      }),
    );
    tasks.push(
      searchReps(query).then((rows) => {
        if (rows.length) sections.push(`COINCIDENCIAS EN EL REPS (Registro Especial de Prestadores, MinSalud):\n${rows.join('\n')}`);
      }),
    );
  }

  if (intents.has('air') || intents.has('weather')) {
    tasks.push(
      getAirQuality()
        .then((air) => {
          const category = aqiCategory(air.ica);
          if (intents.has('air')) cards.air = { ica: air.ica, label: air.label, level: air.level, pm25: air.pm25, updatedAt: air.updatedAt };
          summary.push(`Calidad del aire: **ICA ${air.ica} (${category.label})**. ${category.general}`);
          const worst = air.stations.filter((s) => s.ica !== null).slice(0, 3);
          sections.push(
            [
              `CALIDAD DEL AIRE (${air.source}, actualizado ${air.updatedAt}):`,
              `- ICA ciudad: ${air.ica} (${category.label}). PM2.5: ${air.pm25 ?? 'N/D'} µg/m³.`,
              `- Población general: ${category.general}`,
              `- Grupos sensibles (niños, adultos mayores, gestantes, enfermedades respiratorias o cardíacas): ${category.sensitive}`,
              worst.length ? `- Estaciones con peor ICA: ${worst.map((s) => `${s.name} (${s.municipality}) ${s.ica}`).join('; ')}` : '',
            ]
              .filter(Boolean)
              .join('\n'),
          );
        })
        .catch(() => undefined),
    );
    tasks.push(
      getWeather()
        .then((w) => {
          const uv = uvCategory(w.uvMax);
          summary.push(`Clima: ${w.temperature} °C, ${w.description.toLowerCase()}. UV máximo **${w.uvMax} (${uv.label})**: ${uv.advice}`);
          sections.push(
            `CLIMA (Open-Meteo): ${w.temperature} °C, ${w.description}, humedad ${w.humidity} %. Máx ${w.tempMax} °C / mín ${w.tempMin} °C. Probabilidad de lluvia ${w.rainProbability} %. UV máximo hoy ${w.uvMax} (${uv.label}): ${uv.advice}`,
          );
        })
        .catch(() => undefined),
    );
  }

  if (intents.has('vaccination')) {
    summary.push('Consulta las vacunas por edad en [Vacunación](/vacunacion). Son gratuitas en cualquier IPS vacunadora.');
    sections.push(
      `ESQUEMA NACIONAL DE VACUNACIÓN PAI (MinSalud, julio 2026, ${PAI_SOURCE_URL}):\n${VACCINATION_STAGES.map(
        (s) => `- ${s.label}: ${s.doses.map((d) => `${d.vaccine} (${d.dose}${d.note ? `; ${d.note}` : ''})`).join(', ')}`,
      ).join('\n')}\nNotas: ${VACCINATION_NOTES.join(' ')}\nPuntos de vacunación: centros de salud y unidades hospitalarias de Metrosalud y las IPS vacunadoras de cada EPS.`,
    );
  }

  if (intents.has('indicators')) {
    tasks.push(
      getIndicators()
        .then((ind) => {
          const dengue = ind.dengue.slice(-6).map((d) => `${d.year}: ${d.cases}`).join(', ');
          sections.push(
            `INDICADORES (datos.gov.co):\n- Dengue en Medellín por año (SIVIGILA/INS, últimos datos publicados): ${dengue}\n- Eventos más notificados en ${ind.topEvents.year}: ${ind.topEvents.items
              .slice(0, 5)
              .map((e) => `${e.event} (${e.cases})`)
              .join('; ')}\n- Cobertura de vacunación ${ind.vaccination.year}: ${ind.vaccination.items
              .slice(0, 6)
              .map((v) => `${v.vaccine} ${v.coverage}%`)
              .join('; ')}`,
          );
        })
        .catch(() => undefined),
    );
  }

  await Promise.all(tasks);

  // Help lines go last so live data leads both the prompt and the fallback answer.
  const lineIds = new Set<string>(['123']);
  if (intents.has('mental-health')) ['linea-amiga', '106'].forEach((id) => lineIds.add(id));
  if (intents.has('violence')) ['155', '141', '122'].forEach((id) => lineIds.add(id));
  if (intents.has('appointments') || intents.has('services')) ['metrosalud-whatsapp', 'metrosalud-citas'].forEach((id) => lineIds.add(id));
  const lines = HELP_LINES.filter((l) => lineIds.has(l.id));
  sections.push(
    `LÍNEAS DE AYUDA VERIFICADAS:\n${lines
      .map((l) => `- ${l.name}: ${l.number}${l.kind === 'whatsapp' ? ' (WhatsApp)' : ''} — ${l.description} (${l.hours})`)
      .join('\n')}`,
  );
  summary.push(
    ...lines
      .filter((l) => l.id !== '123' || intents.has('emergency'))
      .map((l) => `**${l.name}:** ${l.number}${l.kind === 'whatsapp' ? ' (WhatsApp)' : ''}`),
  );

  return { intents, context: sections.join('\n\n'), summary, cards };
}
