import { NextResponse } from 'next/server';

const GAS_URL = 'https://script.google.com/macros/s/AKfycby7Os2ZdVJoBCCa88xc9ukIhxn6lT_5sPKLJxj_4c0wSgfw2_KCdhnprbrYrJ9Tm9h0/exec';

async function postToGas(body: any) {
  const headers = { 'Content-Type': 'application/json' };
  let res = await fetch(GAS_URL, {
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
    const body = await request.json();
    const { idToken, cart } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
    }

    // Proxy the order to Google Apps Script
    // We wrap the payload in an action structure
    const res = await postToGas({
      action: 'createOrder',
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
