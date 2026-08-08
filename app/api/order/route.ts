import { NextResponse } from 'next/server';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxGy-kWw53bmx1cM1yLG6hYSV9KBgBVwJyQtaD7goXsRW0zEETlyAVgQEXL3YIg6zrk/exec';

async function postToGas(body: any) {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    redirect: 'manual',
  });

  const loc = res.headers.get('location');
  if (res.status >= 300 && res.status < 400 && loc) {
    return fetch(loc, { method: 'GET', redirect: 'follow' });
  }

  return res;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cart = Array.isArray(body?.cart)
      ? body.cart.map((item: any) => ({
          SKU: item?.SKU || item?.id || '',
          Brand: item?.Brand || item?.brand || '',
          Size: item?.Size || item?.size || '',
          Name: item?.Name || item?.name || '',
          qty: item?.qty ?? item?.quantity ?? 0,
        }))
      : [];

    if (cart.length === 0) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
    }

    const res = await postToGas({
      action: body.action || 'order',
      idToken: body.idToken || '',
      lineUserId: body.lineUserId || '',
      displayName: body.displayName || '',
      store: body.store || '',
      area: body.area || body.soi || '',
      phone: body.phone || '',
      address: body.address || body.defaultAddress || '',
      cart,
    });

    if (!res.ok) {
        throw new Error('GAS responded with error');
    }

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });

  } catch (error) {
    console.error("Order Submit Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
