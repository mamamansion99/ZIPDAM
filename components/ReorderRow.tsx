"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { tapScale } from '../lib/motion';
import { useCart } from './CartContext';
import { useFavorites } from './FavoritesContext';
import { TH, formatTHB } from '../lib/i18n';
import { getLiffAuth } from '../lib/liffAuth';
import { Product } from '../types';

interface ReorderRowProps {
  products: Product[];
}

interface FrequentItem {
  Brand?: string;
  Size?: string;
  Name?: string;
  count?: number;
}

const norm = (value: unknown) => String(value ?? '').trim().toLowerCase();

/** Frequent items come back without a SKU, so match on brand+size+name like the backend does. */
const matchFrequent = (product: Product, item: FrequentItem) =>
  norm(product.brand) === norm(item.Brand) &&
  norm(product.size) === norm(item.Size) &&
  norm(product.name) === norm(item.Name);

export const ReorderRow: React.FC<ReorderRowProps> = ({ products }) => {
  const { addToCart, items } = useCart();
  const { isFavorite } = useFavorites();
  const [frequent, setFrequent] = useState<FrequentItem[]>([]);

  useEffect(() => {
    const auth = getLiffAuth();
    if (!auth.idToken && !auth.lineUserId) return;

    let cancelled = false;
    fetch('/api/frequent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        idToken: auth.idToken || '',
        lineUserId: auth.lineUserId || '',
        limit: 8,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled && Array.isArray(data?.frequent)) setFrequent(data.frequent);
      })
      .catch(err => console.error('frequent_get failed', err));

    return () => { cancelled = true; };
  }, []);

  // Previously ordered items lead, favourites the user has never bought follow.
  const reorderProducts = useMemo(() => {
    const ordered: Product[] = [];
    frequent.forEach(item => {
      const match = products.find(p => matchFrequent(p, item));
      if (match && !ordered.some(p => p.id === match.id)) ordered.push(match);
    });

    products.forEach(p => {
      if (isFavorite(p) && !ordered.some(o => o.id === p.id)) ordered.push(p);
    });

    return ordered.slice(0, 10);
  }, [frequent, products, isFavorite]);

  if (reorderProducts.length === 0) return null;

  return (
    <section className="space-y-2" aria-label={TH.sectionReorder}>
      <div className="px-4 flex items-baseline justify-between">
        <h2 className="text-base font-bold text-zipdam-text">{TH.sectionReorder}</h2>
        <span className="text-[11px] text-zipdam-muted">{TH.sectionReorderHint}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {reorderProducts.map(product => {
          const inCartQty = items.find(i => i.id === product.id)?.qty || 0;
          const currentPrice = product.promoPrice && product.promoPrice > 0
            ? product.promoPrice
            : product.price;
          const cleanKey = (product.imageKey || '').trim();
          const imageSrc = cleanKey.startsWith('http') ? cleanKey : '';

          return (
            <div
              key={product.id}
              className="shrink-0 w-[128px] bg-white rounded-2xl border border-zipdam-border shadow-sm p-2 flex flex-col"
            >
              <div className="aspect-square w-full rounded-xl bg-gray-50 border border-gray-100 overflow-hidden mb-2">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-zipdam-muted">
                    {product.brand}
                  </div>
                )}
              </div>

              <p className="text-[11px] font-semibold text-zipdam-text leading-tight line-clamp-2 min-h-[2.4em]">
                {product.name}
              </p>
              <p className="text-[10px] text-zipdam-muted mb-2">{product.size}</p>

              <div className="mt-auto flex items-center justify-between gap-1">
                <span className="text-sm font-bold text-zipdam-gold">
                  {formatTHB(currentPrice)}
                </span>
                <motion.button
                  whileTap={tapScale}
                  onClick={() => addToCart(product)}
                  aria-label={`${TH.add} ${product.name}`}
                  className={
                    "h-11 w-11 shrink-0 rounded-full flex items-center justify-center border shadow-sm transition-all " +
                    (inCartQty > 0
                      ? "bg-zipdam-gradient text-white border-transparent"
                      : "bg-white text-zipdam-text border-zipdam-border hover:border-zipdam-gold")
                  }
                >
                  {inCartQty > 0 ? (
                    <span className="font-bold text-sm drop-shadow-sm">{inCartQty}</span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
