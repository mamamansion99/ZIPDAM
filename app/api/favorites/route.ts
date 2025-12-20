import { NextResponse } from 'next/server';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwwE2CjPt6A9zWvnJPrS6NxesbtkAbTE5zl9voAH3unVTMn_ZkHXkIjR1SPTxAHC5Hw/exec';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

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
