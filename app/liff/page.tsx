"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { BrowseView } from '../../components/BrowseView';
import { StickyCartBar } from '../../components/StickyCartBar';
import { CartProvider } from '../../components/CartContext';
import { FavoritesProvider } from '../../components/FavoritesContext';
import { Toast } from '../../components/Toast';
import { CartSheet } from '../../components/CartSheet';
import { OrderSuccess } from '../../components/OrderSuccess';
import { MOCK_PRODUCTS } from '../../lib/tokens';
import { Product } from '../../types';
import { getLiffAuth, initializeLiffAuth } from '../../lib/liffAuth';

export default function LiffPage() {
  const [products, setProducts] = useState<Product[]>([...MOCK_PRODUCTS]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{ displayName?: string; pictureUrl?: string }>({});

  useEffect(() => {
    const existing = getLiffAuth();
    if (existing.displayName || existing.lineUserId) {
      setProfile({ displayName: existing.displayName, pictureUrl: existing.pictureUrl });
    }

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2008727011-FNiAJIzb';
    let cancelled = false;
    if (!liffId) return;

    (async () => {
      try {
        const auth = await initializeLiffAuth(liffId);
        if (!cancelled && auth) {
          setProfile({
            displayName: auth.displayName,
            pictureUrl: auth.pictureUrl,
          });
        }
      } catch (err) {
        console.error('LIFF init failed', err);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const renderSkeleton = () => (
    <div className="space-y-4 px-4 mt-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-zipdam-border rounded-2xl p-4 shadow-sm animate-pulse">
          <div className="h-4 w-32 bg-zipdam-border/50 rounded mb-3"></div>
          <div className="h-3 w-full bg-zipdam-border/40 rounded mb-2"></div>
          <div className="h-3 w-4/5 bg-zipdam-border/30 rounded"></div>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    // Fetch real data on mount
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(err => console.error("Failed to load catalog", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <CartProvider>
      <FavoritesProvider>
      <main className="min-h-screen pb-safe-area relative bg-zipdam-bg text-zipdam-text font-sans">
        <Header displayName={profile.displayName} pictureUrl={profile.pictureUrl} />
        
        {isLoading ? (
          <div className="mt-4">{renderSkeleton()}</div>
        ) : (
          <div className="mt-4">
            <BrowseView products={products} />
          </div>
        )}

        <StickyCartBar />
        <Toast />
        <CartSheet />
        <OrderSuccess />
      </main>
      </FavoritesProvider>
    </CartProvider>
  );
}
