import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { buildPublicHealthContext } from '@/lib/retrieval';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function buildFallbackResponse(userQuery: string, context: string, reason: string) {
  const contextItems = context
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .slice(0, 4)
    .map((line) => line.replace(/^-\s*/, ''));

  const intro = userQuery
    ? `No pude consultar el modelo en este momento (${reason}), pero te comparto informacion util basada en datos locales:`
    : `No pude consultar el modelo en este momento (${reason}).`;

  const bulletPoints = contextItems.length
    ? contextItems.map((item) => `- ${item}`).join('\n')
    : '- Intenta de nuevo en unos segundos.';

  return `${intro}\n\n${bulletPoints}\n\nSi tienes una emergencia medica, llama al 123.`;
}

function isRetryableProviderError(details: string): boolean {
  const normalizedDetails = details.toLowerCase();
  return (
    normalizedDetails.includes('unexpected end of json input') ||
    normalizedDetails.includes('socket hang up') ||
    normalizedDetails.includes('timed out') ||
    normalizedDetails.includes('econnreset')
  );
}

function normalizeRoleForGemini(role: ChatMessage['role']): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

async function queryWithGemini(apiKey: string, systemPrompt: string, messages: ChatMessage[]) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
      contents: messages.map((msg) => ({
        role: normalizeRoleForGemini(msg.role),
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        maxOutputTokens: 900,
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API ${response.status}: ${errorText.slice(0, 300)}`);
  }

  let data: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    promptFeedback?: { blockReason?: string };
  };

  try {
    data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      promptFeedback?: { blockReason?: string };
    };
  } catch {
    throw new Error('Gemini devolvio una respuesta JSON invalida');
  }

  const text = (data.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || '')
    .join('\n')
    .trim();

  if (!text) {
    const blockReason = data.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Gemini bloqueo la respuesta: ${blockReason}`);
    }
    throw new Error('Gemini no devolvio contenido de texto');
  }

  return text;
}

async function queryWithAnthropic(apiKey: string, systemPrompt: string, messages: ChatMessage[]) {
  const anthropic = new Anthropic({ apiKey });
  let response: Awaited<ReturnType<typeof anthropic.messages.create>> | null = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
        max_tokens: 900,
        temperature: 0.2,
        system: systemPrompt,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });
      break;
    } catch (providerError: unknown) {
      const providerDetails = providerError instanceof Error ? providerError.message : 'Unknown error';
      if (attempt === 2 || !isRetryableProviderError(providerDetails)) {
        throw providerError;
      }
    }
  }

  if (!response) {
    throw new Error('No response from provider');
  }

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

export async function POST(req: Request) {
  try {
    let payload: { messages?: ChatMessage[] };
    try {
      payload = (await req.json()) as { messages?: ChatMessage[] };
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { messages } = payload;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      (anthropicApiKey?.startsWith('AIza') ? anthropicApiKey : undefined);

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid message payload' }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user')?.content || '';
    const contextualData = buildPublicHealthContext(lastUserMessage);

    if (!geminiApiKey && !anthropicApiKey) {
      return NextResponse.json({
        role: 'assistant',
        content: buildFallbackResponse(lastUserMessage, contextualData, 'falta API key'),
        source: 'fallback',
      });
    }

    const systemPrompt = [
      'Eres MedellinBot, un asistente experto en salud publica para Medellin y su area metropolitana.',
      'Debes responder SIEMPRE en espanol, de forma clara, concreta y orientada a accion.',
      'Reglas:',
      '- Prioriza la informacion del CONTEXTO RECUPERADO incluido abajo.',
      '- Si el usuario pide un servicio de salud, sugiere 2-4 opciones con direccion y horario.',
      '- Si faltan datos para una recomendacion precisa, dilo y pide 1 dato adicional.',
      '- Si detectas emergencia medica, indica llamar de inmediato al 123.',
      '- No inventes datos no presentes en el contexto.',
      '',
      'CONTEXTO RECUPERADO:',
      contextualData,
    ].join('\n');

    let content = '';
    let source: 'gemini' | 'anthropic' = 'anthropic';

    if (geminiApiKey) {
      content = await queryWithGemini(geminiApiKey, systemPrompt, messages);
      source = 'gemini';
    } else if (anthropicApiKey) {
      content = await queryWithAnthropic(anthropicApiKey, systemPrompt, messages);
      source = 'anthropic';
    }

    return NextResponse.json({
      role: 'assistant',
      content: content || 'No pude generar una respuesta en este momento.',
      source,
    });
  } catch (error: unknown) {
    console.error('Provider API Error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    const normalizedDetails = details.toLowerCase();

    // "credentials" contains "credit"; check auth issues first and use stricter credit patterns.
    const isAuthError =
      normalizedDetails.includes('api key') ||
      normalizedDetails.includes('authentication') ||
      normalizedDetails.includes('credentials') ||
      normalizedDetails.includes('x-goog-api-key') ||
      normalizedDetails.includes('permission_denied') ||
      normalizedDetails.includes('invalid_argument') ||
      normalizedDetails.includes('unauthorized') ||
      normalizedDetails.includes('forbidden');
    const isCreditError =
      normalizedDetails.includes('insufficient credit') ||
      normalizedDetails.includes('credit balance') ||
      normalizedDetails.includes('billing');
    const isQuotaError =
      normalizedDetails.includes('gemini api 429') ||
      normalizedDetails.includes('quota') ||
      normalizedDetails.includes('rate limit') ||
      normalizedDetails.includes('resource_exhausted');

    const reason = isAuthError
      ? 'problema de autenticacion'
      : isQuotaError
        ? 'cuota agotada o limite de solicitudes en Gemini'
      : isCreditError
        ? 'saldo o facturacion insuficiente del proveedor'
        : 'error temporal del proveedor';

    const fallbackContext = buildPublicHealthContext('salud medellin');

    return NextResponse.json({
      role: 'assistant',
      content: buildFallbackResponse('', fallbackContext, reason),
      source: 'fallback',
    });
  }
}
