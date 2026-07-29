export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const gasUrl =
    "https://script.google.com/macros/s/AKfycbz7e8urAY_67A-NkV6sO6BLVGJWt1s8ZP9rNqvNYzB6rluvYeaZVeBMdtFAfEV7celD/exec";

  const postToGas = async (payload) => {
    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
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

    return { status: response.status, text: await response.text() };
  };

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const action = String(body?.action || "");
    if (!["admin_status", "admin_customers_search", "admin_order"].includes(action)) {
      res.status(400).json({ ok: false, error: "Invalid admin action" });
      return;
    }

    const payload = {
      action,
      idToken: body?.idToken || "",
      lineUserId: body?.lineUserId || "",
      displayName: body?.displayName || "",
    };

    if (action === "admin_customers_search") {
      payload.query = body?.query || "";
      payload.limit = body?.limit || 20;
    }

    if (action === "admin_order") {
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
      payload.selectedCustomerId = body?.selectedCustomerId || "";
      payload.store = body?.store || "";
      payload.area = body?.area || body?.soi || "";
      payload.phone = body?.phone || "";
      payload.address = body?.address || body?.defaultAddress || "";
      payload.note = body?.note || "";
      payload.cart = cart;
    }

    const result = await postToGas(payload);
    let data = {};
    try {
      data = JSON.parse(result.text);
    } catch (_) {
      data = { ok: false, error: "Invalid Apps Script response" };
    }
    res
      .status(result.status)
      .setHeader("content-type", "application/json")
      .json(data);
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, error: String(error?.message || error) });
  }
}
