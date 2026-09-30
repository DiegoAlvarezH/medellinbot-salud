/**
 * Topic scope of the assistant. MedellínBot only answers about health and wellbeing in the
 * Valle de Aburrá; everything else (programming, cooking recipes, homework, trivia…) is declined.
 *
 * The primary check is an LLM classifier (src/lib/server/scope-guard.ts). This module holds the
 * deterministic parts: the heuristic used when no model is available, and the refusal message.
 */

export function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Topics that are clearly outside the assistant's purpose, with the label used in the refusal.
 * `strong` patterns decide on their own; the others yield to any health signal
 * ("¿cómo programo una cita?", "¿la pizza engorda?" stay in scope).
 */
const OFF_TOPIC: Array<{ topic: string; pattern: RegExp; strong?: boolean }> = [
  {
    topic: 'programación',
    strong: true,
    pattern: /```|(^|[\s¿(])(c\+\+|c#)(?=$|[\s?.,!)])|\b(python|javascript|typescript|php|html|css|sql|reactjs|node\.?js|django|laravel|kotlin|golang|github|docker|visual basic|vba)\b/,
  },
  {
    topic: 'programación',
    pattern: /\b(programacion|codigo fuente|funcion recursiva|algoritmo|compilar|depurar|debug|bucle|for loop|framework|backend|frontend|base de datos)\b/,
  },
  {
    topic: 'cocina y recetas',
    pattern: /\b(receta|recetas|cocinar|cocino|hornear|horneo|ingredientes|postre|torta|pastel|lasana|arepas?|bandeja paisa|sancocho|marinar|freir|sofrito|reposteria|cupcake|pizza|hamburguesa|galletas)\b/,
  },
  { topic: 'tareas y redacción', pattern: /\b(ensayo|redacta|redactame|escribe(me)? un (poema|cuento|ensayo|correo|carta|texto)|resumen del libro|traduce|traduccion al|haz mi tarea|ecuacion|derivada)\b/ },
  { topic: 'deportes y entretenimiento', pattern: /\b(futbol|mundial|partido de|goles|pelicula|serie de netflix|cancion|letra de la cancion|reggaeton|videojuego|chiste|horoscopo)\b/ },
  { topic: 'política y finanzas', pattern: /\b(elecciones|presidente de|partido politico|bitcoin|cripto|acciones de|invertir en|precio del dolar)\b/ },
  {
    topic: 'instrucciones del sistema',
    strong: true,
    pattern: /\b(ignora|olvida|omite) (tus|las|todas las|todas tus) (instrucciones|reglas)|\b(prompt del sistema|system prompt|modo desarrollador|jailbreak)\b/,
  },
];

/** Signals that the message is (also) about health, which keeps it in scope. */
const HEALTH_SIGNAL =
  /\b(salud|sintoma|dolor|duele|duelen|me siento|mareo|vomit|diarrea|tos\b|gripa|gripe|herida|sangr|respirar|fiebre|enferm|medic|hospital|clinica|urgencia|emergencia|eps|cita|vacun|diabet|hipertens|presion arterial|colesterol|glucosa|azucar en la sangre|alergi|celiac|gluten|lactosa|embaraz|gestante|lactancia|bebe|nutrici|dieta|calori|engord|obesidad|peso saludable|intoxica|ansiedad|depresi|psicolog|dengue|covid|contaminacion|farmacia|droguer|primeros auxilios)/;

/**
 * Heuristic used only when the LLM classifier is unavailable (no API key, outage).
 * It errs on the side of answering: except for strong signals, any health signal wins.
 */
export function heuristicOffTopic(text: string): string | null {
  const q = fold(text);
  const strong = OFF_TOPIC.find(({ pattern, strong: isStrong }) => isStrong && pattern.test(q));
  if (strong) return strong.topic;
  const weak = OFF_TOPIC.find(({ pattern, strong: isStrong }) => !isStrong && pattern.test(q));
  if (!weak || HEALTH_SIGNAL.test(q)) return null;
  return weak.topic;
}


export const IN_SCOPE_EXAMPLES = ['Urgencias cerca de mí', '¿Cómo está el aire hoy?', '¿Qué vacunas me tocan?'];

/** Short, friendly refusal that names the topic and points back to what the assistant does. */
export function outOfScopeReply(topic?: string): string {
  const label = topic?.trim();
  const what =
    label && label.length < 60 && label !== 'salud'
      ? `**${label.charAt(0).toUpperCase()}${label.slice(1)}** está fuera de lo que puedo hacer.`
      : 'Eso está fuera de lo que puedo hacer.';
  return `${what} Soy MedellínBot Salud y solo respondo sobre **salud y bienestar en Medellín y el Valle de Aburrá**:

- Dónde atenderte: urgencias, centros de salud, farmacias y vacunación.
- Síntomas y señales de alarma, salud mental y líneas de ayuda.
- Medicamentos (registro INVIMA, venta libre), calidad del aire, lluvia y agua potable.

¿Te ayudo con algo de eso?`;
}
