import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'date query param required' }, { status: 400 });
    }

    const bookingsCol = collection(db, 'bookings');
    const q = query(bookingsCol, where('date', '==', date));
    const snapshot = await getDocs(q);

    const counts: Record<string, number> = {};
    snapshot.docs.forEach(doc => {
      const b = doc.data();
      const isCancelled = b.status === 'Cancelled' || b.status === 'Cancelled (System)';
      const isUnapprovedCash = b.paymentStatus === 'Cash on Service' && b.status === 'Pending';
      if (!isCancelled && !isUnapprovedCash) {
        counts[b.time] = (counts[b.time] || 0) + 1;
      }
    });

    return NextResponse.json(counts);
  } catch (error: any) {
    console.error('GET /api/slot-counts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
