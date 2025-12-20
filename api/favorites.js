export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const gasUrl = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbyGW57XZPWYbhOv5vv5EpFj4-rVJmJATFQKe2PKK41Uej-k5kv3A6Q_Rb2Qxjm_syeT/exec";
  if (!gasUrl) {
    res.status(500).json({ ok: false, error: "Missing GAS_URL env" });
    return;
  }

  const postToGas = async (url, payload) => {
    const headers = { "content-type": "application/json" };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "manual",
    });
    if (response.status >= 300 && response.status < 400) {
      return { status: 200, text: JSON.stringify({ ok: true, redirected: true }) };
    }
    const text = await response.text();
    return { status: response.status, text };
  };

  const getToGas = async (url, params) => {
    const qs = new URLSearchParams(params).toString();
    const response = await fetch(`${url}?${qs}`, { method: "GET", redirect: "follow" });
    const text = await response.text();
    return { status: response.status, text };
  };

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const isGet = body?.action === "favorites_get";
    const result = isGet
      ? await getToGas(gasUrl, body)
      : await postToGas(gasUrl, body);
    res.status(result.status).setHeader("content-type", "application/json").send(result.text);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
