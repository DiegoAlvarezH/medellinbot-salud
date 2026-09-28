import OpenAI from 'openai';
import { isInAburra, type LatLng } from '@/lib/geo';
import { retrieveContext, type RetrievedContext } from '@/lib/server/retrieval';
import type { ChatStreamEvent } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;

const SYSTEM_PROMPT = `Eres MedellínBot, un asistente de salud pública para Medellín y el Valle de Aburrá (Colombia).

Cómo respondes:
- Siempre en español de Colombia, cálido, claro y breve (máximo ~180 palabras salvo que pidan detalle). Usa Markdown simple: párrafos cortos, viñetas y **negritas** para lo clave.
- Basa los datos concretos (nombres, direcciones, teléfonos, horarios, cifras) ÚNICAMENTE en el CONTEXTO. Si algo no está en el contexto, dilo y sugiere cómo averiguarlo (p. ej. llamar a la línea de citas). Nunca inventes teléfonos ni direcciones.
- Cuando recomiendes lugares, da 2 a 4 opciones con dirección y teléfono si existen, y sugiere confirmar horarios antes de ir. Si hay estación de Metro cercana, menciónala.
- Si el usuario no compartió su ubicación y pregunta "cerca", pídele su barrio o comuna, o que active el botón de ubicación.
- Ante señales de emergencia (dolor en el pecho, dificultad para respirar, pérdida de conciencia, sangrado abundante, ideas suicidas) empieza SIEMPRE indicando llamar al **123** (o **106** / Línea Amiga **604 444 44 48** en salud mental).
- No das diagnósticos ni recetas medicamentos ni dosis. Puedes explicar información general y señales de alarma, y orientar sobre a qué servicio acudir (urgencias vs. cita prioritaria vs. consulta).
- Al final, si usaste datos del contexto, cita la fuente en una línea corta en cursiva (p. ej. _Fuente: SIATA, 5:00 p. m._).
- Si la pregunta no tiene relación con salud, bienestar, ambiente o servicios de la ciudad, redirígela amablemente.`;

// ─── Basic per-IP rate limit (protects the API key on a public deployment) ───

const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.CHAT_RATE_LIMIT_PER_MINUTE || 15);
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_REQUESTS;
}

// ─── Request validation ─────────────────────────────────────────────────────

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

function parseBody(body: unknown): { messages: IncomingMessage[]; location?: LatLng } | null {
  if (!body || typeof body !== 'object') return null;
  const { messages, location } = body as { messages?: unknown; location?: unknown };
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const clean = messages
    .slice(-MAX_MESSAGES)
    .filter(
      (m): m is IncomingMessage =>
        !!m && typeof m === 'object' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!clean.length || clean[clean.length - 1].role !== 'user') return null;

  let loc: LatLng | undefined;
  if (location && typeof location === 'object') {
    const { latitude, longitude } = location as Record<string, unknown>;
    if (typeof latitude === 'number' && typeof longitude === 'number' && isInAburra({ latitude, longitude })) {
      loc = { latitude, longitude };
    }
  }
  return { messages: clean, location: loc };
}

// ─── Offline answer when no model is available ─────────────────────────────

function fallbackAnswer({ summary, intents }: RetrievedContext, reason: string): string {
  const lead = intents.has('emergency') || intents.has('mental-health') ? '**Si es una emergencia, llama ya al 123.**\n\n' : '';
  const body = summary.length
    ? `Esto es lo que encontré en los datos abiertos:\n\n${summary
        .slice(0, 7)
        .map((line) => `- ${line}`)
        .join('\n')}`
    : 'Puedo ayudarte con centros de salud, calidad del aire, vacunación y líneas de ayuda. Prueba, por ejemplo: "farmacias abiertas en Laureles".';
  return `${lead}${body}\n\n_Modo básico: el asistente con IA no está disponible (${reason})._`;
}

function encode(event: ChatStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (rateLimited(ip)) {
    return Response.json({ error: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.' }, { status: 429 });
  }

  let parsed: ReturnType<typeof parseBody>;
  try {
    parsed = parseBody(await request.json());
  } catch {
    parsed = null;
  }
  if (!parsed) return Response.json({ error: 'Solicitud inválida' }, { status: 400 });

  const { messages, location } = parsed;
  const query = messages[messages.length - 1].content;
  const apiKey = process.env.OPENAI_API_KEY;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) => controller.enqueue(encode(event));
      let retrieved: RetrievedContext;
      try {
        retrieved = await retrieveContext(query, location);
      } catch (error) {
        console.error('[api/chat] retrieval', error);
        retrieved = { intents: new Set(), context: '- Línea única de emergencias: 123 (24 horas).', summary: [], cards: {} };
      }

      if (!apiKey) {
        send({ type: 'meta', cards: retrieved.cards, source: 'fallback' });
        send({ type: 'delta', text: fallbackAnswer(retrieved, 'falta configurar OPENAI_API_KEY') });
        send({ type: 'done' });
        controller.close();
        return;
      }

      send({ type: 'meta', cards: retrieved.cards, source: 'openai' });
      try {
        const client = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 1 });
        const completion = await client.chat.completions.create(
          {
            model: MODEL,
            stream: true,
            temperature: 0.3,
            max_tokens: 900,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'system', content: `CONTEXTO (datos abiertos consultados ahora):\n\n${retrieved.context}` },
              ...messages,
            ],
          },
          { signal: request.signal },
        );
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) send({ type: 'delta', text });
        }
      } catch (error) {
        if (request.signal.aborted) {
          controller.close();
          return;
        }
        const { status, code } = error as { status?: number; code?: string };
        console.error('[api/chat] openai', status ?? '', code ?? '', (error as Error).message);
        const reason =
          status === 401
            ? 'la clave de OpenAI no es válida'
            : code === 'insufficient_quota' || code === 'credit_balance_exhausted'
              ? 'la cuenta de OpenAI no tiene créditos disponibles'
              : status === 429
                ? 'se alcanzó el límite de uso del modelo'
                : 'error temporal del proveedor';
        send({ type: 'delta', text: fallbackAnswer(retrieved, reason) });
      }
      send({ type: 'done' });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
