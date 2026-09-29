import { NextResponse } from 'next/server';
import { getStationSeries } from '@/lib/server/environment';

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^\d{1,4}$/.test(code)) {
    return NextResponse.json({ error: 'Código de estación inválido' }, { status: 400 });
  }
  try {
    const series = await getStationSeries(code);
    return NextResponse.json(series, { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } });
  } catch (error) {
    console.error('[api/air/series]', error);
    return NextResponse.json({ error: 'SIATA no respondió' }, { status: 503 });
  }
}
