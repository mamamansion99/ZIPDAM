export default async function handler(req, res) {
  const gasUrl = "https://script.google.com/macros/s/AKfycbxoHkWuWwQW31RtIj3ZxG8adm6qQhm0bycLyrWZvfPYXebG_qvKzeaCtY6PjujiXflI/exec";

  const parsePackSize = (value) => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }

    const text = String(value ?? '').trim();
    if (!text) return 1;

    const direct = Number(text);
    if (Number.isFinite(direct) && direct > 0) return Math.round(direct);

    const match = text.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 1;

    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
    return 1;
  };

  const normalizeProduct = (item) => {
    if (!item) return null;

    const brand = item.Brand || item.brand || 'Unknown';
    const name = item.Name || item.name || item.SKU || 'สินค้า';
    const sku = item.SKU || item.id || `${brand}-${name}`.replace(/\s+/g, '-');

    const size = (() => {
      const mm = item.mm;
      if (mm && mm !== '-') {
        const mmStr = String(mm).trim();
        return mmStr.includes('mm') ? mmStr : `${mmStr}mm`;
      }
      if (item.Size) return String(item.Size);
      return '';
    })();

    const packSize = (() => {
      return parsePackSize(item.pack ?? item.packSize ?? item['บรรจุ (ชิ้น/กล่อง)']);
    })();

    const price = Number(item.final_price ?? item.price ?? 0) || 0;
    const promoPrice = item.promo_price != null ? Number(item.promo_price) : undefined;

    const type = (() => {
      const t = item.Type || item.type || '';
      const s = item.Size || '';
      const source = `${t} ${s}`.toLowerCase();
      return source.includes('gel') ? 'Gel' : 'Condom';
    })();

    const features = Array.isArray(item.Feature)
      ? item.Feature
      : Array.isArray(item.features)
      ? item.features
      : [];

    const imageKey = item.image_key || item.imageKey || '';

    return {
      id: sku,
      brand,
      name,
      size,
      packSize,
      price,
      promoPrice,
      imageKey,
      type,
      features,
    };
  };

  try {
    const response = await fetch(`${gasUrl}?action=catalog`, { method: "GET" });
    const text = await response.text();
    let payload;

    try {
      payload = JSON.parse(text);
    } catch (_) {
      res.status(response.status).setHeader("content-type", "application/json").send(text);
      return;
    }

    const rawProducts = Array.isArray(payload?.products)
      ? payload.products
      : Array.isArray(payload?.catalog)
      ? payload.catalog
      : null;

    if (rawProducts) {
      const normalized = rawProducts.map(normalizeProduct).filter(Boolean);
      payload = {
        ok: payload?.ok !== false,
        products: normalized,
        catalog: payload.catalog ?? normalized,
      };
    }

    res.status(response.status).json(payload);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
