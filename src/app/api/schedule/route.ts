import { NextResponse } from 'next/server';
import { getSchedule } from '@/lib/schedule';

export async function GET() {
  try {
    const schedule = await getSchedule();
    return NextResponse.json(schedule);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
