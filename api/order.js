export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const gasUrl = "https://script.google.com/macros/s/AKfycbzsstktcCXrPWZAiiRYcUTzUWI4Jgx-Gtvc669lzlK4RcN8TvylS9F_AeuFFM21oJeo/exec";

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

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const cart = Array.isArray(body?.cart) ? body.cart : [];
    if (!cart.length) {
      res.status(400).json({ ok: false, error: "Cart is empty" });
      return;
    }

    const payload = {
      action: body.action || "order",
      idToken: body.idToken || "",
      lineUserId: body.lineUserId || "",
      displayName: body.displayName || "",
      store: body.store || "",
      area: body.area || body.soi || "",
      phone: body.phone || "",
      address: body.address || body.defaultAddress || "",
      cart,
    };

    const result = await postToGas(gasUrl, payload);
    let data = {};
    try { data = JSON.parse(result.text); } catch (_) { data = result.text; }
    res.status(result.status).setHeader("content-type", "application/json").json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
