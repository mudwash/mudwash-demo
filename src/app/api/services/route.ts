import { NextResponse } from 'next/server';
import { getServices } from '@/lib/services';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') !== 'false';
    const services = await getServices(onlyActive);
    return NextResponse.json(services);
  } catch (error: any) {
    console.error('GET /api/services error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
