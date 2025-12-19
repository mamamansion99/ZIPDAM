import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { SegmentedControl } from './components/SegmentedControl';
import { QuickOrderView } from './components/QuickOrderView';
import { BrowseView } from './components/BrowseView';
import { StickyCartBar } from './components/StickyCartBar';
import { CartProvider } from './components/CartContext';
import { Toast } from './components/Toast';
import { CartSheet } from './components/CartSheet';
import { MOCK_PRODUCTS } from './lib/tokens';
import { Product } from './types';
import { setLiffAuth, getLiffAuth } from './lib/liffAuth';

function App() {
  const [activeTab, setActiveTab] = useState<'quick' | 'browse'>('quick');
  const [products, setProducts] = useState<Product[]>([...MOCK_PRODUCTS]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{ displayName?: string; pictureUrl?: string }>({});

  useEffect(() => {
    const existing = getLiffAuth();
    if (existing.displayName || existing.lineUserId) {
      setProfile({ displayName: existing.displayName, pictureUrl: existing.pictureUrl });
    }

    const liffId = (import.meta as any).env?.VITE_LIFF_ID || (window as any)?.NEXT_PUBLIC_LIFF_ID || '2008727011-FNiAJIzb';
    let cancelled = false;
    if (!liffId) return;

    (async () => {
      try {
        const liff = (await import('@line/liff')).default;
        await liff.init({ liffId });
        await liff.ready;
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        const [p, idToken] = await Promise.all([liff.getProfile(), liff.getIDToken()]);
        if (!cancelled) {
          setLiffAuth({
            idToken: idToken || undefined,
            lineUserId: p?.userId,
            displayName: p?.displayName,
          });
          setProfile({ displayName: p?.displayName, pictureUrl: p?.pictureUrl });
        }
      } catch (err) {
        console.error('LIFF init failed', err);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // For the SPA preview (index.html), /api/catalog might not exist unless 
  // proxied or mocked. We include the fetch for completeness, 
  // but it will likely fallback to MOCK_PRODUCTS if 404.
  useEffect(() => {
    fetch('/api/catalog')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('API not available');
      })
      .then(data => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(err => {
        console.log("Running in standalone mode or API unavailable, using mock data.");
      });
  }, []);

  return (
    <CartProvider>
      <main className="min-h-screen pb-24 relative bg-zipdam-surface font-sans text-zipdam-text">
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
                <QuickOrderView products={products} />
              </motion.div>
            ) : (
              <motion.div
                key="browse"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <BrowseView products={products} />
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

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}