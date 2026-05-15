import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      return NextResponse.json({ error: 'Auth key not configured' }, { status: 500 });
    }

    // Call MSG91 API
    // Note: MSG91 might require a template_id for DLT compliance.
    const response = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authkey: authKey,
        mobile: phone,
        // Add template_id here if required by MSG91
      }),
    });

    const data = await response.json();

    if (data.type === 'success') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: data.message || 'Failed to send OTP' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
