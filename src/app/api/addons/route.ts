import { NextResponse } from 'next/server';
import { getAddons } from '@/lib/addons';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') !== 'false';
    const addons = await getAddons(onlyActive);
    return NextResponse.json(addons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
