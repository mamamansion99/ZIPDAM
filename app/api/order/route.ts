import { NextResponse } from 'next/server';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyGW57XZPWYbhOv5vv5EpFj4-rVJmJATFQKe2PKK41Uej-k5kv3A6Q_Rb2Qxjm_syeT/exec';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken, cart } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
    }

    // Proxy the order to Google Apps Script
    // We wrap the payload in an action structure
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createOrder',
        payload: {
          idToken,
          cart,
          timestamp: new Date().toISOString()
        }
      })
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
