import { NextResponse } from "next/server";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxGy-kWw53bmx1cM1yLG6hYSV9KBgBVwJyQtaD7goXsRW0zEETlyAVgQEXL3YIg6zrk/exec";

async function postToGas(payload: Record<string, unknown>) {
  const response = await fetch(GAS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "manual",
  });
  const location = response.headers.get("location");
  if (response.status >= 300 && response.status < 400 && location) {
    return fetch(location, { method: "GET", redirect: "follow" });
  }
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action || "");
    if (
      ![
        "admin_status",
        "admin_customers_search",
        "admin_customer_create",
        "admin_order",
      ].includes(action)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid admin action" },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      action,
      idToken: body?.idToken || "",
      lineUserId: body?.lineUserId || "",
      displayName: body?.displayName || "",
    };
    if (action === "admin_customers_search") {
      payload.query = body?.query || "";
      payload.limit = body?.limit || 20;
    }
    if (action === "admin_customer_create") {
      Object.assign(payload, {
        customerDisplayName: body?.customerDisplayName || "",
        store: body?.store || "",
        area: body?.area || body?.soi || "",
        phone: body?.phone || "",
        address: body?.address || body?.defaultAddress || "",
      });
    }
    if (action === "admin_order") {
      const cart = Array.isArray(body?.cart)
        ? body.cart.map((item: any) => ({
            SKU: item?.SKU || item?.id || "",
            Brand: item?.Brand || item?.brand || "",
            Size: item?.Size || item?.size || "",
            Name: item?.Name || item?.name || "",
            qty: item?.qty ?? item?.quantity ?? 0,
          }))
        : [];
      if (!cart.length) {
        return NextResponse.json(
          { ok: false, error: "Cart is empty" },
          { status: 400 },
        );
      }
      Object.assign(payload, {
        selectedCustomerId: body?.selectedCustomerId || "",
        store: body?.store || "",
        area: body?.area || body?.soi || "",
        phone: body?.phone || "",
        address: body?.address || body?.defaultAddress || "",
        note: body?.note || "",
        cart,
      });
    }

    const response = await postToGas(payload);
    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: "Invalid Apps Script response" };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String((error as Error)?.message || error) },
      { status: 500 },
    );
  }
}
