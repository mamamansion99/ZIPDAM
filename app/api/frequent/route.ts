import { NextResponse } from 'next/server';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxGy-kWw53bmx1cM1yLG6hYSV9KBgBVwJyQtaD7goXsRW0zEETlyAVgQEXL3YIg6zrk/exec';

async function postToGas(body: any) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'manual',
  });

  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (loc) return fetch(loc, { method: 'GET' });
  }
  return res;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await postToGas({
      ...body,
      action: 'frequent_get',
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (_) {
      return NextResponse.json({ ok: false, error: 'BAD_GAS_RESPONSE' }, { status: 502 });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Frequent proxy error', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
