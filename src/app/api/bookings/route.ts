import { NextResponse } from 'next/server';
import { createBooking, getUserBookings } from '@/lib/bookings';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'email query param required' }, { status: 400 });
    }
    const bookings = await getUserBookings(email);
    // Convert Firestore Timestamps to serializable values
    const serializable = bookings.map(b => ({
      ...b,
      createdAt: b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt,
    }));
    return NextResponse.json(serializable);
  } catch (error: any) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const booking = await request.json();
    // Validate required fields
    const required = ['customerName', 'phone', 'service', 'date', 'time', 'location', 'amount', 'status', 'carDetails'];
    for (const field of required) {
      if (!booking[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    const id = await createBooking({
      customerName: booking.customerName,
      email: booking.email || 'guest@mudwash.com',
      phone: booking.phone,
      service: booking.service,
      addons: booking.addons || '',
      date: booking.date,
      time: booking.time,
      location: booking.location,
      amount: booking.amount,
      paidAmount: booking.paidAmount,
      paymentStatus: booking.paymentStatus || 'Cash on Service',
      status: booking.status || 'Pending',
      carDetails: booking.carDetails,
    });
    return NextResponse.json({ id, success: true });
  } catch (error: any) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
