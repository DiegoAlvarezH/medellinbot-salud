import 'server-only';
import { aqiCategory, uvCategory } from '@/lib/air-quality';
import { formatDistance, type LatLng } from '@/lib/geo';
import { formatHours, isOpenAt } from '@/lib/opening-hours';
import { formatPhone } from '@/lib/phone';
import { SERVICE_TYPE_META } from '@/lib/services-meta';
import { HELP_LINES, WARNING_SIGNS } from '@/lib/knowledge/help-lines';
import { PAI_SOURCE_URL, VACCINATION_NOTES, VACCINATION_STAGES } from '@/lib/knowledge/vaccination';
import { getAirQuality, getHydrology } from '@/lib/server/environment';
import { getHealthNetwork, getPlaces, getReps } from '@/lib/server/health-network';
import { getIndicators } from '@/lib/server/indicators';
import { searchMedicines } from '@/lib/server/medicines';
import { getWeather } from '@/lib/server/sources/open-meteo';
import { searchServices } from '@/lib/service-search';
import type { ChatCards, HealthService } from '@/types';

export type Intent =
  | 'emergency'
  | 'services'
  | 'air'
  | 'weather'
  | 'vaccination'
  | 'mental-health'
  | 'violence'
  | 'appointments'
  | 'indicators'
  | 'medicines'
  | 'hydrology'
  | 'water'
  | 'insurance';

const INTENT_PATTERNS: Record<Intent, RegExp> = {
  emergency:
    /\b(emergencia|urgente|infarto|no (puede|puedo) respirar|ahog|convuls|desmay|inconscien|sangr(a|ado) (mucho|abundante)|accidente|derrame|acv|dolor (fuerte )?(en el|de) pecho|envenen|intoxica)/,
  services:
    /\b(hospital|cl[ií]nica|urgencias?|farmacia|droguer[ií]a|medicamento|centro de salud|ips|metrosalud|odont|dentist|muela|diente|laborator|examen|m[eé]dico|consultorio|d[oó]nde|cerca|cercan|atender|atienden|atenci[oó]n|pediatr|ginec|obstetr|psic[oó]log|psiquiatr|oftalm|dermat|cardi[oó]log|oncol|fisioterap|vacunator|abiert)/,
  air: /\b(aire|contamina|pm ?2|pm ?10|ica\b|smog|siata|correr|ejercicio|bicicleta|respirar|asma|tapabocas|pico y placa ambiental)/,
  weather: /\b(clima|lluvia|llover|sol\b|uv|bloqueador|protector solar|calor|temperatura|fr[ií]o)/,
  vaccination: /\b(vacun|esquema|pai\b|refuerzo|dosis|carn[eé])/,
  'mental-health': /\b(ansie|depre|triste|suicid|matarme|salud mental|psic[oó]l|estr[eé]s|p[aá]nico|soledad|angustia|no quiero vivir)/,
  violence: /\b(violencia|maltrat|abus|golpe|agresi|acoso|violaci|denunci)/,
  appointments: /\b(cita|agendar|pedir turno|eps|afiliad|sisb[eé]n|savia)/,
  indicators: /\b(dengue|casos|estad[ií]stic|indicador|cobertura|sivigila|epidemi|brote|suicidio|mortalidad|muertes)/,
  medicines:
    /\b(medicament|medicina|pastilla|remedio|invima|registro sanitario|venta libre|sin formula|formula medica|jarabe|capsula|tableta|precio (del?|de la)|cuanto (cuesta|vale))/,
  hydrology: /\b(lluvi|llov|aguacero|tormenta|inundac|crecient|quebrada|rio medellin|deslizamiento|derrumbe)/,
  water: /\b(agua (de la llave|del grifo|potable|de epm)|tomar agua|calidad del agua|irca|acueducto)/,
  insurance: /\b(eps|afiliad|regimen (subsidiado|contributivo)|sisben|savia|sura|nueva eps|salud total|sanitas)/,
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

/** Words that describe the question, not the medicine being asked about. */
const MEDICINE_STOPWORDS = new Set(
  'medicamento medicamentos medicina pastilla pastillas remedio invima registro sanitario venta libre formula medica necesita necesito puedo comprar tomar cuanto cuesta precio jarabe capsulas tabletas sirve donde'.split(' '),
);

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

/** Follow-up questions ("¿y en Envigado?", "¿cuál está abierto?") keep the previous topic. */
function isFollowUp(query: string): boolean {
  const q = fold(query).trim();
  return q.split(/\s+/).length <= 6 && /^(y|e|pero|entonces|cual|cuales|alguno|alguna|otro|otra|mas|y si)\b|abiert|cerca|en [a-z]/.test(q);
}

function followUpsFor(intents: Set<Intent>, hasLocation: boolean): string[] {
  const out: string[] = [];
  if (intents.has('services')) {
    out.push('¿Cuál está abierto ahora?');
    out.push(hasLocation ? '¿Cómo llego en transporte público?' : '¿Y en Envigado?');
  }
  if (intents.has('air')) out.push('¿Qué estación tiene peor aire?', '¿Puedo sacar a mi bebé?');
  if (intents.has('weather') && !intents.has('air')) out.push('¿A qué hora es más fuerte el sol?');
  if (intents.has('vaccination')) out.push('¿Dónde me puedo vacunar cerca?');
  if (intents.has('mental-health')) out.push('¿Dónde hay atención psicológica cerca?');
  if (intents.has('indicators')) out.push('¿Cómo prevengo el dengue?');
  if (intents.has('medicines')) out.push('¿Es de venta libre?', '¿Tiene precio regulado?');
  if (intents.has('hydrology')) out.push('¿Hay quebradas en alerta?');
  if (!out.length) out.push('Urgencias cerca de mí', '¿Cómo está el aire hoy?');
  return out.slice(0, 3);
}

export async function retrieveContext(query: string, location?: LatLng, previousQueries: string[] = []): Promise<RetrievedContext> {
  const intents = detectIntents(query);
  const previousIntents = previousQueries.length ? detectIntents(previousQueries[previousQueries.length - 1]) : new Set<Intent>();
  if (!intents.has('services') && previousIntents.has('services') && isFollowUp(query)) intents.add('services');
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
      Promise.all([getHealthNetwork(), getPlaces().catch(() => [])]).then(([network, places]) => {
        const { services, place, ordering, plan } = searchServices({ services: network.services, places, query, previousQueries, location });
        if (!services.length) return;
        sections.push(
          ordering === 'user-location'
            ? 'Resultados ordenados por distancia a la ubicación actual del usuario.'
            : ordering === 'place'
              ? `Lugar mencionado: ${place!.name}. Resultados ordenados por cercanía a ese sector.`
              : 'El usuario NO compartió ubicación ni barrio: las opciones están repartidas por la ciudad. Pídele su barrio o que permita la ubicación para recomendar lo más cercano.',
        );
        if (plan.specialty) sections.push(`Especialidad buscada: ${plan.specialty.label}. Los primeros resultados la mencionan en su nombre; los demás son servicios generales que pueden remitir. Recomienda confirmar la agenda por teléfono.`);
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

  if (intents.has('medicines')) {
    // Try the longest words first: "¿el losartán necesita fórmula?" → "losartan".
    const candidates = fold(query)
      .replace(/[^a-z ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 5 && !MEDICINE_STOPWORDS.has(w))
      .sort((a, b) => b.length - a.length)
      .slice(0, 3);
    tasks.push(
      (async () => {
        for (const word of candidates) {
          const result = await searchMedicines(word).catch(() => null);
          if (!result || !result.products.length) continue;
          const otc = result.otc.length > 0;
          const price = result.prices[0];
          sections.push(
            [
              `MEDICAMENTO "${word}" (INVIMA y MinSalud, datos.gov.co):`,
              `- Venta libre según INVIMA: ${otc ? `sí (${result.otc.slice(0, 2).map((o) => [o.concentration, o.form].filter(Boolean).join(', ')).join('; ')})` : 'no aparece en el listado de venta libre (probablemente requiere fórmula médica)'}.`,
              `- Registros sanitarios vigentes (ejemplos): ${result.products.slice(0, 4).map((p) => `${p.product} — ${p.registration}`).join('; ')}.`,
              price
                ? `- Precio máximo regulado (${price.circular}): ${price.medicine} → ${price.commercial ? `farmacia $${price.commercial}` : ''}${price.institutional ? ` institucional $${price.institutional}` : ''} COP.`
                : '- No tiene precio máximo regulado (precio libre).',
              `- Página para consultar más: /medicamentos?q=${encodeURIComponent(word)}`,
            ].join('\n'),
          );
          summary.push(
            `**${word.charAt(0).toUpperCase()}${word.slice(1)}**: ${otc ? 'de venta libre' : 'probablemente requiere fórmula médica'}${price?.commercial ? ` · precio máximo en farmacia $${price.commercial.toLocaleString('es-CO')}` : ''}. [Ver detalle](/medicamentos?q=${encodeURIComponent(word)})`,
          );
          break;
        }
      })(),
    );
  }

  if (intents.has('hydrology')) {
    tasks.push(
      getHydrology()
        .then(({ rain, levels }) => {
          const heaviest = rain.heaviest.slice(0, 3).map((g) => `${g.name} (${g.municipality}) ${g.last15min} mm`).join('; ');
          const flagged = [...levels.alert, ...levels.watch].slice(0, 5).map((l) => `${l.name} (${l.municipality}, ${l.status})`).join('; ');
          sections.push(
            `LLUVIA Y QUEBRADAS (SIATA, tiempo real, ${rain.updatedAt ?? ''}):\n- Lloviendo en ${rain.raining.length} de ${rain.gauges} pluviómetros en los últimos 15 min.${heaviest ? ` Más intensa: ${heaviest}.` : ''}\n- Estaciones de nivel en alerta: ${levels.alert.length}; en precaución: ${levels.watch.length}.${flagged ? ` ${flagged}.` : ''}\n- Recomendación ante crecientes: no cruzar quebradas crecidas, alejarse de las orillas y llamar al 123 en emergencia.`,
          );
          summary.push(
            `Lluvia: **${rain.raining.length} de ${rain.gauges}** pluviómetros del SIATA registran lluvia ahora. Quebradas en alerta: **${levels.alert.length}**, en precaución: **${levels.watch.length}**.`,
          );
        })
        .catch(() => undefined),
    );
  }

  if (intents.has('water') || intents.has('insurance')) {
    tasks.push(
      getIndicators()
        .then((ind) => {
          if (intents.has('water') && ind.water) {
            sections.push(
              `CALIDAD DEL AGUA (INS/SIVICAP, IRCA ${ind.water.year}): Medellín ${ind.water.irca} (${ind.water.risk}); urbano ${ind.water.urban ?? 'N/D'}, rural ${ind.water.rural ?? 'N/D'}. Escala: 0–5 sin riesgo, 5–14 bajo, 14–35 medio, 35–80 alto, >80 inviable. En zona rural o veredal con acueducto propio conviene hervir el agua.`,
            );
            summary.push(`Agua potable: IRCA **${ind.water.irca}** en ${ind.water.year} (**${ind.water.risk}**). En zona rural con acueducto veredal, hiérvela.`);
          }
          if (intents.has('insurance') && ind.eps) {
            const list = (items: typeof ind.eps.contributivo) => items.slice(0, 5).map((e) => `${e.eps} (${e.affiliates.toLocaleString('es-CO')})`).join(', ');
            sections.push(
              `EPS EN MEDELLÍN (ADRES, afiliados activos): contributivo: ${list(ind.eps.contributivo)}. Subsidiado: ${list(ind.eps.subsidiado)}. Para citas, autorizaciones o cambio de EPS la persona debe contactar a su EPS; en la red pública, Metrosalud atiende principalmente a Savia Salud.`,
            );
          }
        })
        .catch(() => undefined),
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

  cards.followUps = followUpsFor(intents, Boolean(location));
  return { intents, context: sections.join('\n\n'), summary, cards };
}
