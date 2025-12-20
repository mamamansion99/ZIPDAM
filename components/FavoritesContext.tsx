"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Product } from '../types';
import { getLiffAuth } from '../lib/liffAuth';

interface FavoriteItem {
  SKU?: string;
  Brand?: string;
  Size?: string;
  Name?: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  loading: boolean;
  isFavorite: (product: Product) => boolean;
  toggleFavorite: (product: Product) => Promise<void>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const matchFavorite = (product: Product, fav: FavoriteItem) => {
  const skuMatch = fav.SKU && product.id && fav.SKU === product.id;
  const exactMatch = fav.Brand === product.brand && fav.Size === product.size && fav.Name === product.name;
  return Boolean(skuMatch || exactMatch);
};

async function callFavoritesApi(payload: any) {
  const isGet = payload?.action === 'favorites_get';
  const url = isGet ? `/api/favorites?${new URLSearchParams(payload).toString()}` : '/api/favorites';
  const res = await fetch(url, {
    method: isGet ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json' },
    body: isGet ? undefined : JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || 'Favorites request failed');
  }
  return data;
}

export function FavoritesProvider({ children }: { children?: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  const getIdentity = () => {
    const auth = getLiffAuth();
    let lineUserId = auth.lineUserId || '';
    // Fallback guest id persisted in localStorage
    if (typeof window !== 'undefined' && !lineUserId) {
      const key = 'zipdam_guest_id';
      const existing = window.localStorage.getItem(key);
      if (existing) {
        lineUserId = existing;
      } else {
        lineUserId = `GUEST-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
        window.localStorage.setItem(key, lineUserId);
      }
    }
    return { idToken: auth.idToken || '', lineUserId };
  };

  const fetchFavorites = async () => {
    const identity = getIdentity();
    if (!identity.lineUserId && !identity.idToken) return;
    setLoading(true);
    try {
      const data = await callFavoritesApi({
        action: 'favorites_get',
        idToken: identity.idToken,
        lineUserId: identity.lineUserId,
      });
      if (Array.isArray(data.favorites)) {
        setFavorites(data.favorites);
      }
    } catch (err) {
      console.error('favorites_get failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [authVersion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setAuthVersion(v => v + 1);
    window.addEventListener('zipdam-auth-changed', handler);
    return () => window.removeEventListener('zipdam-auth-changed', handler);
  }, []);

  const isFavorite = useMemo(
    () => (product: Product) => favorites.some(fav => matchFavorite(product, fav)),
    [favorites]
  );

  const toggleFavorite = async (product: Product) => {
    const identity = getIdentity();
    if (!identity.lineUserId && !identity.idToken) return;
    const item: FavoriteItem = {
      SKU: product.id,
      Brand: product.brand,
      Size: product.size,
      Name: product.name,
    };
    const currentlyFav = isFavorite(product);
    // optimistic
    if (currentlyFav) {
      setFavorites(prev => prev.filter(fav => !matchFavorite(product, fav)));
    } else {
      setFavorites(prev => [...prev, item]);
    }
    try {
      await callFavoritesApi({
        action: currentlyFav ? 'favorites_remove' : 'favorites_add',
        idToken: identity.idToken,
        lineUserId: identity.lineUserId,
        item,
      });
    } catch (err) {
      console.error('toggleFavorite failed', err);
      // rollback
      await fetchFavorites();
    }
  };

  const value: FavoritesContextType = {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    refresh: fetchFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
