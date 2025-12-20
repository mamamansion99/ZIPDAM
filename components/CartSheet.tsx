import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "./CartContext";
import { SHIPPING_FEE } from "../lib/tokens";
import { slideUpSheet, tapScale } from "../lib/motion";
import { TH, formatTHB } from "../lib/i18n";
import { getLiffAuth } from "../lib/liffAuth";

export const CartSheet = () => {
  const {
    isCartOpen,
    setCartOpen,
    items,
    updateQty,
    removeFromCart,
    itemsTotal,
    grandTotal,
    clearCart,
    triggerOrderSuccess,
  } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<{
    store: string;
    area: string;
    phone: string;
    address: string;
  }>({
    store: "",
    area: "",
    phone: "",
    address: "",
  });
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // load cached + server profile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem("zipdam_contact_info");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setContactInfo((prev) => ({ ...prev, ...parsed }));
      } catch (_) {}
    }

    (async () => {
      const auth = getLiffAuth();
      const body: any = {
        lineUserId: auth.lineUserId || "",
        idToken: auth.idToken || "",
      };
      if (!body.lineUserId && !body.idToken) return;
      setContactLoading(true);
      try {
        const res = await fetch("/api/customer-profile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (data && data.profile) {
          const profile = data.profile;
          setContactInfo((prev) => ({
            store: profile.store || prev.store || "",
            area: profile.area || prev.area || "",
            phone: profile.phone || prev.phone || "",
            address:
              profile.address || profile.defaultAddress || prev.address || "",
          }));
        }
      } catch (_) {
        // ignore
      } finally {
        setContactLoading(false);
      }
    })();
  }, []);

  const persistContact = (info: typeof contactInfo) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("zipdam_contact_info", JSON.stringify(info));
  };

  const missingContact = () =>
    !contactInfo.store || !contactInfo.area || !contactInfo.phone;

  const performCheckout = async () => {
    if (!items.length || isSubmitting) return;
    if (missingContact()) {
      setShowContactModal(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const auth = getLiffAuth();

      let idToken = auth.idToken || "";
      let lineUserId = auth.lineUserId || "";
      let displayName = auth.displayName || "";

      // Refresh LIFF idToken/profile right before submit (idToken can expire).
      try {
        const liff = (await import("@line/liff")).default;
        if (liff?.isLoggedIn && liff.isLoggedIn()) {
          const t = liff.getIDToken && liff.getIDToken();
          if (t) idToken = t;
          if (liff.getProfile) {
            const p = await liff.getProfile();
            if (p?.userId) lineUserId = p.userId;
            if (p?.displayName) displayName = p.displayName;
          }
        }
      } catch (_) {
        // ignore if not in LIFF context
      }

      const payload = {
        action: "order",
        idToken,
        lineUserId,
        displayName,
        store: contactInfo.store,
        area: contactInfo.area,
        phone: contactInfo.phone,
        address: contactInfo.address,
        cart: items.map((i) => ({
          SKU: i.id,
          Brand: i.brand,
          Size: i.size,
          Name: i.name,
          qty: i.qty,
          price: i.promoPrice ?? i.price,
        })),
      };

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Order failed");
      }

      clearCart();
      setCartOpen(false);
      triggerOrderSuccess(data.orderId);
      persistContact(contactInfo);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTimeout(() => alert(`สั่งซื้อไม่สำเร็จ: ${msg}`), 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setCartOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
      />

      {/* Sheet */}
      <motion.div
        variants={slideUpSheet}
        initial="hidden"
        animate="show"
        exit="exit"
        className="bg-zipdam-surface w-full max-w-md rounded-t-[32px] overflow-hidden pointer-events-auto shadow-2xl relative max-h-[85vh] flex flex-col border-t border-zipdam-border"
      >
        {/* Handle */}
        <div
          className="w-full flex justify-center pt-3 pb-1"
          onClick={() => setCartOpen(false)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-zipdam-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-zipdam-text">{TH.cart}</h2>
          <button
            onClick={() => setCartOpen(false)}
            className="text-zipdam-muted hover:text-zipdam-text"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Contact summary */}
        <div className="px-6 pt-4">
          <div className="bg-white border border-zipdam-border rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs uppercase tracking-wide text-zipdam-muted font-semibold">
                  ข้อมูลจัดส่ง
                </div>
                {!missingContact() ? (
                  <div className="mt-2 space-y-1 text-sm text-zipdam-text">
                    <div className="font-semibold">
                      {contactInfo.store || "-"}
                    </div>
                    <div className="text-zipdam-muted">
                      {contactInfo.area || "-"}
                    </div>
                    <div className="text-zipdam-muted">
                      {contactInfo.address || "ไม่มีที่อยู่เพิ่มเติม"}
                    </div>
                    <div className="text-zipdam-text font-medium">
                      {contactInfo.phone || "-"}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-zipdam-muted">
                    {contactLoading
                      ? "กำลังดึงข้อมูล..."
                      : "กรุณากรอกข้อมูลร้าน / ซอย / เบอร์โทร"}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowContactModal(true)}
                className="text-zipdam-gold text-sm font-semibold hover:underline"
              >
                แก้ไข
              </button>
            </div>
          </div>
        </div>

        {/* Items Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zipdam-bg/50">
          {items.length === 0 ? (
            <div className="text-center py-10 text-zipdam-muted">
              {TH.emptyCart}
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-white border border-gray-100 p-1 flex-shrink-0">
                  {(() => {
                    const cleanKey = (item.imageKey || "").trim();
                    const fallback = `https://picsum.photos/seed/${cleanKey || "zipdam"}/150/150`;
                    const imgSrc = cleanKey.startsWith("http")
                      ? cleanKey
                      : fallback;
                    return (
                      <img
                        src={imgSrc}
                        className="w-full h-full object-cover rounded-lg mix-blend-multiply"
                        onError={(e) => {
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                            e.currentTarget.onerror = null;
                          }
                        }}
                      />
                    );
                  })()}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-zipdam-text">
                        {item.name}
                      </h3>
                      <span className="font-bold text-sm text-zipdam-gold">
                        {formatTHB((item.promoPrice || item.price) * item.qty)}
                      </span>
                    </div>
                    <p className="text-xs text-zipdam-muted">
                      {item.brand} • {item.size}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center bg-white rounded-lg border border-zipdam-border shadow-sm">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-zipdam-muted hover:text-zipdam-text"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold w-6 text-center text-zipdam-text">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-zipdam-muted hover:text-zipdam-text"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-zipdam-danger font-medium underline"
                    >
                      {TH.remove}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Totals */}
        <div className="p-6 bg-zipdam-surface border-t border-zipdam-border pb-10">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-zipdam-muted">
              <span>{TH.subtotal}</span>
              <span>{formatTHB(itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-zipdam-muted">
              <span>{TH.shipping}</span>
              <span>
                {itemsTotal > 0 ? formatTHB(SHIPPING_FEE) : formatTHB(0)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg text-zipdam-text pt-2 border-t border-zipdam-border">
              <span>{TH.total}</span>
              <span className="text-transparent bg-clip-text bg-zipdam-gradient">
                {formatTHB(grandTotal)}
              </span>
            </div>
          </div>

          <motion.button
            whileTap={tapScale}
            className="w-full bg-zipdam-gradient text-white h-14 rounded-xl font-bold text-lg shadow-lg shadow-zipdam-gold/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-shadow"
            disabled={items.length === 0 || isSubmitting}
            onClick={performCheckout}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
                <span>กำลังสั่งซื้อ...</span>
              </span>
            ) : (
              TH.placeOrder
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Contact info modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowContactModal(false)}
          >
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    ข้อมูลร้าน / การจัดส่ง
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    กรอกครั้งเดียว ระบบจะจำให้ครั้งต่อไป
                  </p>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    ชื่อร้าน
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zipdam-gold"
                    placeholder="เช่น Play2Girl, Magic"
                    value={contactInfo.store}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        store: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    ซอย / พื้นที่
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zipdam-gold"
                    placeholder="เช่น ซ.กิ่งแก้ว 25/1"
                    value={contactInfo.area}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        area: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    เบอร์โทร
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zipdam-gold"
                    placeholder="เช่น 0812345678"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    ที่อยู่ (ถ้ามี)
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zipdam-gold"
                    placeholder="บ้านเลขที่, อาคาร, หมายเหตุจัดส่ง"
                    value={contactInfo.address}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {contactLoading
                    ? "กำลังเช็คข้อมูลเดิม..."
                    : "บันทึกเพื่อใช้ครั้งต่อไป"}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-700 font-semibold"
                  onClick={() => setShowContactModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  className="flex-1 h-12 rounded-xl bg-zipdam-gradient text-white font-bold shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={
                    !contactInfo.store ||
                    !contactInfo.area ||
                    !contactInfo.phone
                  }
                  onClick={() => {
                    persistContact(contactInfo);
                    setShowContactModal(false);
                  }}
                >
                  บันทึก
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
