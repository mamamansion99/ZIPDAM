import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { slideUpSheet, tapScale } from '../lib/motion';
import { TH, formatTHB } from '../lib/i18n';

export const StickyCartBar = () => {
  const { itemsCount, grandTotal, setCartOpen } = useCart();

  return (
    <AnimatePresence>
      {itemsCount > 0 && (
        <motion.div
          variants={slideUpSheet}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-zipdam-bg via-zipdam-bg/95 to-transparent pt-8 pb-safe-bottom"
        >
          <div className="max-w-md mx-auto">
             <motion.button
                whileTap={tapScale}
                onClick={() => setCartOpen(true)}
                className="w-full bg-zipdam-gradient text-white rounded-2xl h-14 px-5 flex items-center justify-between shadow-lg shadow-zipdam-gold/40 hover:shadow-xl hover:shadow-zipdam-gold/50 transition-all duration-300"
             >
                <div className="flex items-center gap-3">
                   <div className="bg-white/25 px-2.5 py-1 rounded-lg text-sm font-bold backdrop-blur-md border border-white/10">
                      {itemsCount} {TH.items}
                   </div>
                   <div className="flex flex-col items-start">
                      <span className="text-[10px] text-white/90 uppercase tracking-wider font-medium">{TH.total}</span>
                      <span className="font-bold leading-none text-white drop-shadow-sm">{formatTHB(grandTotal)}</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-2 font-bold text-lg text-white drop-shadow-sm">
                   {TH.placeOrder}
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                </div>
             </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};