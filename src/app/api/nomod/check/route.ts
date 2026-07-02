import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');
    const apiKey = process.env.NOMOD_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Nomod API key not configured' }, { status: 500 });
    }
    if (!linkId) {
      return NextResponse.json({ error: 'Missing link id' }, { status: 400 });
    }

    // Call Nomod API to get the link details
    const response = await fetch(`https://api.nomod.com/v1/links/${linkId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nomod API error fetching link:", errorText);
      return NextResponse.json({ error: `Nomod API Error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    console.log(`Nomod link status for ${linkId}:`, data.status);
    
    // According to Nomod documentation, a link's status could be "unpaid", "paid", etc.
    // Return the entire link object to the client for evaluation.
    return NextResponse.json({
      id: data.id,
      status: data.status,
      charges: data.charges || [],
      isPaid: data.status === 'paid' || data.status === 'charge_succeeded' || data.status === 'COMPLETED' || data.status === 'PAID', // Adding common statuses
      raw: data
    });
  } catch (error: any) {
    console.error("Nomod Check API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
