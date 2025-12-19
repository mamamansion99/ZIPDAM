import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from './CartContext';
import { TH } from '../lib/i18n';

export const OrderSuccess = () => {
  const { orderSuccess, dismissOrderSuccess } = useCart();

  return (
    <AnimatePresence>
      {orderSuccess && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            onClick={dismissOrderSuccess}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative pointer-events-auto w-full max-w-sm bg-zipdam-surface rounded-3xl shadow-2xl border border-zipdam-border overflow-hidden"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <div className="absolute inset-0 bg-zipdam-gradient/10" />
            <div className="relative px-6 pt-6 pb-5 text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-zipdam-success/10 border border-zipdam-success/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-zipdam-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-zipdam-text">{TH.orderSuccessTitle}</h3>
                <p className="text-sm text-zipdam-text/80 mt-1 leading-relaxed">
                  {TH.orderSuccessMessage}
                </p>
                <p className="text-xs text-zipdam-muted mt-1">{TH.orderSuccessHint}</p>
                {orderSuccess.orderId && (
                  <p className="text-xs text-zipdam-muted mt-2">
                    หมายเลขคำสั่งซื้อ: <span className="font-semibold text-zipdam-text">{orderSuccess.orderId}</span>
                  </p>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={dismissOrderSuccess}
                className="w-full bg-zipdam-gradient text-white font-bold py-3 rounded-2xl shadow-md shadow-zipdam-gold/30 hover:shadow-lg transition-shadow"
              >
                {TH.orderSuccessCTA}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
