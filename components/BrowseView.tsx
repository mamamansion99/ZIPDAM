import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, tapScale } from '../lib/motion';
import { ProductCard } from './ProductCard';
import { cn } from '../lib/tokens';
import { TH } from '../lib/i18n';
import { Product } from '../types';
import { ProductDetailModal } from './ProductDetailModal';

interface BrowseViewProps {
  products: Product[];
}

const BRANDS = ['All', 'Onetouch', 'Okamoto', 'Durex'];
const TYPE_MAP: Record<string, string> = {
  'Condom': TH.filterCondom,
  'Gel': TH.filterGel
};
const TYPES = ['Condom', 'Gel'];

export const BrowseView: React.FC<BrowseViewProps> = ({ products }) => {
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedType, setSelectedType] = useState('Condom');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Derived unique features from the current product set
  const allFeatures = useMemo(() => {
    return Array.from(new Set(products.flatMap(p => p.features)));
  }, [products]);

  const toggleFeature = (f: string) => {
    setSelectedFeatures(prev => 
      prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f]
    );
  };

  const sizeOptions = useMemo(() => {
    const scoped = products.filter(p => {
      const brandMatch = selectedBrand === 'All' || p.brand === selectedBrand;
      const typeMatch = p.type === selectedType;
      return brandMatch && typeMatch;
    });
    const unique = new Set(scoped.map(p => p.size));
    const sorted = Array.from(unique).sort((a, b) => {
      const getNum = (s: string) => {
        const m = s.match(/([0-9]+(?:\.[0-9]+)?)/);
        return m ? parseFloat(m[1]) : Number.POSITIVE_INFINITY;
      };
      return getNum(a) - getNum(b);
    });
    return ['ALL', ...sorted];
  }, [products, selectedType, selectedBrand]);

  const filteredProducts = products.filter(p => {
    const brandMatch = selectedBrand === 'All' || p.brand === selectedBrand;
    const typeMatch = p.type === selectedType;
    const sizeMatch = selectedSize === 'ALL' || p.size === selectedSize;
    const featureMatch = selectedFeatures.length === 0 || p.features.some(f => selectedFeatures.includes(f));
    return brandMatch && typeMatch && sizeMatch && featureMatch;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 pb-24"
    >
      {/* Brand Filter Row */}
      <div className="px-4 overflow-x-auto no-scrollbar py-1">
        <div className="flex gap-2">
          {BRANDS.map(brand => (
             <motion.button
               key={brand}
               whileTap={tapScale}
               onClick={() => setSelectedBrand(brand)}
               className={cn(
                 "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                 selectedBrand === brand 
                   ? "bg-zipdam-gradient text-white border-transparent shadow-zipdam-gold/30" 
                   : "bg-white text-zipdam-muted border-zipdam-border hover:border-zipdam-gold/50"
               )}
             >
               {brand === 'All' ? TH.filterAll : brand}
             </motion.button>
          ))}
        </div>
      </div>

      {/* Type & Features Filter */}
      <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar items-center">
         {/* Type Toggle */}
         <div className="flex bg-zipdam-surface2 p-1 rounded-lg shrink-0 border border-zipdam-border">
            {TYPES.map(type => (
               <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                     "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                     selectedType === type 
                       ? "bg-zipdam-surface text-zipdam-gold shadow-sm ring-1 ring-black/5" 
                       : "text-zipdam-muted hover:text-zipdam-text"
                  )}
               >
                  {TYPE_MAP[type] || type}
               </button>
            ))}
         </div>
         
         <div className="w-[1px] bg-zipdam-border mx-1 h-6 self-center"></div>

         {/* Size filter */}
         <div className="flex items-center gap-2 shrink-0">
           <span className="text-xs font-semibold text-zipdam-muted">{TH.filterSize}</span>
           <div className="flex gap-1">
             {sizeOptions.map(size => (
               <button
                 key={size}
                 onClick={() => setSelectedSize(size)}
                 className={cn(
                   "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap",
                   selectedSize === size
                     ? "bg-zipdam-gold/10 border-zipdam-gold text-zipdam-gold"
                     : "bg-white border-zipdam-border text-zipdam-muted hover:border-zipdam-muted"
                 )}
               >
                 {size === 'ALL' ? TH.filterSizeAll : size}
               </button>
             ))}
           </div>
         </div>

         <div className="w-[1px] bg-zipdam-border mx-1 h-6 self-center"></div>

         {/* Features Chips */}
         {allFeatures.map(feat => (
            <button
               key={feat}
               onClick={() => toggleFeature(feat)}
               className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
                  selectedFeatures.includes(feat)
                    ? "bg-zipdam-gold/10 border-zipdam-gold text-zipdam-gold"
                    : "bg-white border-zipdam-border text-zipdam-muted hover:border-zipdam-muted"
               )}
            >
               {feat}
            </button>
         ))}
      </div>

      {/* Grid */}
      <div className="px-4 grid grid-cols-2 gap-3 mt-4">
         {filteredProducts.map(p => (
            <ProductCard key={p.id} product={p} onSelect={setSelectedProduct} />
         ))}
         {filteredProducts.length === 0 && (
            <div className="col-span-2 py-10 text-center text-zipdam-muted text-sm">
               {TH.emptyBrowse}
            </div>
         )}
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
