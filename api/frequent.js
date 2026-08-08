export default async function handler(req, res) {
  const gasUrl = "https://script.google.com/macros/s/AKfycbxGy-kWw53bmx1cM1yLG6hYSV9KBgBVwJyQtaD7goXsRW0zEETlyAVgQEXL3YIg6zrk/exec";

  const postToGas = async (url, payload) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "manual",
    });
    if (response.status >= 300 && response.status < 400) {
      const loc = response.headers.get("location");
      if (loc) {
        const follow = await fetch(loc, { method: "GET" });
        return { status: follow.status, text: await follow.text() };
      }
    }
    return { status: response.status, text: await response.text() };
  };

  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const result = await postToGas(gasUrl, { ...body, action: "frequent_get" });

    let payload;
    try {
      payload = JSON.parse(result.text);
    } catch (_) {
      res.status(502).json({ ok: false, error: "BAD_GAS_RESPONSE" });
      return;
    }

    res.status(result.status).json(payload);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
