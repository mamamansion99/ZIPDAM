import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { SHIPPING_FEE } from '../lib/tokens';
import { slideUpSheet, tapScale } from '../lib/motion';
import { TH, formatTHB } from '../lib/i18n';
import { getLiffAuth } from '../lib/liffAuth';

export const CartSheet = () => {
  const { isCartOpen, setCartOpen, items, updateQty, removeFromCart, itemsTotal, grandTotal, clearCart, triggerOrderSuccess } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!items.length || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const auth = getLiffAuth();

      let idToken = auth.idToken || '';
      let lineUserId = auth.lineUserId || '';
      let displayName = auth.displayName || '';

      // Refresh LIFF idToken/profile right before submit (idToken can expire).
      try {
        const liff = (await import('@line/liff')).default;
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
        action: 'order',
        idToken,
        lineUserId,
        displayName,
        cart: items.map(i => ({
          SKU: i.id,
          Brand: i.brand,
          Size: i.size,
          Name: i.name,
          qty: i.qty,
          price: i.promoPrice ?? i.price,
        })),
      };

      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Order failed');
      }

      clearCart();
      setCartOpen(false);
      triggerOrderSuccess(data.orderId);
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
         <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setCartOpen(false)}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
         </div>

         {/* Header */}
         <div className="px-6 py-4 border-b border-zipdam-border flex justify-between items-center">
            <h2 className="text-xl font-bold text-zipdam-text">{TH.cart}</h2>
            <button onClick={() => setCartOpen(false)} className="text-zipdam-muted hover:text-zipdam-text">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
         </div>

         {/* Items Scroll */}
         <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zipdam-bg/50">
            {items.length === 0 ? (
               <div className="text-center py-10 text-zipdam-muted">{TH.emptyCart}</div>
            ) : (
               items.map(item => (
                  <div key={item.id} className="flex gap-4">
                     <div className="w-20 h-20 rounded-xl bg-white border border-gray-100 p-1 flex-shrink-0">
                        <img src={`https://picsum.photos/seed/${item.imageKey}/150/150`} className="w-full h-full object-cover rounded-lg mix-blend-multiply" />
                     </div>
                     <div className="flex-1 flex flex-col justify-between">
                        <div>
                           <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-zipdam-text">{item.name}</h3>
                              <span className="font-bold text-sm text-zipdam-gold">{formatTHB((item.promoPrice || item.price) * item.qty)}</span>
                           </div>
                           <p className="text-xs text-zipdam-muted">{item.brand} • {item.size}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2">
                           <div className="flex items-center bg-white rounded-lg border border-zipdam-border shadow-sm">
                              <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-zipdam-muted hover:text-zipdam-text">-</button>
                              <span className="text-sm font-semibold w-6 text-center text-zipdam-text">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-zipdam-muted hover:text-zipdam-text">+</button>
                           </div>
                           <button onClick={() => removeFromCart(item.id)} className="text-xs text-zipdam-danger font-medium underline">{TH.remove}</button>
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
                  <span>{itemsTotal > 0 ? formatTHB(SHIPPING_FEE) : formatTHB(0)}</span>
               </div>
               <div className="flex justify-between font-bold text-lg text-zipdam-text pt-2 border-t border-zipdam-border">
                  <span>{TH.total}</span>
                  <span className="text-transparent bg-clip-text bg-zipdam-gradient">{formatTHB(grandTotal)}</span>
               </div>
            </div>

            <motion.button
               whileTap={tapScale}
               className="w-full bg-zipdam-gradient text-white h-14 rounded-xl font-bold text-lg shadow-lg shadow-zipdam-gold/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-shadow"
               disabled={items.length === 0 || isSubmitting}
               onClick={handleCheckout}
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
    </div>
  );
};
