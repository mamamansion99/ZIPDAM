import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import { formatTHB, TH } from '../lib/i18n';
import { tapScale } from '../lib/motion';
import { useCart } from './CartContext';
import { cn } from '../lib/tokens';
import { useFavorites } from './FavoritesContext';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favoriteActive = isFavorite(product);
  const isPromo = product.promoPrice && product.promoPrice > 0;
  const currentPrice = isPromo ? product.promoPrice! : product.price;
  const cleanKey = useMemo(() => (product.imageKey || '').trim(), [product.imageKey]);
  const fallback = `https://picsum.photos/seed/${product.imageKey || 'zipdam'}/600/600`;
  const initialSrc = cleanKey.startsWith('http') ? cleanKey : (cleanKey ? fallback : `https://picsum.photos/seed/zipdam/600/600`);
  const [imgSrc, setImgSrc] = useState(initialSrc);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        className="relative w-full max-w-md bg-zipdam-surface rounded-3xl overflow-hidden shadow-2xl border border-zipdam-border"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        {/* Top controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product);
            }}
            whileTap={{ scale: 0.9 }}
            animate={favoriteActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={cn(
              "relative w-10 h-10 rounded-full border flex items-center justify-center bg-white/95 backdrop-blur shadow-sm transition-colors",
              favoriteActive ? "text-zipdam-gold border-zipdam-gold/60" : "text-zipdam-muted border-zipdam-border hover:text-zipdam-gold"
            )}
            aria-label="Toggle favorite"
          >
            {favoriteActive && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-zipdam-gold/60"
                initial={{ scale: 0.7, opacity: 0.8 }}
                animate={{ scale: 1.45, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            )}
            {favoriteActive ? (
              <motion.svg
                key="heart-on"
                initial={{ scale: 0.75, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-5 h-5 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 0 1 7.5 3c1.74 0 3.41.81 4.5 2.09A5.97 5.97 0 0 1 16.5 3 5.5 5.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
              </motion.svg>
            ) : (
              <motion.svg
                key="heart-off"
                initial={{ scale: 0.75, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
                preserveAspectRatio="xMidYMid meet"
              >
                <path strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 0 1 7.5 3c1.74 0 3.41.81 4.5 2.09A5.97 5.97 0 0 1 16.5 3 5.5 5.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
              </motion.svg>
            )}
          </motion.button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/95 border border-zipdam-border flex items-center justify-center shadow-sm text-zipdam-muted hover:text-zipdam-text pointer-events-auto"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="bg-gray-50 border-b border-zipdam-border p-4">
          <div className="relative rounded-2xl overflow-hidden border border-gray-100">
            <img
              src={imgSrc}
              alt={product.name}
              onError={() => {
                if (imgSrc !== fallback) setImgSrc(fallback);
              }}
              className="w-full h-full object-cover"
            />
            {isPromo && (
              <div className="absolute top-3 left-3 bg-zipdam-danger text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                {TH.promo}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-zipdam-muted font-semibold uppercase tracking-wide">
            <span className="px-2 py-1 rounded-full bg-zipdam-surface2 border border-zipdam-border">{product.brand}</span>
            <span className="px-2 py-1 rounded-full bg-zipdam-surface2 border border-zipdam-border">{product.size}</span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-zipdam-text leading-tight">{product.name}</h3>
            <p className="text-sm text-zipdam-muted mt-1">{product.type === 'Gel' ? 'เจลหล่อลื่น' : 'ถุงยางอนามัย'}</p>
          </div>

          <div className="flex items-end gap-2">
            {isPromo && <span className="text-sm text-zipdam-muted line-through">{formatTHB(product.price)}</span>}
            <span className={cn("text-2xl font-extrabold", isPromo ? "text-zipdam-danger" : "text-zipdam-gold")}>
              {formatTHB(currentPrice)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.features.map(f => (
              <span key={f} className="text-[11px] px-2 py-1 rounded-lg border border-zipdam-border bg-zipdam-surface2 text-zipdam-text">
                {f}
              </span>
            ))}
          </div>

          <div className="bg-zipdam-surface2 border border-zipdam-border rounded-2xl p-3 text-sm text-zipdam-text">
            <div className="flex justify-between">
              <span className="text-zipdam-muted">บรรจุ</span>
              <span className="font-semibold">{product.packSize} ชิ้น</span>
            </div>
          </div>

          <motion.button
            whileTap={tapScale}
            onClick={() => {
              addToCart(product);
              onClose();
            }}
            className="w-full h-12 bg-zipdam-gradient text-white rounded-2xl font-bold shadow-md shadow-zipdam-gold/30 hover:shadow-lg transition-shadow"
          >
            {TH.add || 'เพิ่ม'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
