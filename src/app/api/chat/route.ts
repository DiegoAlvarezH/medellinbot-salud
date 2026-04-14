import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { buildPublicHealthContext } from '@/lib/retrieval';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

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

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages?: ChatMessage[] };
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid message payload' }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user')?.content || '';
    const contextualData = buildPublicHealthContext(lastUserMessage);

    if (!apiKey) {
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

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
      max_tokens: 900,
      temperature: 0.2,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return NextResponse.json({
      role: 'assistant',
      content: content || 'No pude generar una respuesta en este momento.',
      source: 'anthropic',
    });
  } catch (error: unknown) {
    console.error('Claude API Error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    const normalizedDetails = details.toLowerCase();

    // "credentials" contains "credit"; check auth issues first and use stricter credit patterns.
    const isAuthError =
      normalizedDetails.includes('api key') ||
      normalizedDetails.includes('authentication') ||
      normalizedDetails.includes('credentials') ||
      normalizedDetails.includes('unauthorized') ||
      normalizedDetails.includes('forbidden');
    const isCreditError =
      normalizedDetails.includes('insufficient credit') ||
      normalizedDetails.includes('credit balance') ||
      normalizedDetails.includes('billing');

    const reason = isAuthError
      ? 'problema de autenticacion'
      : isCreditError
        ? 'saldo insuficiente en Anthropic'
        : 'error temporal del proveedor';

    const fallbackContext = buildPublicHealthContext('salud medellin');

    return NextResponse.json({
      role: 'assistant',
      content: buildFallbackResponse('', fallbackContext, reason),
      source: 'fallback',
    });
  }
}
