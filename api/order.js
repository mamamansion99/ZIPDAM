export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const gasUrl = "https://script.google.com/macros/s/AKfycbxGy-kWw53bmx1cM1yLG6hYSV9KBgBVwJyQtaD7goXsRW0zEETlyAVgQEXL3YIg6zrk/exec";

  const postToGas = async (url, payload) => {
    const headers = { "content-type": "application/json" };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "manual",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return {
          status: 502,
          text: JSON.stringify({
            ok: false,
            error: "Apps Script redirect was missing a destination",
          }),
        };
      }
      const follow = await fetch(location, { method: "GET", redirect: "follow" });
      return { status: follow.status, text: await follow.text() };
    }

    const text = await response.text();
    return { status: response.status, text };
  };

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const cart = Array.isArray(body?.cart)
      ? body.cart.map((item) => ({
          SKU: item?.SKU || item?.id || "",
          Brand: item?.Brand || item?.brand || "",
          Size: item?.Size || item?.size || "",
          Name: item?.Name || item?.name || "",
          qty: item?.qty ?? item?.quantity ?? 0,
        }))
      : [];
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
