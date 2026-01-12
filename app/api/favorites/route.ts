import { NextResponse } from 'next/server';

const GAS_URL = 'https://script.google.com/macros/s/AKfycby7Os2ZdVJoBCCa88xc9ukIhxn6lT_5sPKLJxj_4c0wSgfw2_KCdhnprbrYrJ9Tm9h0/exec';

async function postToGas(body: any) {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    redirect: 'manual',
  });

  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (loc) {
      const follow = await fetch(loc, { method: 'GET' });
      return follow;
    }
    return new Response(JSON.stringify({ ok: true, redirected: true }), { status: 200 });
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
