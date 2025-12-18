import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { cn } from '../lib/tokens';
import { TH } from '../lib/i18n';

export const Toast = () => {
  const { lastAddedId } = useCart();

  return (
    <AnimatePresence>
      {lastAddedId && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={cn(
            "fixed top-4 left-1/2 z-50",
            "bg-zipdam-gradient text-white px-5 py-2.5 rounded-full shadow-xl shadow-zipdam-gold/20",
            "flex items-center gap-2 text-sm font-bold border border-white/20"
          )}
        >
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-zipdam-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {TH.addedToCart}
        </motion.div>
      )}
    </AnimatePresence>
  );
};