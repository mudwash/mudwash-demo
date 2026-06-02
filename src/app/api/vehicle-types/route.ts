import { NextResponse } from 'next/server';
import { getVehicleTypes } from '@/lib/vehicleTypes';

export async function GET() {
  try {
    const vehicleTypes = await getVehicleTypes();
    return NextResponse.json(vehicleTypes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
