export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const gasUrl = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbwwE2CjPt6A9zWvnJPrS6NxesbtkAbTE5zl9voAH3unVTMn_ZkHXkIjR1SPTxAHC5Hw/exec";
  if (!gasUrl) {
    res.status(500).json({ ok: false, error: "Missing GAS_URL env" });
    return;
  }

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
      cart,
    };

    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    res.status(response.status).setHeader("content-type", "application/json").send(text);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
