import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();
    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      return NextResponse.json({ error: 'Auth key not configured' }, { status: 500 });
    }

    // Call MSG91 API to verify OTP
    // MSG91 verify often uses GET with query params
    const url = `https://control.msg91.com/api/v5/otp/verify?authkey=${authKey}&mobile=${phone}&otp=${otp}`;
    const response = await fetch(url, {
      method: 'GET',
    });

    const data = await response.json();

    if (data.type === 'success') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: data.message || 'Verification failed' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
