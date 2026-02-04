import { NextResponse } from 'next/server';

async function postToGas(gasUrl: string, body: any) {
  const headers = { 'Content-Type': 'application/json' };
  let res = await fetch(gasUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    redirect: 'manual',
  });

  const loc = res.headers.get('location');
  if (res.status >= 300 && res.status < 400 && loc) {
    res = await fetch(loc, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  return res;
}

export async function POST(request: Request) {
  try {
    const gasUrl = process.env.GAS_URL;
    if (!gasUrl) {
      return NextResponse.json({ ok: false, error: 'Missing GAS_URL env' }, { status: 500 });
    }

    const body = await request.json();
    const { idToken, cart } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
    }

    // Proxy the order to Google Apps Script
    // We wrap the payload in an action structure
    const res = await postToGas(gasUrl, {
      action: 'order',
      payload: {
        idToken,
        cart,
        timestamp: new Date().toISOString()
      }
    });

    if (!res.ok) {
        throw new Error('GAS responded with error');
    }

    const data = await res.json();

    return NextResponse.json({ 
      success: true, 
      orderId: data.orderId || 'ORD-' + Date.now().toString().slice(-6),
      details: data 
    });

  } catch (error) {
    console.error("Order Submit Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
