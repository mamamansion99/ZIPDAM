import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken, cart } = body;

    if (!idToken || !cart || cart.length === 0) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
    }

    // 1. Verify ID Token with LINE
    // const profile = await verifyLineToken(idToken);

    // 2. Post to Google Apps Script
    // await fetch(process.env.GAS_URL, { method: 'POST', body: JSON.stringify({...}) });

    return NextResponse.json({ 
      success: true, 
      orderId: 'ORD-' + Date.now().toString().slice(-6) 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}