import { NextResponse } from 'next/server';
import { getGarages } from '@/lib/garages';

export async function GET() {
  try {
    const garages = await getGarages();
    return NextResponse.json(garages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
