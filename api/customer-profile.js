export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const gasUrl = "https://script.google.com/macros/s/AKfycbxGy-kWw53bmx1cM1yLG6hYSV9KBgBVwJyQtaD7goXsRW0zEETlyAVgQEXL3YIg6zrk/exec";

  const postToGas = async (url, payload) => {
    const headers = { 'content-type': 'application/json' };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return {
          status: 502,
          text: JSON.stringify({
            ok: false,
            error: 'Apps Script redirect was missing a destination',
          }),
        };
      }
      const follow = await fetch(location, { method: 'GET', redirect: 'follow' });
      return { status: follow.status, text: await follow.text() };
    }

    const text = await response.text();
    return { status: response.status, text };
  };

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const requestedAction = String(body.action || '').trim();
    const allowedActions = ['customer_profile_set', 'customer_summary'];
    const action = allowedActions.includes(requestedAction) ? requestedAction : 'customer_profile';

    const payload = {
      action,
      idToken: body.idToken || '',
      lineUserId: body.lineUserId || '',
    };
    if (action === 'customer_profile_set') {
      payload.displayName = body.displayName || '';
      payload.store = body.store || body.storeName || '';
      payload.area = body.area || body.soi || '';
      payload.phone = body.phone || '';
      payload.address = body.address || body.defaultAddress || '';
    }

    const result = await postToGas(gasUrl, payload);
    let data = {};
    try { data = JSON.parse(result.text); } catch (_) { data = result.text; }
    res.status(result.status).setHeader('content-type', 'application/json').json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
