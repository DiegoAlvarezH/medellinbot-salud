
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "OpenAI API Key not configured" }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // or gpt-3.5-turbo if preferred
      messages: [
        {
          role: 'system',
          content: `Eres MedellínBot, un asistente de salud pública experto para la ciudad de Medellín, Colombia. 
          Tu objetivo es ayudar a los ciudadanos con información sobre:
          - Centros de salud y hospitales en Medellín.
          - Vacunación (horarios, puntos).
          - Calidad del aire (puedes explicar qué significan los colores del SIATA).
          - Rutas de transporte para llegar a centros de salud.
          
          Responde siempre de manera amable, clara y concisa en español. 
          Si te preguntan sobre emergencias médicas graves, recomienda llamar inmediatamente al 123.`
        },
        ...messages
      ],
    });

    const reply = completion.choices[0].message;

    return NextResponse.json(reply);
  } catch (error: any) {
    console.error('OpenAI Error:', error);
    return NextResponse.json(
      { error: 'Error processing request', details: error.message },
      { status: 500 }
    );
  }
}
