import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "./CartContext";
import {
  getShippingFee,
  SHIPPING_FEE,
  LOW_ORDER_SHIPPING_FEE,
  SHIPPING_THRESHOLD,
} from "../lib/tokens";
import { slideUpSheet, tapScale } from "../lib/motion";
import { TH, formatTHB } from "../lib/i18n";
import {
  getLiffAuth,
  isExpiredLineTokenError,
  LiffReauthStartedError,
  requireLiffAuth,
  restartLiffAuth,
} from "../lib/liffAuth";
import { AdminCustomer, NewAdminCustomer } from "../types";

type ContactInfo = {
  store: string;
  area: string;
  phone: string;
  address: string;
};

const EMPTY_CONTACT: ContactInfo = {
  store: "",
  area: "",
  phone: "",
  address: "",
};

const EMPTY_NEW_CUSTOMER: NewAdminCustomer = {
  displayName: "",
  store: "",
  area: "",
  phone: "",
  address: "",
};

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
  const [contactInfo, setContactInfo] = useState<ContactInfo>(EMPTY_CONTACT);
  const [selfContactInfo, setSelfContactInfo] =
    useState<ContactInfo>(EMPTY_CONTACT);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLowOrderShippingModal, setShowLowOrderShippingModal] =
    useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orderMode, setOrderMode] = useState<"SELF" | "ADMIN">("SELF");
  const [selectedCustomer, setSelectedCustomer] =
    useState<AdminCustomer | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<AdminCustomer[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState("");
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomer, setNewCustomer] =
    useState<NewAdminCustomer>(EMPTY_NEW_CUSTOMER);
  const [customerCreating, setCustomerCreating] = useState(false);
  const [customerCreateError, setCustomerCreateError] = useState("");
  const shippingFee = getShippingFee(itemsTotal);
  const isLowOrderShipping =
    itemsTotal > 0 &&
    itemsTotal < SHIPPING_THRESHOLD &&
    shippingFee === LOW_ORDER_SHIPPING_FEE;

  // load cached + server profile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem("zipdam_contact_info");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setContactInfo((prev) => ({ ...prev, ...parsed }));
        setSelfContactInfo((prev) => ({ ...prev, ...parsed }));
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
          setContactInfo((prev) => {
            const nextInfo = {
              store: profile.store || prev.store || "",
              area: profile.area || prev.area || "",
              phone: profile.phone || prev.phone || "",
              address:
                profile.address ||
                profile.defaultAddress ||
                prev.address ||
                "",
            };
            setSelfContactInfo(nextInfo);
            return nextInfo;
          });
        }
      } catch (_) {
        // ignore
      } finally {
        setContactLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isCartOpen || adminChecked) return;
    let cancelled = false;
    (async () => {
      try {
        const { idToken, lineUserId, displayName } = await requireLiffAuth();
        const response = await fetch("/api/admin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "admin_status",
            idToken,
            lineUserId,
            displayName,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (isExpiredLineTokenError(data?.error)) {
          await restartLiffAuth();
        }
        if (!cancelled) setIsAdmin(Boolean(response.ok && data.isAdmin));
      } catch (_) {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setAdminChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCartOpen, adminChecked]);

  useEffect(() => {
    if (!isLowOrderShipping) {
      setShowLowOrderShippingModal(false);
    }
  }, [isLowOrderShipping]);

  const persistContact = (info: ContactInfo) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("zipdam_contact_info", JSON.stringify(info));
  };

  const missingContact = () =>
    !contactInfo.store || !contactInfo.area || !contactInfo.phone;

  const saveContactProfile = async () => {
    if (isSavingContact) return;
    if (orderMode === "ADMIN") {
      if (missingContact()) return;
      setShowContactModal(false);
      return;
    }
    setIsSavingContact(true);
    try {
      const { idToken, lineUserId, displayName } = await requireLiffAuth();

      const res = await fetch("/api/customer-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "customer_profile_set",
          idToken,
          lineUserId,
          displayName,
          store: contactInfo.store,
          area: contactInfo.area,
          phone: contactInfo.phone,
          address: contactInfo.address,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        if (isExpiredLineTokenError(data.error)) {
          await restartLiffAuth();
        }
        throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      const profile = data.profile || {};
      const nextInfo = {
        store: profile.store || contactInfo.store || "",
        area: profile.area || contactInfo.area || "",
        phone: profile.phone || contactInfo.phone || "",
        address: profile.address || profile.defaultAddress || contactInfo.address || "",
      };
      setContactInfo(nextInfo);
      setSelfContactInfo(nextInfo);
      persistContact(nextInfo);
      setShowContactModal(false);
    } catch (e) {
      if (e instanceof LiffReauthStartedError) return;
      const msg = e instanceof Error ? e.message : String(e);
      setTimeout(() => alert(`บันทึกข้อมูลไม่สำเร็จ: ${msg}`), 0);
    } finally {
      setIsSavingContact(false);
    }
  };

  const searchCustomers = async (query = customerQuery) => {
    if (customerSearching) return;
    setCustomerSearching(true);
    setCustomerSearchError("");
    try {
      const { idToken, lineUserId, displayName } = await requireLiffAuth();
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "admin_customers_search",
          idToken,
          lineUserId,
          displayName,
          query,
          limit: 20,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        if (isExpiredLineTokenError(data.error)) {
          await restartLiffAuth();
        }
        throw new Error(data.error || "ค้นหาลูกค้าไม่สำเร็จ");
      }
      setCustomerResults(
        Array.isArray(data.customers) ? data.customers : [],
      );
    } catch (error) {
      setCustomerResults([]);
      if (error instanceof LiffReauthStartedError) return;
      setCustomerSearchError(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setCustomerSearching(false);
    }
  };

  const openCustomerSelection = () => {
    if (orderMode === "SELF") setSelfContactInfo(contactInfo);
    setShowCreateCustomer(false);
    setCustomerCreateError("");
    setShowCustomerModal(true);
    if (!customerResults.length) void searchCustomers("");
  };

  const chooseCustomer = (customer: AdminCustomer) => {
    setSelectedCustomer(customer);
    setOrderMode("ADMIN");
    setContactInfo({
      store: customer.store || "",
      area: customer.area || "",
      phone: customer.phone || "",
      address: customer.defaultAddress || "",
    });
    setShowCreateCustomer(false);
    setCustomerCreateError("");
    setShowCustomerModal(false);
  };

  const createCustomer = async () => {
    if (customerCreating) return;
    if (
      !newCustomer.displayName.trim() ||
      !newCustomer.store.trim() ||
      !newCustomer.area.trim() ||
      !newCustomer.phone.trim()
    ) {
      setCustomerCreateError("กรุณากรอกชื่อ ร้าน พื้นที่ และเบอร์โทร");
      return;
    }

    setCustomerCreating(true);
    setCustomerCreateError("");
    try {
      const { idToken, lineUserId, displayName } = await requireLiffAuth();
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "admin_customer_create",
          idToken,
          lineUserId,
          displayName,
          customerDisplayName: newCustomer.displayName,
          store: newCustomer.store,
          area: newCustomer.area,
          phone: newCustomer.phone,
          address: newCustomer.address,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false || !data.customer) {
        if (isExpiredLineTokenError(data.error)) {
          await restartLiffAuth();
        }
        throw new Error(data.error || "สร้างลูกค้าไม่สำเร็จ");
      }

      const customer = data.customer as AdminCustomer;
      setCustomerResults((current) => [
        customer,
        ...current.filter((item) => item.customerId !== customer.customerId),
      ]);
      setNewCustomer(EMPTY_NEW_CUSTOMER);
      chooseCustomer(customer);
    } catch (error) {
      if (error instanceof LiffReauthStartedError) return;
      setCustomerCreateError(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setCustomerCreating(false);
    }
  };

  const switchToSelfOrder = () => {
    setOrderMode("SELF");
    setSelectedCustomer(null);
    setContactInfo(selfContactInfo);
  };

  const performCheckout = async (skipLowShippingConfirm = false) => {
    if (!items.length || isSubmitting) return;
    if (orderMode === "ADMIN" && !selectedCustomer) {
      openCustomerSelection();
      return;
    }
    if (missingContact()) {
      setShowContactModal(true);
      return;
    }
    if (isLowOrderShipping && !skipLowShippingConfirm) {
      setShowLowOrderShippingModal(true);
      return;
    }
    setShowLowOrderShippingModal(false);
    setIsSubmitting(true);
    try {
      const { idToken, lineUserId, displayName } = await requireLiffAuth();

      const payload = {
        action: orderMode === "ADMIN" ? "admin_order" : "order",
        idToken,
        lineUserId,
        displayName,
        selectedCustomerId:
          orderMode === "ADMIN" ? selectedCustomer?.customerId : undefined,
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
        })),
      };

      const res = await fetch(
        orderMode === "ADMIN" ? "/api/admin" : "/api/order",
        {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        if (isExpiredLineTokenError(data.error)) {
          await restartLiffAuth();
        }
        throw new Error(data.error || "Order failed");
      }

      clearCart();
      setCartOpen(false);
      triggerOrderSuccess(data.orderId);
      if (orderMode === "SELF") persistContact(contactInfo);
      if (orderMode === "ADMIN") switchToSelfOrder();
    } catch (e) {
      if (e instanceof LiffReauthStartedError) return;
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

        {/* Admin order mode */}
        {isAdmin && (
          <div className="px-6 pt-4">
            <div className="rounded-2xl border border-zipdam-gold/30 bg-zipdam-gold/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-zipdam-gold">
                  Admin order
                </span>
                {orderMode === "ADMIN" && selectedCustomer && (
                  <span className="rounded-full bg-zipdam-gold/10 px-2 py-1 text-[10px] font-semibold text-zipdam-gold">
                    สั่งให้ลูกค้า
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={switchToSelfOrder}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    orderMode === "SELF"
                      ? "bg-zipdam-gradient text-white"
                      : "text-zipdam-muted hover:text-zipdam-text"
                  }`}
                >
                  ออเดอร์ของฉัน
                </button>
                <button
                  type="button"
                  onClick={openCustomerSelection}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    orderMode === "ADMIN"
                      ? "bg-zipdam-gradient text-white"
                      : "text-zipdam-muted hover:text-zipdam-text"
                  }`}
                >
                  สั่งให้ลูกค้า
                </button>
              </div>
              {orderMode === "ADMIN" && selectedCustomer && (
                <button
                  type="button"
                  onClick={openCustomerSelection}
                  className="mt-3 w-full rounded-xl border border-zipdam-border bg-white p-3 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-zipdam-text">
                        {selectedCustomer.displayName}
                      </div>
                      <div className="mt-0.5 text-xs text-zipdam-muted">
                        {selectedCustomer.store || "ยังไม่มีชื่อร้าน"}
                        {selectedCustomer.phone
                          ? ` • ${selectedCustomer.phone}`
                          : ""}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-zipdam-gold">
                      เปลี่ยน
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contact summary */}
        <div className="px-6 pt-4">
          <div className="bg-white border border-zipdam-border rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs uppercase tracking-wide text-zipdam-muted font-semibold">
                  {orderMode === "ADMIN"
                    ? `ข้อมูลจัดส่งของ ${selectedCustomer?.displayName || "ลูกค้า"}`
                    : "ข้อมูลจัดส่ง"}
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
              <span>{formatTHB(shippingFee)}</span>
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

      {/* Admin customer selection */}
      <AnimatePresence>
        {showCustomerModal && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCustomerModal(false)}
          >
            <div
              className="flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-zipdam-border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {showCreateCustomer ? "สร้างลูกค้าใหม่" : "เลือกลูกค้า"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {showCreateCustomer
                        ? "ลูกค้าใหม่จะยังไม่เชื่อม LINE และไม่ร่วมสะสมยอด"
                        : "ค้นหาด้วยชื่อ ร้าน เบอร์โทร หรือรหัสลูกค้า"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(false)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                {showCreateCustomer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateCustomer(false);
                      setCustomerCreateError("");
                    }}
                    className="mt-4 text-sm font-semibold text-zipdam-gold"
                  >
                    ← กลับไปเลือกลูกค้า
                  </button>
                ) : (
                  <>
                    <form
                      className="mt-4 flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void searchCustomers();
                      }}
                    >
                      <input
                        className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zipdam-gold"
                        placeholder="ชื่อลูกค้า / ร้าน / เบอร์โทร"
                        value={customerQuery}
                        onChange={(event) =>
                          setCustomerQuery(event.target.value)
                        }
                      />
                      <button
                        type="submit"
                        disabled={customerSearching}
                        className="rounded-xl bg-zipdam-gradient px-4 py-2 font-semibold text-white disabled:opacity-60"
                      >
                        {customerSearching ? "กำลังค้น..." : "ค้นหา"}
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateCustomer(true);
                        setCustomerCreateError("");
                      }}
                      className="mt-3 w-full rounded-xl border border-zipdam-gold/40 bg-zipdam-gold/5 px-4 py-2.5 text-sm font-bold text-zipdam-gold"
                    >
                      + สร้างลูกค้าใหม่
                    </button>
                  </>
                )}
              </div>

              {showCreateCustomer ? (
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {customerCreateError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {customerCreateError}
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      ชื่อลูกค้า
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zipdam-gold"
                      placeholder="ชื่อที่ใช้เรียกลูกค้า"
                      value={newCustomer.displayName}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          displayName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      ชื่อร้าน
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zipdam-gold"
                      placeholder="ชื่อร้าน"
                      value={newCustomer.store}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          store: event.target.value,
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
                      placeholder="พื้นที่จัดส่ง"
                      value={newCustomer.area}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          area: event.target.value,
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
                      value={newCustomer.phone}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          phone: event.target.value,
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
                      rows={3}
                      value={newCustomer.address}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    disabled={customerCreating}
                    onClick={() => void createCustomer()}
                    className="h-12 w-full rounded-xl bg-zipdam-gradient font-bold text-white shadow-md disabled:opacity-60"
                  >
                    {customerCreating
                      ? "กำลังสร้างลูกค้า..."
                      : "สร้างและเลือกลูกค้านี้"}
                  </button>
                </div>
              ) : (
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {customerSearchError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {customerSearchError}
                  </div>
                )}
                {!customerSearching &&
                  !customerSearchError &&
                  customerResults.length === 0 && (
                    <div className="py-10 text-center text-sm text-zipdam-muted">
                      ไม่พบลูกค้า
                    </div>
                  )}
                {customerResults.map((customer) => (
                  <button
                    type="button"
                    key={customer.customerId}
                    onClick={() => chooseCustomer(customer)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      selectedCustomer?.customerId === customer.customerId
                        ? "border-zipdam-gold bg-zipdam-gold/5"
                        : "border-zipdam-border bg-white hover:border-zipdam-gold/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-zipdam-text">
                          {customer.displayName}
                        </div>
                        <div className="mt-1 truncate text-sm text-zipdam-muted">
                          {customer.store || "ยังไม่มีชื่อร้าน"}
                        </div>
                        <div className="mt-1 text-xs text-zipdam-muted">
                          {[customer.area, customer.phone]
                            .filter(Boolean)
                            .join(" • ") || "ยังไม่มีข้อมูลจัดส่ง"}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-zipdam-surface2 px-2 py-1 text-[10px] font-medium text-zipdam-muted">
                        {customer.lineUserId
                          ? `LINE …${customer.lineUserId.slice(-6)}`
                          : customer.customerId}
                      </span>
                    </div>
                  </button>
                ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    {orderMode === "ADMIN"
                      ? "ข้อมูลนี้จะบันทึกลงโปรไฟล์ลูกค้าเมื่อสร้างออเดอร์"
                      : "กรอกครั้งเดียว ระบบจะจำให้ครั้งต่อไป"}
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
                  disabled={isSavingContact}
                >
                  ยกเลิก
                </button>
                <button
                  className="flex-1 h-12 rounded-xl bg-zipdam-gradient text-white font-bold shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={
                    isSavingContact ||
                    !contactInfo.store ||
                    !contactInfo.area ||
                    !contactInfo.phone
                  }
                  onClick={saveContactProfile}
                >
                  {isSavingContact
                    ? "กำลังบันทึก..."
                    : orderMode === "ADMIN"
                      ? "ใช้ข้อมูลนี้"
                      : "บันทึก"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low-order shipping notice modal */}
      <AnimatePresence>
        {showLowOrderShippingModal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLowOrderShippingModal(false)}
          >
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900">
                แจ้งค่าส่ง {formatTHB(LOW_ORDER_SHIPPING_FEE)}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ยอดสั่งซื้อสินค้าต่ำกว่า {formatTHB(SHIPPING_THRESHOLD)} ระบบจะคิดค่าส่ง{" "}
                {formatTHB(LOW_ORDER_SHIPPING_FEE)} สำหรับออเดอร์นี้
              </p>
              <p className="text-sm text-zipdam-gold font-semibold">
                เพิ่มสินค้าให้ครบ {formatTHB(SHIPPING_THRESHOLD)} เพื่อค่าส่ง{" "}
                {formatTHB(SHIPPING_FEE)}
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-700 font-semibold"
                  onClick={() => setShowLowOrderShippingModal(false)}
                  disabled={isSubmitting}
                >
                  กลับไปแก้ไข
                </button>
                <button
                  className="flex-1 h-12 rounded-xl bg-zipdam-gradient text-white font-bold shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => performCheckout(true)}
                  disabled={isSubmitting}
                >
                  ยืนยันสั่งซื้อ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
