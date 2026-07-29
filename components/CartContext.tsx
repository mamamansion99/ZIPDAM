"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { getShippingFee } from '../lib/tokens';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, delta: number) => void;
  clearCart: () => void;
  itemsCount: number;
  itemsTotal: number;
  grandTotal: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  lastAddedId: string | null;
  orderSuccess: { orderId?: string } | null;
  triggerOrderSuccess: (orderId?: string) => void;
  dismissOrderSuccess: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "zipdam_cart_items";
const RESUME_CART_KEY = "zipdam_resume_cart";

export function CartProvider({ children }: { children?: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId?: string } | null>(null);

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(CART_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (item) =>
                item &&
                typeof item.id === "string" &&
                Number.isFinite(Number(item.qty)) &&
                Number(item.qty) > 0,
            ),
          );
        }
      }
      if (window.sessionStorage.getItem(RESUME_CART_KEY) === "1") {
        window.sessionStorage.removeItem(RESUME_CART_KEY);
        setCartOpen(true);
      }
    } catch (_) {
      // Ignore damaged browser storage and start with an empty cart.
    } finally {
      setCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (_) {
      // Storage can be unavailable in private browser contexts.
    }
  }, [items, cartHydrated]);

  // Auto-clear last added trigger
  useEffect(() => {
    if (lastAddedId) {
      const timer = setTimeout(() => setLastAddedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedId]);

  const addToCart = (product: Product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { ...product, qty }];
    });
    setLastAddedId(product.id);
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    setItems(prev => {
      return prev.map(i => {
        if (i.id === productId) {
          const newQty = Math.max(0, i.qty + delta);
          return { ...i, qty: newQty };
        }
        return i;
      }).filter(i => i.qty > 0);
    });
  };

  const clearCart = () => setItems([]);

  const triggerOrderSuccess = (orderId?: string) => setOrderSuccess({ orderId });

  const dismissOrderSuccess = () => setOrderSuccess(null);

  const itemsCount = useMemo(() => items.reduce((acc, i) => acc + i.qty, 0), [items]);
  
  const itemsTotal = useMemo(() => items.reduce((acc, i) => {
    const price = (i.promoPrice && i.promoPrice > 0) ? i.promoPrice : i.price;
    return acc + (price * i.qty);
  }, 0), [items]);

  const shippingFee = getShippingFee(itemsTotal);
  const grandTotal = itemsTotal + shippingFee;

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      itemsCount,
      itemsTotal,
      grandTotal,
      isCartOpen,
      setCartOpen,
      lastAddedId,
      orderSuccess,
      triggerOrderSuccess,
      dismissOrderSuccess
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
