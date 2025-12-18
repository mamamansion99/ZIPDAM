"use client";

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '../../components/Header';
import { SegmentedControl } from '../../components/SegmentedControl';
import { QuickOrderView } from '../../components/QuickOrderView';
import { BrowseView } from '../../components/BrowseView';
import { StickyCartBar } from '../../components/StickyCartBar';
import { CartProvider } from '../../components/CartContext';
import { Toast } from '../../components/Toast';
import { CartSheet } from '../../components/CartSheet';

export default function LiffPage() {
  const [activeTab, setActiveTab] = useState<'quick' | 'browse'>('quick');

  return (
    <CartProvider>
      <main className="min-h-screen pb-safe-area relative bg-zipdam-bg text-zipdam-text font-sans">
        <Header />
        <SegmentedControl activeTab={activeTab} onChange={setActiveTab} />
        
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'quick' ? (
              <motion.div
                key="quick"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <QuickOrderView />
              </motion.div>
            ) : (
              <motion.div
                key="browse"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <BrowseView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <StickyCartBar />
        <Toast />
        <CartSheet />
      </main>
    </CartProvider>
  );
}