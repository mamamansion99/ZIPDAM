"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { BrowseView } from '../../components/BrowseView';
import { ReorderRow } from '../../components/ReorderRow';
import { StickyCartBar } from '../../components/StickyCartBar';
import { CartProvider } from '../../components/CartContext';
import { FavoritesProvider } from '../../components/FavoritesContext';
import { Toast } from '../../components/Toast';
import { CartSheet } from '../../components/CartSheet';
import { OrderSuccess } from '../../components/OrderSuccess';
import { ProfileSheet } from '../../components/ProfileSheet';
import { TH } from '../../lib/i18n';
import { Product } from '../../types';
import { getLiffAuth, initializeLiffAuth } from '../../lib/liffAuth';

type CatalogStatus = 'loading' | 'ready' | 'error';

export default function LiffPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<CatalogStatus>('loading');
  const [profile, setProfile] = useState<{ displayName?: string; pictureUrl?: string }>({});
  const [profileOpen, setProfileOpen] = useState(false);

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

  const loadCatalog = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (!res.ok || data?.ok === false || !Array.isArray(data?.products)) {
        throw new Error(data?.error || 'CATALOG_UNAVAILABLE');
      }
      setProducts(data.products);
      setStatus('ready');
    } catch (err) {
      console.error('Failed to load catalog', err);
      setProducts([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  // Mirrors the real 2-column grid so nothing jumps when the catalog lands.
  const renderSkeleton = () => (
    <div className="px-4 grid grid-cols-2 gap-3" aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-zipdam-border rounded-2xl p-3 shadow-sm animate-pulse">
          <div className="aspect-square w-full rounded-xl bg-zipdam-border/40 mb-3"></div>
          <div className="h-3 w-4/5 bg-zipdam-border/50 rounded mb-2"></div>
          <div className="h-3 w-2/5 bg-zipdam-border/30 rounded mb-4"></div>
          <div className="h-5 w-1/2 bg-zipdam-border/40 rounded"></div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="px-4">
      <div className="bg-white border border-zipdam-border rounded-2xl p-6 text-center shadow-sm">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zipdam-surface2 flex items-center justify-center text-zipdam-danger">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="font-bold text-zipdam-text mb-1">{TH.catalogErrorTitle}</h2>
        <p className="text-sm text-zipdam-muted mb-4">{TH.catalogErrorMessage}</p>
        <button
          onClick={loadCatalog}
          className="bg-zipdam-gradient text-white font-bold text-sm rounded-xl h-11 px-6 shadow-md shadow-zipdam-gold/30"
        >
          {TH.retry}
        </button>
      </div>
    </div>
  );

  return (
    <CartProvider>
      <FavoritesProvider>
      <main className="min-h-screen pb-safe-area relative bg-zipdam-bg text-zipdam-text font-sans">
        <div className="mx-auto w-full max-w-md">
          <Header
            displayName={profile.displayName}
            pictureUrl={profile.pictureUrl}
            onProfileClick={() => setProfileOpen(true)}
          />

          <div className="mt-4 space-y-4">
            {status === 'loading' && renderSkeleton()}
            {status === 'error' && renderError()}
            {status === 'ready' && (
              <>
                <ReorderRow products={products} />
                <BrowseView products={products} />
              </>
            )}
          </div>
        </div>

        <StickyCartBar />
        <Toast />
        <CartSheet />
        <OrderSuccess />
        <ProfileSheet
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          products={products}
          displayName={profile.displayName}
          pictureUrl={profile.pictureUrl}
        />
      </main>
      </FavoritesProvider>
    </CartProvider>
  );
}
