import { NextResponse } from 'next/server';
import { searchMedicines } from '@/lib/server/medicines';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.slice(0, 60) ?? '';
  try {
    const result = await searchMedicines(q);
    if (!result) {
      return NextResponse.json({ error: 'Escribe el nombre del medicamento o su principio activo (mínimo 4 letras).' }, { status: 400 });
    }
    return NextResponse.json(result, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  } catch (error) {
    console.error('[api/medicines]', error);
    return NextResponse.json({ error: 'Datos Abiertos Colombia no respondió. Intenta de nuevo en unos minutos.' }, { status: 503 });
  }
}
