import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import { cn } from '../lib/tokens';
import { itemFadeUp, tapScale } from '../lib/motion';
import { useCart } from './CartContext';
import { TH, formatTHB } from '../lib/i18n';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, items } = useCart();
  const inCartQty = items.find(i => i.id === product.id)?.qty || 0;
  
  const currentPrice = product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price;
  const isPromo = product.promoPrice && product.promoPrice > 0;

  return (
    <motion.div 
      variants={itemFadeUp}
      className="bg-white rounded-2xl p-3 shadow-sm border border-zipdam-border hover:border-zipdam-gold/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-zipdam-gold/10 transition-all duration-300 flex flex-col h-full relative overflow-hidden group"
    >
      {isPromo && (
        <div className="absolute top-2 left-2 z-10 bg-zipdam-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          {TH.promo}
        </div>
      )}
      
      {/* Image Area - Gray Well for White Theme */}
      <div className="aspect-square w-full rounded-xl bg-gray-50 p-2 mb-3 relative overflow-hidden border border-gray-100">
        <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={`https://picsum.photos/seed/${product.imageKey}/300/300`} 
            alt={product.name}
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
            onClick={() => addToCart(product)}
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