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
    let response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "manual",
    });

    const loc = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && loc) {
      response = await fetch(loc, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    }
    return response;
  };

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const response = await postToGas(gasUrl, body);
    const text = await response.text();
    res.status(response.status).setHeader("content-type", "application/json").send(text);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
