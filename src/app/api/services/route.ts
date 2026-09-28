import { NextResponse } from 'next/server';
import { getHealthNetwork } from '@/lib/server/health-network';

export async function GET() {
  try {
    const network = await getHealthNetwork();
    return NextResponse.json(network, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('[api/services]', error);
    return NextResponse.json({ error: 'No fue posible cargar la red de salud' }, { status: 503 });
  }
}
