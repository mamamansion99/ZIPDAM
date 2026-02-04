export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const gasUrl = "https://script.google.com/macros/s/AKfycbxoHkWuWwQW31RtIj3ZxG8adm6qQhm0bycLyrWZvfPYXebG_qvKzeaCtY6PjujiXflI/exec";

  const postToGas = async (url, payload) => {
    const headers = { 'content-type': 'application/json' };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      return { status: 200, text: JSON.stringify({ ok: true, redirected: true }) };
    }

    const text = await response.text();
    return { status: response.status, text };
  };

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const payload = {
      action: 'customer_profile',
      idToken: body.idToken || '',
      lineUserId: body.lineUserId || '',
    };

    const result = await postToGas(gasUrl, payload);
    let data = {};
    try { data = JSON.parse(result.text); } catch (_) { data = result.text; }
    res.status(result.status).setHeader('content-type', 'application/json').json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
