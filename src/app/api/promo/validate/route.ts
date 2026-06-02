import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { code, userId, services, addons, vehicleType, garageId, vehicleTypes } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    const promoRef = doc(db, 'promocodes', code.toUpperCase());
    const promoSnap = await getDoc(promoRef);

    if (!promoSnap.exists()) {
      return NextResponse.json({ valid: false, error: 'Invalid promo code' });
    }

    const data = promoSnap.data();

    if (!data.active) {
      return NextResponse.json({ valid: false, error: 'This promo code is no longer active' });
    }

    if (data.usedBy && userId && data.usedBy.includes(userId)) {
      return NextResponse.json({ valid: false, error: 'You have already used this promo code' });
    }

    if (data.usedCount && data.usedCount >= data.usageLimit) {
      return NextResponse.json({ valid: false, error: 'This promo code has reached its usage limit' });
    }

    return NextResponse.json({
      valid: true,
      type: data.type,
      value: data.value,
      code: code.toUpperCase(),
    });
  } catch (error: any) {
    console.error('POST /api/promo/validate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
