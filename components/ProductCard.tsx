import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import { cn } from '../lib/tokens';
import { itemFadeUp, tapScale } from '../lib/motion';
import { useCart } from './CartContext';
import { TH, formatTHB } from '../lib/i18n';
import { useFavorites } from './FavoritesContext';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, items } = useCart();
  const inCartQty = items.find(i => i.id === product.id)?.qty || 0;
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const currentPrice = product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price;
  const isPromo = product.promoPrice && product.promoPrice > 0;
  const cleanKey = useMemo(() => (product.imageKey || '').trim(), [product.imageKey]);
  const fallback = `https://picsum.photos/seed/${product.imageKey || 'zipdam'}/300/300`;
  const initialSrc = cleanKey.startsWith('http') ? cleanKey : (cleanKey ? fallback : `https://picsum.photos/seed/zipdam/300/300`);
  const [imgSrc, setImgSrc] = useState(initialSrc);

  return (
    <motion.div 
      variants={itemFadeUp}
      onClick={() => onSelect?.(product)}
      className="bg-white rounded-2xl p-3 shadow-sm border border-zipdam-border hover:border-zipdam-gold/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-zipdam-gold/10 transition-all duration-300 flex flex-col h-full relative overflow-hidden group cursor-pointer"
    >
      {isPromo && (
        <div className="absolute top-3 left-3 z-10 bg-zipdam-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          {TH.promo}
        </div>
      )}
      {/* Favorite toggle */}
      <button
        type="button"
        aria-label="Toggle favorite"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(product);
        }}
        className={cn(
          "absolute top-3 right-3 z-10 w-9 h-9 rounded-full border flex items-center justify-center bg-white/95 backdrop-blur shadow-sm transition-colors",
          isFavorite(product) ? "text-zipdam-gold border-zipdam-gold/50" : "text-zipdam-muted border-zipdam-border hover:text-zipdam-gold"
        )}
      >
        {isFavorite(product) ? (
          <svg className="w-4.5 h-4.5 overflow-visible fill-current" viewBox="-1 -1 26 26">
            <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-2.54A5 5 0 0 1 19 11c0 5.65-7 10-7 10z" />
          </svg>
        ) : (
          <svg className="w-4.5 h-4.5 overflow-visible" viewBox="-1 -1 26 26" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-2.54A5 5 0 0 1 19 11c0 5.65-7 10-7 10z" />
          </svg>
        )}
      </button>
      
      {/* Image Area - Gray Well for White Theme */}
      <div className="aspect-square w-full rounded-xl bg-gray-50 p-2 mb-3 relative overflow-hidden border border-gray-100">
        <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={imgSrc} 
            alt={product.name}
            onError={() => {
              if (imgSrc !== fallback) setImgSrc(fallback);
            }}
            className="w-full h-full object-cover object-center mix-blend-multiply"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs text-zipdam-muted font-medium uppercase tracking-wide">{product.brand}</p>
          <span className="text-[10px] text-zipdam-muted bg-zipdam-surface2 px-1.5 rounded border border-zipdam-border">{product.size}</span>
        </div>
        
        <h3 className="font-semibold text-zipdam-text text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5em]">
          {product.name}
        </h3>
        
        <div className="flex flex-wrap gap-1 mb-3">
            {product.features.slice(0, 2).map(f => (
                <span key={f} className="text-[10px] text-zipdam-muted border border-zipdam-border px-1 rounded-sm bg-zipdam-surface2">{f}</span>
            ))}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            {isPromo && (
               <span className="text-[11px] text-zipdam-muted line-through">{formatTHB(product.price)}</span>
            )}
            <span className={cn("font-bold text-lg", isPromo ? "text-zipdam-danger" : "text-zipdam-gold")}>
              {formatTHB(currentPrice)}
            </span>
          </div>

          <motion.button
            whileTap={tapScale}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center transition-all border shadow-sm",
              inCartQty > 0 
                ? "bg-zipdam-gradient text-white border-transparent" 
                : "bg-white text-zipdam-text border-zipdam-border hover:border-zipdam-gold"
            )}
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
    </motion.div>
  );
};
