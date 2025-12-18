export default async function handler(req, res) {
  const gasUrl = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbwwE2CjPt6A9zWvnJPrS6NxesbtkAbTE5zl9voAH3unVTMn_ZkHXkIjR1SPTxAHC5Hw/exec";
  if (!gasUrl) {
    res.status(500).json({ ok: false, error: "Missing GAS_URL env" });
    return;
  }

  try {
    const response = await fetch(`${gasUrl}?action=catalog`, { method: "GET" });
    const text = await response.text();
    res.status(response.status).setHeader("content-type", "application/json").send(text);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
