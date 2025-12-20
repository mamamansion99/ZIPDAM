import { NextResponse } from 'next/server';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyGW57XZPWYbhOv5vv5EpFj4-rVJmJATFQKe2PKK41Uej-k5kv3A6Q_Rb2Qxjm_syeT/exec';

async function postToGas(body: any) {
  // First call without following redirect, then re-POST to googleusercontent if needed.
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

    const res = await postToGas(body);

    const text = await res.text();
    let data: any = text;
    try {
      data = JSON.parse(text);
    } catch (_) {
      // keep text as-is
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Favorites proxy error', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
