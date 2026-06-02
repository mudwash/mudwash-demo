import { NextResponse } from 'next/server';
import { getParts } from '@/lib/parts';

export async function GET() {
  try {
    const parts = await getParts();
    return NextResponse.json(parts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
