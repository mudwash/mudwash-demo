import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency, name, description, email, phone, success_url, failure_url } = body;

    const response = await fetch('https://api.nomod.com/v1/links', {
      method: 'POST',
      headers: {
        'X-API-KEY': 'sk_live_uvyqA2oL.aQTXb5NpadW8ffg4DKgWN5gCqcxH1KXd',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currency: currency || "AED",
        items: [
          {
            name: name || "Mudwash Service",
            amount: parseFloat(amount).toFixed(2),
            quantity: 1
          }
        ],
        title: name || "Mudwash Booking",
        note: description || "Booking payment",
        success_url: success_url || "https://mudwash.com/success",
        failure_url: failure_url || "https://mudwash.com/bookings"
      })
    });

    console.log("Nomod API Status:", response.status);
    
    let data: any = {};
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON response:", text);
      }
    }

    // If body is empty or doesn't have URL, check Location header
    const locationHeader = response.headers.get('location');
    if (locationHeader && !data.url) {
      data.url = locationHeader;
    }

    console.log("Nomod API Response Data:", data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Nomod API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
